# miPlanr Poll v5.0 Clean Production Foundation

This package is a clean reset to avoid mixed-version issues.

## Features
- Supabase-backed polls
- One invitation = one editable vote
- Email invitations using Resend
- WhatsApp sharing
- Google Calendar and Outlook links with location
- Smart date/time defaults
- Smart icons for countries, sports, foods, places and common activities
- Optional OpenAI translation button
- Quorum celebration email to creator
- Google Sites embed support

## Required Netlify environment variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY

## Optional
- OPENAI_API_KEY for translation

## Install
1. Backup your current miplanr-poll folder.
2. Copy this package into your GitHub folder.
3. Run supabase/schema.sql in Supabase SQL Editor.
4. Commit and push with GitHub Desktop.
5. Wait for Netlify Published.
6. Test with a fresh poll.


Google Places autocomplete: add Netlify environment variable GOOGLE_MAPS_API_KEY to enable real address suggestions while typing locations. Restrict the key in Google Cloud for security.
