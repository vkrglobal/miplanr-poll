const { json, cleanEmail, safeArray } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return json(200, { ok: false, message: 'RESEND_API_KEY not set yet. WhatsApp sharing still works.' });
    const body = JSON.parse(event.body || '{}');
    const recipients = safeArray(body.recipients).map(cleanEmail).filter(Boolean);
    if (!recipients.length) return json(200, { ok: false, message: 'No email recipients found.' });
    const pollUrl = body.url || 'https://miplanr.com';
    const question = body.question || 'miPlanr poll';
    const deadline = body.deadline ? `<p style="color:#64748b">Closes: <strong>${body.deadline}</strong></p>` : '';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;background:#f4f7fc;padding:28px">
        <div style="background:#0A1A4D;color:white;padding:22px;border-radius:16px 16px 0 0">
          <h1 style="margin:0;font-size:24px">miPlanr Poll</h1>
          <p style="margin:6px 0 0;color:#9bdcff">Dream • Plan • Soar</p>
        </div>
        <div style="background:white;padding:26px;border-radius:0 0 16px 16px">
          <p>Hi,</p>
          <p><strong>${body.creator || 'Someone'}</strong> has invited you to vote on:</p>
          <h2 style="color:#0A1A4D">${question}</h2>
          ${deadline}
          <p><a href="${pollUrl}" style="display:inline-block;background:#0072FF;color:white;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold">Vote now</a></p>
          <p style="font-size:13px;color:#64748b">Or copy this link:<br><a href="${pollUrl}">${pollUrl}</a></p>
        </div>
      </div>`;

    const sends = await Promise.all(recipients.map(to => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: 'miPlanr <poll@mail.miplanr.com>',
        to,
        subject: body.subject || `Please vote: ${question}`,
        html
      })
    }).then(async res => ({ to, ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }))));

    const failed = sends.filter(x => !x.ok);
    return json(failed.length ? 207 : 200, { ok: failed.length === 0, results: sends });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
