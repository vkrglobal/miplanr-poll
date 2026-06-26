const { json, getSupabase, slugify, iconFor, sendEmail } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const db = getSupabase();
    const body = JSON.parse(event.body || '{}');
    const title = body.title || body.question || 'miPlanr Poll';
    const slug = slugify(title);
    const options = (body.options || []).map(x => String(x).trim()).filter(Boolean);
    const emails = [...new Set((body.participants || []).map(x => String(x).trim().toLowerCase()).filter(Boolean))];
    if (!body.question || options.length < 2) return json(400, { error: 'Please enter a question and at least two options.' });

    const { data: poll, error: pollError } = await db.from('polls').insert({
      slug,
      title,
      question: body.question,
      description: body.description || '',
      category: body.category || '',
      icon: iconFor(`${title} ${body.question}`),
      creator_name: body.creatorName || 'miPlanr Creator',
      creator_email: body.creatorEmail || null,
      location: body.location || '',
      start_at: body.startAt || null,
      end_at: body.endAt || null,
      deadline_at: body.deadlineAt || null,
      threshold: Number(body.threshold || 3),
      allow_vote_edit: body.allowVoteEdit !== false,
      notify_email: body.notifyEmail !== false,
      notify_whatsapp: !!body.notifyWhatsApp
    }).select('*').single();
    if (pollError) throw pollError;

    const optionRows = options.map((option_text, i) => ({ poll_id: poll.id, option_text, icon: iconFor(option_text), sort_order: i }));
    const { error: optError } = await db.from('poll_options').insert(optionRows);
    if (optError) throw optError;

    let participants = [];
    if (emails.length) {
      const rows = emails.map(email => ({ poll_id: poll.id, email, name: email.split('@')[0] }));
      const { data, error } = await db.from('participants').insert(rows).select('*');
      if (error) throw error;
      participants = data || [];
    }

    const site = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://miplanr.com';
    const pollLink = `${site}/poll.html?slug=${encodeURIComponent(slug)}`;

    const emailResults = [];
    for (const p of participants) {
      const inviteLink = `${pollLink}&invite=${encodeURIComponent(p.invite_token)}`;
      try {
        if (body.sendEmails !== false) {
          await sendEmail({
            to: p.email,
            subject: `🗳️ ${body.creatorName || 'Someone'} invited you to vote on ${title}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0A1A4D"><h1>${poll.icon} ${title}</h1><p>${body.creatorName || 'The organiser'} invited you to vote on:</p><h2>${body.question}</h2><p>${body.description || ''}</p><p><b>Location:</b> ${body.location || 'TBC'}</p><p><a href="${inviteLink}" style="display:inline-block;background:#0072FF;color:white;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Vote now</a></p><p style="color:#6B7A99;font-size:13px">You can edit your vote before the deadline, but this invitation only counts as one vote.</p><p>Dream • Plan • Soar<br><b>miPlanr</b></p></div>`
          });
        }
        emailResults.push({ email: p.email, sent: true });
      } catch (err) {
        emailResults.push({ email: p.email, sent: false, error: err.message });
      }
    }

    return json(200, { poll, pollLink, participants: participants.map(p => ({ email: p.email, inviteLink: `${pollLink}&invite=${p.invite_token}` })), emailResults });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
