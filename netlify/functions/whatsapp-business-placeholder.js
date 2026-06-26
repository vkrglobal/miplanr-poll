const { json } = require('./_supabase');
exports.handler = async () => json(200, { ok: true, message: 'WhatsApp Business API placeholder. Current MVP supports one-click WhatsApp sharing.' });
