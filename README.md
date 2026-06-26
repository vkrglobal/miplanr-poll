# miPlanr Poll v2 Full

Database-backed poll MVP for Netlify + Supabase.

## Includes

- `index.html` — create polls
- `poll.html` — vote on polls
- `netlify/functions/create-poll.js` — creates polls in Supabase
- `netlify/functions/get-poll.js` — loads polls and vote counts
- `netlify/functions/vote.js` — records votes
- `netlify/functions/send-invites.js` — Resend-ready email invite function
- `supabase/schema.sql` — database schema
- `guide.html` — dummies setup guide

## Environment variables in Netlify

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `RESEND_API_KEY`

## WhatsApp

One-click WhatsApp sharing works immediately. Automatic sending requires WhatsApp Business API later.
