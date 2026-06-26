const { json, sb } = require('./_supabase');

function makeSlug() {
  return Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36).slice(-4);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  try {
    const body = JSON.parse(event.body || '{}');
    const question = String(body.question || '').trim();
    const eventTitle = String(body.eventTitle || body.event_title || question).trim();
    const creatorName = String(body.creatorName || body.creator_name || body.creator || 'miPlanr').trim();
    const deadline = String(body.deadline || '').trim();
    const threshold = Math.max(1, parseInt(body.threshold || 3, 10));
    const options = Array.isArray(body.options) ? body.options.map(x => String(x).trim()).filter(Boolean) : [];
    const participants = Array.isArray(body.participants) ? body.participants.map(x => String(x).trim()).filter(Boolean) : [];
    const startAt = body.startAt || body.start_at || null;
    const endAt = body.endAt || body.end_at || null;
    const startDate = body.startDate || body.start_date || null;
    const startTime = body.startTime || body.start_time || null;
    const endDate = body.endDate || body.end_date || null;
    const endTime = body.endTime || body.end_time || null;

    if (!question) return json(400, { error: 'Poll question is required.' });
    if (options.length < 2) return json(400, { error: 'Please add at least two options.' });

    const [poll] = await sb('polls', {
      method: 'POST',
      body: JSON.stringify({
        slug: makeSlug(),
        question,
        event_title: eventTitle,
        creator_name: creatorName,
        deadline,
        threshold,
        start_at: startAt,
        end_at: endAt,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime
      })
    });

    await sb('poll_options', {
      method: 'POST',
      body: JSON.stringify(options.map((label, i) => ({ poll_id: poll.id, label, sort_order: i })))
    });

    if (participants.length) {
      await sb('participants', {
        method: 'POST',
        body: JSON.stringify(participants.map(value => ({
          poll_id: poll.id,
          email: value.includes('@') ? value : null,
          name_or_email: value
        })))
      });
    }

    return json(200, { poll, url: `/poll/${encodeURIComponent(poll.slug)}` });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
