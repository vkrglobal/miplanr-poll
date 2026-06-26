# miPlanr Poll v3.0

## Includes
- Secure invitation tokens: one invite = one editable vote.
- Vote updates before deadline instead of duplicate votes.
- Location saved to poll and included in Google/Outlook calendar links.
- Smart icons for common countries, foods, sports, holidays and locations.
- Quorum celebration email to organiser via Resend.
- Supabase-backed storage.
- Netlify Functions backend.
- Google Sites integration guide.

## Required Netlify environment variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY

## Install
1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Copy files into your GitHub repo.
3. Commit and push.
4. Wait for Netlify deploy.
5. Test a brand-new poll.
