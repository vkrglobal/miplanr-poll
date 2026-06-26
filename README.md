# miPlanr Poll 2.0 + 2.1

## 2.0 Polling core
- Supabase-backed polls
- Real persistent votes only
- Percentages based on total votes per option
- Threshold progress
- WhatsApp sharing
- Resend email invitations
- Google Calendar / Outlook event links

## 2.1 Integration-ready layer
- ChurchSuite
- iSAMS
- EduLink
- Google Classroom
- Salesforce
- HubSpot
- Teamo
- SportsEngine

These initially record integration requests. Direct OAuth/API sync should come after the polling MVP is stable.

## Required Netlify environment variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY

## Setup
1. Run `supabase/schema.sql` in Supabase.
2. Add environment variables in Netlify.
3. Commit and push all files.
4. Test `/index.html`.
