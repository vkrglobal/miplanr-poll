const { json } = require('./_supabase');
exports.handler = async () => json(200, { message: 'WhatsApp one-click sharing works in the browser. Business API automation needs Meta phone number ID, access token and approved templates before enabling.' });
