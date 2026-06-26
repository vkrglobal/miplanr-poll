const { json, sb } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  try {
    const slug = event.queryStringParameters?.slug;
    if (!slug) return json(400, { error: 'Missing poll slug.' });
    const polls = await sb(`polls?slug=eq.${encodeURIComponent(slug)}&select=*`);
    const poll = polls[0];
    if (!poll) return json(404, { error: 'Poll not found.' });
    const options = await sb(`poll_options?poll_id=eq.${poll.id}&select=*&order=sort_order.asc`);
    const participants = await sb(`participants?poll_id=eq.${poll.id}&select=*`);
    const votes = await sb(`votes?poll_id=eq.${poll.id}&select=*`);
    const counts = Object.fromEntries(options.map(o => [o.id, 0]));
    votes.forEach(v => { counts[v.option_id] = (counts[v.option_id] || 0) + 1; });
    return json(200, { ok: true, poll, options, participants, votes, counts, totalVotes: votes.length });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
