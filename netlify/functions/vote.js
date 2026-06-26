const { json, sb } = require('./_supabase');

async function sendQuorumEmail({ poll, options, counts, totalVotes }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY || poll.quorum_notified_at) return { skipped: true };
  const threshold = poll.threshold || 1;
  if (totalVotes < threshold) return { skipped: true };
  let winner = options[0];
  for (const opt of options) if ((counts[opt.id] || 0) > (counts[winner.id] || 0)) winner = opt;
  const participants = await sb(`participants?poll_id=eq.${encodeURIComponent(poll.id)}&select=email,name_or_email`);
  const recipients = [...new Set(participants.map(p => p.email || p.name_or_email).filter(v => String(v || '').includes('@')))];
  if (!recipients.length) return { skipped: true };
  const pollUrl = `https://miplanr.com/poll/${encodeURIComponent(poll.slug)}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px"><h1>🎉 Poll successful!</h1><p>The miPlanr poll has reached quorum.</p><h2>${poll.question}</h2><p><strong>Winning option:</strong> ${winner.label}</p><p><strong>Total votes:</strong> ${totalVotes} of ${threshold}</p><p><a href="${pollUrl}" style="display:inline-block;background:#0072FF;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">View poll results</a></p><p style="color:#6B7A99">miPlanr — Dream • Plan • Soar</p></div>`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: 'miPlanr <poll@mail.miplanr.com>',
      to: recipients,
      subject: `🎉 miPlanr poll successful: ${poll.question}`,
      html
    })
  });
  await sb(`polls?id=eq.${encodeURIComponent(poll.id)}`, { method: 'PATCH', body: JSON.stringify({ quorum_notified_at: new Date().toISOString() }) });
  return { sent: true, recipients: recipients.length };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const body = JSON.parse(event.body || '{}');
    const pollId = body.pollId || body.poll_id;
    const optionId = body.optionId || body.option_id;
    if (!pollId || !optionId) return json(400, { error: 'Missing poll or option.' });

    const [vote] = await sb('votes', {
      method: 'POST',
      body: JSON.stringify({
        poll_id: pollId,
        option_id: optionId,
        voter_name: String(body.voterName || body.voter_name || '').trim(),
        voter_email: String(body.voterEmail || body.voter_email || '').trim()
      })
    });

    const [poll] = await sb(`polls?id=eq.${encodeURIComponent(pollId)}&select=*`);
    const options = await sb(`poll_options?poll_id=eq.${encodeURIComponent(pollId)}&select=*&order=sort_order.asc`);
    const votes = await sb(`votes?poll_id=eq.${encodeURIComponent(pollId)}&select=option_id`);
    const counts = {};
    for (const v of votes) counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    const totalVotes = votes.length;
    const notify = await sendQuorumEmail({ poll, options, counts, totalVotes }).catch(e => ({ error: e.message }));

    return json(200, { vote, quorumReached: totalVotes >= (poll.threshold || 1), notify });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
