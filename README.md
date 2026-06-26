# miPlanr Poll v6.7 voting refresh fix

This version fixes the Cast my vote display issue. After a vote is saved, the poll immediately fetches the latest results from Supabase and redraws the vote totals.

Also includes the v6.6 expanded icon range for sports teams, countries, football, rugby, NFL, cricket and beverages.

Deployment: upload the folder contents to Netlify, then hard refresh the browser with Ctrl+F5.

Important: if an older Supabase project is being used, run the included `supabase/schema.sql` once in Supabase SQL Editor to ensure all voting columns/indexes exist.
