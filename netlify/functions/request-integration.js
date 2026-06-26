const { json, sb } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body.integration_name) return json(400, { error: 'Missing integration name.' });
    const rows = await sb('integration_requests', { method: 'POST', body: JSON.stringify({
      poll_id: body.poll_id || null,
      integration_name: String(body.integration_name),
      requester_email: String(body.requester_email || '')
    }) });
    return json(200, { ok: true, request: rows[0] });
  } catch (e) { return json(500, { error: e.message }); }
};
