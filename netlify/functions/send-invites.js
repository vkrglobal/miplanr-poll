const { json } = require('./_supabase');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return json(200, { ok: false, message: 'RESEND_API_KEY is not set yet. WhatsApp sharing still works.' });

    const body = JSON.parse(event.body || '{}');
    const emails = (body.recipients || []).map(x => String(x).trim()).filter(x => x.includes('@'));
    if (!emails.length) return json(200, { ok: false, message: 'No email recipients found.' });

    const question = escapeHtml(body.question || 'miPlanr poll');
    const creator = escapeHtml(body.creator || 'Someone');
    const deadline = escapeHtml(body.deadline || 'soon');
    const url = String(body.url || '');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: 'miPlanr <poll@mail.miplanr.com>',
        to: emails,
        subject: body.subject || `${creator} invited you to vote on a miPlanr poll`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#F4F7FC;padding:28px;color:#0A1A4D">
            <div style="max-width:560px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #E2E8F4">
              <div style="background:#0A1A4D;color:white;padding:24px">
                <div style="font-size:24px;font-weight:800;color:#00C6FF">miPlanr</div>
                <p style="margin:8px 0 0;color:#D9E5FF">Dream • Plan • Soar</p>
              </div>
              <div style="padding:28px">
                <p style="font-size:16px;margin-top:0"><strong>${creator}</strong> invited you to vote on:</p>
                <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${question}</h1>
                <p style="color:#6B7A99">Poll closes: ${deadline}</p>
                <p><a href="${url}" style="display:inline-block;background:#0072FF;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:800">Vote now</a></p>
                <p style="font-size:13px;color:#6B7A99;word-break:break-all">${url}</p>
              </div>
            </div>
          </div>`
      })
    });

    const data = await res.json().catch(() => ({}));
    return json(res.ok ? 200 : 500, { ok: res.ok, ...data });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
