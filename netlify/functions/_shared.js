const { createClient } = require('@supabase/supabase-js');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment variables');
  return createClient(url, key, { auth: { persistSession: false } });
}

function slugify(input) {
  const base = String(input || 'poll').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'poll';
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

function iconFor(text) {
  const t = String(text || '').toLowerCase();
  const countries = { greece:'🇬🇷', greek:'🇬🇷', albania:'🇦🇱', turkey:'🇹🇷', france:'🇫🇷', spain:'🇪🇸', italy:'🇮🇹', portugal:'🇵🇹', mexico:'🇲🇽', argentina:'🇦🇷', 'new zealand':'🇳🇿', nz:'🇳🇿', uk:'🇬🇧', england:'🏴', usa:'🇺🇸', america:'🇺🇸' };
  for (const [k,v] of Object.entries(countries)) if (t.includes(k)) return v;
  const map = [
    ['banana','🍌'],['apple','🍎'],['pizza','🍕'],['food','🍽️'],['restaurant','🍽️'],['coffee','☕'],['bbq','🔥'],
    ['football','⚽'],['rugby','🏉'],['tennis','🎾'],['gym','🏋️'],['run','🏃'],['sport','🏅'],
    ['holiday','✈️'],['travel','✈️'],['beach','🏖️'],['snow','❄️'],['sun','☀️'],['sunny','☀️'],['hotel','🏨'],
    ['church','⛪'],['school','🏫'],['class','🎓'],['work','💼'],['meeting','👥'],['zoom','💻'],['teams','💻'],
    ['birthday','🎂'],['party','🎉'],['cinema','🎬'],['movie','🎬'],['park','🌳'],['southampton','📍'],['london','📍'],['home','🏠'],
    ['yes','✅'],['no','❌'],['maybe','🤔'],['other','🌍']
  ];
  const hit = map.find(([k]) => t.includes(k));
  return hit ? hit[1] : '✨';
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !to) return { skipped: true };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'miPlanr <poll@mail.miplanr.com>', to, subject, html })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);
  return data;
}

module.exports = { json, getSupabase, slugify, iconFor, sendEmail };
