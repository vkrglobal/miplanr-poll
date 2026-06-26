const { json, getSupabase } = require('./_shared');

exports.handler = async (event) => {
  try {
    const db = getSupabase();
    const slug = event.queryStringParameters.slug;
    const invite = event.queryStringParameters.invite;
    if (!slug) return json(400, { error: 'Missing poll slug' });

    const { data: poll, error } = await db.from('polls').select('*').eq('slug', slug).single();
    if (error) throw error;

    const [{ data: options }, { data: votes }, { data: participant }] = await Promise.all([
      db.from('poll_options').select('*').eq('poll_id', poll.id).order('sort_order'),
      db.from('votes').select('id, option_id, voter_name, voter_email, participant_id, updated_at').eq('poll_id', poll.id),
      invite ? db.from('participants').select('*').eq('invite_token', invite).eq('poll_id', poll.id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    const participantVote = participant ? (votes || []).find(v => v.participant_id === participant.id) : null;
    const totalVotes = new Set((votes || []).map(v => v.participant_id || v.voter_email || v.id)).size;
    const counts = {};
    for (const o of options || []) counts[o.id] = 0;
    for (const v of votes || []) counts[v.option_id] = (counts[v.option_id] || 0) + 1;

    return json(200, { poll, options: options || [], totalVotes, counts, participant, participantVote });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
