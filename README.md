# miPlanr Events & Polls v4.1

This fixes the v4 deployment issue caused by Supabase realtime requiring the `ws` package in Netlify Node 18.

Included:
- One invite = one editable vote
- Location passed to Google/Outlook Calendar
- Smart defaults for date/time
- Smart icons
- Preview button
- Translate button for title/question/description/options
- Supabase schema
- Resend email invites
- Google Sites embed file

Required Netlify variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY

Optional:
- OPENAI_API_KEY for translation
- OPENAI_MODEL if you want to override the default translation model
