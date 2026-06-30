# miPlanr Poll v8.0.3

Updates in this release:

- Poll consolidation: if a new poll has the same title, question, poll type and options/date-times as an existing poll, miPlanr reuses the existing poll record so all responses appear in the same results database.
- Calendar quorum clarification: quorum is counted per date/time option. One person selecting two dates creates one availability vote on each selected date, not two votes towards the same date.
- Admin-controlled results visibility remains in place: team results are shown only when the administrator allows it.
- Share message remains editable and auto-suggested from the title/question.

Important database step:
Run `supabase/schema.sql` in Supabase SQL Editor after deploying this release so the new `poll_group_key` column/index exists.
