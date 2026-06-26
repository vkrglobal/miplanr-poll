const { json, getSupabase, sendEmail } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const db = getSupabase();
    const body = JSON.parse(event.body || '{}');
    const { pollSlug, inviteToken, optionId, voterName, voterEmail } = body;
    if (!pollSlug || !optionId) return json(400, { error: 'Missing poll or option.' });

    const { data: poll, error: pollError } = await db.from('polls').select('*').eq('slug', pollSlug).single();
    if (pollError) throw pollError;
    if (poll.deadline_at && new Date(poll.deadline_at) < new Date()) return json(400, { error: 'Voting is closed.' });

    let participant = null;
    if (inviteToken) {
      const { data, error } = await db.from('participants').select('*').eq('invite_token', inviteToken).eq('poll_id', poll.id).maybeSingle();
      if (error) throw error;
      participant = data;
    }

    const row = { poll_id: poll.id, option_id: optionId, voter_name: voterName || participant?.name || '', voter_email: voterEmail || participant?.email || null, updated_at: new Date().toISOString() };
    if (participant) row.participant_id = participant.id;

    let voteResult;
    if (participant) {
      voteResult = await db.from('votes').upsert(row, { onConflict: 'poll_id,participant_id' }).select('*').single();
    } else {
      if (!row.voter_email) return json(400, { error: 'Please enter your email to vote.' });
      voteResult = await db.from('votes').upsert(row, { onConflict: 'poll_id,voter_email' }).select('*').single();
    }
    if (voteResult.error) throw voteResult.error;

    const { data: votes } = await db.from('votes').select('option_id, participant_id, voter_email').eq('poll_id', poll.id);
    const totalVotes = new Set((votes || []).map(v => v.participant_id || v.voter_email)).size;

    if (totalVotes >= (poll.threshold || 3) && !poll.quorum_notified_at) {
      const { data: options } = await db.from('poll_options').select('*').eq('poll_id', poll.id);
      const counts = {};
      (votes || []).forEach(v => counts[v.option_id] = (counts[v.option_id] || 0) + 1);
      const winner = (options || []).sort((a,b) => (counts[b.id]||0) - (counts[a.id]||0))[0];
      if (poll.creator_email && poll.notify_email) {
        await sendEmail({
          to: poll.creator_email,
          subject: `🎉 Poll complete: ${poll.title}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0A1A4D"><h1>🎉 Poll successful!</h1><p>Your quorum has been met.</p><h2>${poll.question}</h2><p><b>Winning option:</b> ${winner?.icon || '🏆'} ${winner?.option_text || 'TBC'}</p><p><b>Total votes:</b> ${totalVotes}</p><p>Dream • Plan • Soar<br><b>miPlanr</b></p></div>`
        });
      }
      await db.from('polls').update({ quorum_notified_at: new Date().toISOString() }).eq('id', poll.id);
    }

    return json(200, { vote: voteResult.data, totalVotes });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
