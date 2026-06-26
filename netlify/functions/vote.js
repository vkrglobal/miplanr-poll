const { json, sb } = require('./_supabase');

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

    return json(200, { vote });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
