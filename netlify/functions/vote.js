const { json, sb } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body.poll_id || !body.option_id) return json(400, { error: 'Missing poll or option.' });
    const rows = await sb('votes', { method: 'POST', body: JSON.stringify({
      poll_id: body.poll_id,
      option_id: body.option_id,
      voter_name: String(body.voter_name || '').trim(),
      voter_email: String(body.voter_email || '').trim().toLowerCase()
    }) });
    return json(200, { ok: true, vote: rows[0] });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
