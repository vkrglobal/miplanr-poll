# miPlanr Poll v6.5 Polished

Free-first smart event polling with:

- Fixed Create Poll error handling
- Stronger country/food/sport icon matching (NZ, UK, Greece, tomato, kiwifruit, mango, etc.)
- Dummy-proof date/time entry
- Date format guidance: `dd-mmm-yy`, e.g. `26-Jun-26`
- Time format guidance: `am/pm`, e.g. `8:00 am`, `6:30 pm`
- Date presets: Next 30 mins, Today, Tomorrow
- Duration unit selector: minutes, hours, days
- Duration slider
- Free-first OpenStreetMap location suggestions
- Supabase + Resend support

## Install

1. Backup current `miplanr-poll` folder.
2. Extract this ZIP.
3. Copy everything into your GitHub `miplanr-poll` folder.
4. Run `supabase/schema.sql` in Supabase SQL Editor.
5. Commit all changes in GitHub Desktop.
6. Push origin.
7. Wait for Netlify to publish.
8. Test a brand-new poll.

## Required Netlify variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` optional for emails

## Optional variables

- `OPENAI_API_KEY` for future AI translation/localisation
- `GOOGLE_MAPS_API_KEY` for premium Google Places later


V6.4 fixes: uses real flag images for country options, adds date picker fields, and adds Supabase unique vote constraints so one invitation/email updates the existing vote instead of creating duplicates.
