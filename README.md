# miPlanr Poll 2.0 + 2.1

## What this version does

- Clear 3-step create flow: Build → Invite → Create & Share
- Supabase-backed poll storage
- Real vote counts and real percentages
- Resend email invitations
- WhatsApp sharing
- Copy/open poll links
- Google Calendar and Outlook links on the voting page
- 2.1 integration-ready buttons for ChurchSuite, iSAMS, EduLink, Classroom, Salesforce, HubSpot, Teamo and SportsEngine

## Required Netlify environment variables

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY

## Database setup

Run `supabase/schema.sql` in Supabase SQL Editor.
