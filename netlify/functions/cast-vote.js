const { client } = require('./_supabase');

async function saveVote(sb, vote){
  // Do not rely on ON CONFLICT. Older Supabase projects may not yet have the
  // matching unique/exclusion constraint, which causes: "there is no unique or
  // exclusion constraint matching the ON CONFLICT specification".
  const key = vote.invite_token ? { invite_token: vote.invite_token } : { voter_email: vote.voter_email };
  let q = sb.from('votes').select('*').eq('poll_id', vote.poll_id);
  if(key.invite_token) q = q.eq('invite_token', key.invite_token);
  else q = q.eq('voter_email', key.voter_email);
  const { data: existing, error: findError } = await q.maybeSingle();
  if(findError) throw findError;
  if(existing){
    return await sb.from('votes')
      .update({ option_id: vote.option_id, participant_id: vote.participant_id, voter_name: vote.voter_name, voter_email: vote.voter_email, updated_at: vote.updated_at })
      .eq('id', existing.id).select('*').single();
  }
  const inserted = await sb.from('votes').insert(vote).select('*').single();
  if(!inserted.error) return inserted;
  // Race-condition fallback: if another request inserted first, update that vote.
  let q2 = sb.from('votes').select('*').eq('poll_id', vote.poll_id);
  if(key.invite_token) q2 = q2.eq('invite_token', key.invite_token);
  else q2 = q2.eq('voter_email', key.voter_email);
  const { data: again } = await q2.maybeSingle();
  if(again){
    return await sb.from('votes')
      .update({ option_id: vote.option_id, participant_id: vote.participant_id, voter_name: vote.voter_name, voter_email: vote.voter_email, updated_at: vote.updated_at })
      .eq('id', again.id).select('*').single();
  }
  return inserted;
}

exports.handler = async (event) => {
  try {
    const b = JSON.parse(event.body || '{}');
    const sb = client();
    const { data: p, error: pe } = await sb.from('polls').select('*').eq('slug', b.slug).single();
    if (pe) throw pe;
    if (p.deadline_at && new Date(p.deadline_at) < new Date()) throw new Error('Voting deadline has passed');

    let participant = null;
    if (b.invite_token) {
      const { data: part } = await sb.from('participants').select('*').eq('invite_token', b.invite_token).maybeSingle();
      participant = part || null;
    }

    const email = (b.voter_email || participant?.email || '').trim().toLowerCase();
    const vote = {
      poll_id: p.id,
      option_id: b.option_id,
      participant_id: participant?.id || null,
      invite_token: b.invite_token || null,
      voter_name: (b.voter_name || '').trim(),
      voter_email: email,
      updated_at: new Date().toISOString()
    };

    if (!vote.invite_token && !vote.voter_email) throw new Error('Please use your invite link or enter email to vote.');

    const result = await saveVote(sb, vote);
    if (result.error) throw result.error;
    if (participant) await sb.from('participants').update({ has_voted: true }).eq('id', participant.id);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
