const { json, sb } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  try {
    const slug = event.queryStringParameters && event.queryStringParameters.slug;
    if (!slug) return json(400, { error: 'Missing slug.' });

    const polls = await sb(`polls?slug=eq.${encodeURIComponent(slug)}&select=*`);
    if (!polls.length) return json(404, { error: 'Poll not found.' });
    const poll = polls[0];
    const options = await sb(`poll_options?poll_id=eq.${poll.id}&select=*&order=sort_order.asc`);
    const votes = await sb(`votes?poll_id=eq.${poll.id}&select=*`);
    const participants = await sb(`participants?poll_id=eq.${poll.id}&select=*`);

    const counts = Object.fromEntries(options.map(o => [o.id, 0]));
    votes.forEach(v => { counts[v.option_id] = (counts[v.option_id] || 0) + 1; });

    return json(200, { poll, options, participants, votes, counts });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
