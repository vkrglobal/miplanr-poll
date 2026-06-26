const { json } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return json(200, { ok: false, message: 'RESEND_API_KEY not set yet. WhatsApp sharing still works.' });
    const body = JSON.parse(event.body || '{}');
    const emails = (body.recipients || []).filter(x => String(x).includes('@'));
    if (!emails.length) return json(200, { ok: false, message: 'No email recipients found.' });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: 'miPlanr <poll@mail.miplanr.com>',
        to: emails,
        subject: body.subject || 'Please vote in this miPlanr poll',
        html: `<p>${body.message || 'Please vote in this miPlanr poll.'}</p><p><a href="${body.url}">${body.url}</a></p>`
      })
    });
    const data = await res.json();
    return json(res.ok ? 200 : 500, data);
  } catch (e) {
    return json(500, { error: e.message });
  }
};
