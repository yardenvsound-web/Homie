-- Homie V1 demo data (F40). Invented family only: no real people or minors.
-- Members (data/members.json): m1 Yoav, m2 Dana (parents), m3 Noa, m4 Itai (children).
-- Dates are relative to "today" in Israel time (ADR-2), so the board always has data.
-- Re-runnable: clears the three tables first (they hold demo data only).

delete from public.events;
delete from public.tasks;
delete from public.shopping_items;

-- ---------- events ----------
with d as (select (now() at time zone 'Asia/Jerusalem')::date as today)
insert into public.events
  (title, date, start_time, end_time, source, status, assigned_member_ids, google_event_id, notes)
select v.title, d.today + v.day_offset, v.start_time::time, v.end_time::time,
       v.source, v.status, v.members::jsonb, v.google_event_id, v.notes
from d, (values
  ('פגישת הורים',      0, '18:00', '19:00', 'homie',  'approved',  '["m1","m2"]',             null,             'בכיתה של נועה'),
  ('אימון כדורגל',     0, '16:30', '18:00', 'google', 'approved',  '["m4"]',                  'demo-google-001', null),
  ('יום הולדת לסבתא',  0, null,    null,    'homie',  'approved',  '["m1","m2","m3","m4"]',   null,             null),
  ('חוג ציור',         1, '17:00', '18:30', 'homie',  'approved',  '["m3"]',                  null,             null),
  ('טיפול שיניים',     2, '10:00', '10:45', 'google', 'pending',   '[]',                      'demo-google-002', 'מרפאת השן הלבנה'),
  ('הופעת סוף שנה',    2, '19:00', '20:30', 'google', 'dismissed', '[]',                      'demo-google-003', null),
  ('ערב סרט',          1, '21:30', '22:30', 'homie',  'approved',  '["m1","m2","m3","m4"]',   null,             null)
) as v(title, day_offset, start_time, end_time, source, status, members, google_event_id, notes);

-- ---------- tasks ----------
with d as (select (now() at time zone 'Asia/Jerusalem')::date as today)
insert into public.tasks
  (title, date, time, status, assigned_member_ids, notes, source, proposal_status)
select v.title, d.today + v.day_offset, v.task_time::time, v.status,
       v.members::jsonb, v.notes, v.source, v.proposal_status
from d, (values
  ('להסיע את נועה לבית הספר',      0, '07:30', 'todo', '["m1"]',      null,                        'manual', 'none'),
  ('שיעורי בית בחשבון',            0, '17:00', 'todo', '["m4"]',      null,                        'manual', 'none'),
  ('לקנות מתנה לסבתא',             0, null,    'done', '["m2"]',      null,                        'manual', 'none'),
  ('להשקות את העציצים',            0, null,    'todo', '["m3","m4"]', null,                        'manual', 'none'),
  ('להחזיר ספרים לספרייה',         1, '16:00', 'todo', '["m3"]',      null,                        'manual', 'none'),
  ('להכין בגדי ספורט ובקבוק מים',  0, null,    'todo', '[]',          'הצעה לאירוע: אימון כדורגל', 'ai',     'proposed'),
  ('לקנות צבעים חדשים',            1, null,    'todo', '[]',          'הצעה לאירוע: חוג ציור',     'ai',     'rejected'),
  ('להוציא את הכלב',               0, '06:30', 'todo', '["m4"]',      null,                        'manual', 'none'),
  ('לתלות כביסה',                 -1, null,    'todo', '["m2"]',      null,                        'manual', 'none')
) as v(title, day_offset, task_time, status, members, notes, source, proposal_status);

-- ---------- shopping_items ----------
insert into public.shopping_items (name, quantity, purchased) values
  ('חלב',      2,  false),
  ('לחם',      1,  false),
  ('ביצים',    12, false),
  ('עגבניות',  6,  false),
  ('שמן זית',  1,  true),
  ('אורז',     1,  false);
