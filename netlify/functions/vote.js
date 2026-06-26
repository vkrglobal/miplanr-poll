const { json, sb } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body.pollId || !body.optionId) return json(400, { error: 'Missing pollId or optionId.' });
    const [vote] = await sb('votes', {
      method: 'POST',
      body: JSON.stringify({
        poll_id: body.pollId,
        option_id: body.optionId,
        voter_name: String(body.voterName || '').trim(),
        voter_email: String(body.voterEmail || '').trim()
      })
    });
    return json(200, { vote });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
