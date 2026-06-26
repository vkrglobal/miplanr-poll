const { json, sb } = require('./_supabase');
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const body = JSON.parse(event.body || '{}');
    const [request] = await sb('integration_requests', {
      method: 'POST',
      body: JSON.stringify({
        poll_id: body.poll_id || null,
        integration_name: String(body.integration_name || '').trim(),
        requester_email: String(body.requester_email || '').trim()
      })
    });
    return json(200, { ok: true, request });
  } catch (e) {
    return json(200, { ok: false, message: e.message });
  }
};
