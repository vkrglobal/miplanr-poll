const { json, sb, slugify, safeArray, cleanEmail } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });
  try {
    const body = JSON.parse(event.body || '{}');
    const question = String(body.question || '').trim();
    const options = safeArray(body.options).map(x => String(x || '').trim()).filter(Boolean);
    const participants = safeArray(body.participants).map(cleanEmail).filter(Boolean);
    if (!question) return json(400, { error: 'Question is required.' });
    if (options.length < 2) return json(400, { error: 'Add at least two options.' });

    let poll = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = slugify();
      try {
        const rows = await sb('polls', { method: 'POST', body: JSON.stringify({
          slug,
          question,
          event_title: String(body.event_title || question).trim(),
          creator: String(body.creator || 'miPlanr user').trim(),
          deadline: String(body.deadline || '').trim(),
          threshold: Math.max(1, parseInt(body.threshold || '1', 10) || 1),
          status: 'open'
        }) });
        poll = rows[0];
        break;
      } catch (e) {
        if (!String(e.message).includes('duplicate')) throw e;
      }
    }
    if (!poll) return json(500, { error: 'Could not create a unique poll link. Please try again.' });

    await sb('poll_options', { method: 'POST', body: JSON.stringify(options.map((label, i) => ({ poll_id: poll.id, label, sort_order: i }))) });
    if (participants.length) {
      await sb('participants', { method: 'POST', body: JSON.stringify(participants.map(email => ({ poll_id: poll.id, email }))) });
    }

    return json(200, { ok: true, poll, url: `/poll/${poll.slug}`, participants });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
