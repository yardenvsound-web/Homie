-- Homie V1 Row Level Security (ARCHITECTURE.md, section 3).
-- Only the two parent accounts and one test account (test@gmail.com) get access; any other signed-in user and anon get nothing.
-- The parent uuids match supabase_user_id in data/members.json; the third uuid is the test account (not in members.json). User ids are not secrets.
-- Safe to re-run: every policy is dropped first.

-- ---------- events ----------
drop policy if exists events_parents_select on public.events;
drop policy if exists events_parents_insert on public.events;
drop policy if exists events_parents_update on public.events;
drop policy if exists events_parents_delete on public.events;

create policy events_parents_select on public.events
  for select to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy events_parents_insert on public.events
  for insert to authenticated
  with check (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy events_parents_update on public.events
  for update to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid))
  with check (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

-- Google events can never be deleted (W1 would re-import them).
create policy events_parents_delete on public.events
  for delete to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid) and source = 'homie');

-- ---------- tasks ----------
drop policy if exists tasks_parents_select on public.tasks;
drop policy if exists tasks_parents_insert on public.tasks;
drop policy if exists tasks_parents_update on public.tasks;
drop policy if exists tasks_parents_delete on public.tasks;

create policy tasks_parents_select on public.tasks
  for select to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy tasks_parents_insert on public.tasks
  for insert to authenticated
  with check (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy tasks_parents_update on public.tasks
  for update to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid))
  with check (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy tasks_parents_delete on public.tasks
  for delete to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

-- ---------- shopping_items ----------
drop policy if exists shopping_items_parents_select on public.shopping_items;
drop policy if exists shopping_items_parents_insert on public.shopping_items;
drop policy if exists shopping_items_parents_update on public.shopping_items;
drop policy if exists shopping_items_parents_delete on public.shopping_items;

create policy shopping_items_parents_select on public.shopping_items
  for select to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy shopping_items_parents_insert on public.shopping_items
  for insert to authenticated
  with check (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy shopping_items_parents_update on public.shopping_items
  for update to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid))
  with check (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));

create policy shopping_items_parents_delete on public.shopping_items
  for delete to authenticated
  using (auth.uid() in ('c809b3a7-d93f-4f7c-a4e5-683419ed5d49'::uuid, 'f04667a4-c1bd-41a4-acdf-414e1f561df8'::uuid, 'd6abad40-50b9-4187-a0d0-293e7c61de78'::uuid));
