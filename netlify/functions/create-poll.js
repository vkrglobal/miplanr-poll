const { json, sb } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' });

  try {
    const body = JSON.parse(event.body || '{}');
    const question = String(body.question || '').trim();
    const options = Array.isArray(body.options) ? body.options.map(x => String(x).trim()).filter(Boolean) : [];
    const participants = Array.isArray(body.participants) ? body.participants.map(x => String(x).trim()).filter(Boolean) : [];
    if (!question) return json(400, { error: 'Question is required.' });
    if (options.length < 2) return json(400, { error: 'At least two options are required.' });

    const [poll] = await sb('polls', {
      method: 'POST',
      body: JSON.stringify({
        question,
        event_title: String(body.eventTitle || question).trim(),
        creator_name: String(body.creatorName || 'Josh Sim').trim(),
        deadline: String(body.deadline || '').trim(),
        threshold: Number(body.threshold || 1)
      })
    });

    await sb('poll_options', {
      method: 'POST',
      body: JSON.stringify(options.map((label, i) => ({ poll_id: poll.id, label, sort_order: i })))
    });

    if (participants.length) {
      await sb('participants', {
        method: 'POST',
        body: JSON.stringify(participants.map(name_or_email => ({ poll_id: poll.id, name_or_email })))
      });
    }

    return json(200, { poll, url: `/poll.html?slug=${encodeURIComponent(poll.slug)}` });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
