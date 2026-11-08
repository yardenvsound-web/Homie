// Queries for the `events` table. Pages never call Supabase directly.

import { db } from '../supabase.js';

const BOARD_FIELDS = 'id, title, date, start_time, end_time, source, assigned_member_ids, created_at';

// Events shown on the daily board: approved only (pending / dismissed Google
// events never reach the board).
export async function getBoardEvents(date) {
  const { data, error } = await db
    .from('events')
    .select(BOARD_FIELDS)
    .eq('date', date)
    .eq('status', 'approved')
    .order('start_time', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// New internal event (F18). fields: { title, date, start_time, end_time, assigned_member_ids, notes }.
export async function createEvent(fields) {
  const { data, error } = await db
    .from('events')
    .insert({ ...fields, source: 'homie', status: 'approved' })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
