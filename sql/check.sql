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
