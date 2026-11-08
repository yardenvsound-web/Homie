-- Milestone 1 check: tables in the public schema, row counts and policy counts.
select
  (select string_agg(table_name, ', ' order by table_name)
     from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE') as tables,
  (select count(*) from public.events)         as events_rows,
  (select count(*) from public.tasks)          as tasks_rows,
  (select count(*) from public.shopping_items) as shopping_rows,
  (select count(*) from pg_policies where schemaname = 'public') as policies,
  (select count(*) from pg_policies where schemaname = 'public' and 'anon' = any(roles)) as anon_policies;

-- Milestone 6 check (after running W1): Google imports and AI suggestions.
-- duplicate_google_ids must be 0; ai_per_event_max should be 1 (one suggestion per event).
select
  (select count(*) from public.events where source = 'google')                     as google_events,
  (select count(*) from public.events where source = 'google' and status = 'pending')   as google_pending,
  (select count(*) from public.events where source = 'google' and status = 'dismissed') as google_dismissed,
  (select count(*) from (select google_event_id from public.events
                          where google_event_id is not null
                          group by google_event_id having count(*) > 1) d)          as duplicate_google_ids,
  (select count(*) from public.tasks where source = 'ai' and proposal_status = 'proposed') as ai_proposed,
  (select coalesce(max(c), 0) from (select count(*) c from public.tasks
                                     where source = 'ai' group by notes, date) a)    as ai_per_event_max;

-- Milestone 8 check (after changing an event in Google and running W1):
-- events updated from Google keep their status and assignees.
select title, date, start_time, end_time, status, assigned_member_ids, updated_at
from public.events
where source = 'google' and updated_from_google = true
order by updated_at desc;

-- Milestone 9 check (after deleting / changing events in Google and running W1):
-- cancelled Google events are dismissed; each event has at most ONE pending suggestion
-- (proposed_per_event_max must be 0 or 1).
select
  (select count(*) from public.events where source = 'google' and status = 'dismissed') as google_dismissed,
  (select coalesce(max(c), 0) from (select count(*) c from public.tasks
                                     where source = 'ai' and proposal_status = 'proposed'
                                     group by notes, date) p)                          as proposed_per_event_max;
