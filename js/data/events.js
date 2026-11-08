// Queries for the `events` table. Pages never call Supabase directly.

import { db } from '../supabase.js';

// `notes` is included so the edit modal opens filled without another query.
const BOARD_FIELDS = 'id, title, date, start_time, end_time, source, assigned_member_ids, notes, updated_from_google, created_at';

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

// Edit an internal event (F19). Last Write Wins (F41): no condition on the old
// value. Only Homie events are edited here; Google data is read-only.
// Resolves { found: false } when the row no longer exists.
export async function updateEvent(id, fields) {
  const { data, error } = await db
    .from('events')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('source', 'homie')
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

// Delete an internal event (F45). RLS also allows delete only for source = 'homie'.
// Resolves { found: false } when nothing was deleted (already gone).
export async function deleteEvent(id) {
  const { data, error } = await db
    .from('events')
    .delete()
    .eq('id', id)
    .eq('source', 'homie')
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

// ---------- Pending Google events (F28, F29, F43) ----------

const PENDING_FIELDS = 'id, title, date, start_time, end_time, notes, updated_from_google, created_at';

// Google events waiting for a parent, including past dates (PRD 4.14).
export async function getPendingEvents() {
  const { data, error } = await db
    .from('events')
    .select(PENDING_FIELDS)
    .eq('status', 'pending')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function countPendingEvents() {
  const { count, error } = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
}

// Conditional update (ARCHITECTURE.md section 3): only a row that is still
// pending changes. { found: false } = the other parent already handled it.
async function resolvePending(id, fields) {
  const { data, error } = await db
    .from('events')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

// F29: approve and assign (at least one member, checked by the modal).
export function approveGoogleEvent(id, memberIds) {
  return resolvePending(id, { status: 'approved', assigned_member_ids: memberIds });
}

// F43: the row stays (as 'dismissed') so W1 never imports it again.
export function dismissGoogleEvent(id) {
  return resolvePending(id, { status: 'dismissed' });
}
