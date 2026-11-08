// Queries and updates for the `tasks` table. Pages never call Supabase directly.

import { db } from '../supabase.js';

// `notes` is included so the edit modal opens filled without another query.
const BOARD_FIELDS = 'id, title, date, time, status, assigned_member_ids, notes, source, created_at';

// Tasks shown on the daily board: regular tasks and approved AI suggestions.
// Proposed / rejected AI suggestions belong to the Pending screen only.
export async function getBoardTasks(date) {
  const { data, error } = await db
    .from('tasks')
    .select(BOARD_FIELDS)
    .eq('date', date)
    .in('proposal_status', ['none', 'approved'])
    .order('time', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// New manual task (F12). fields: { title, date, time, status, assigned_member_ids, notes }.
export async function createTask(fields) {
  const { data, error } = await db
    .from('tasks')
    .insert({ ...fields, source: 'manual', proposal_status: 'none', recurrence_type: 'none' })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

// Edit (F14). Last Write Wins (F41): a plain update with no condition on the old
// value. source / proposal_status are never touched, so an approved AI task stays one.
// Resolves { found: false } when the row no longer exists.
export async function updateTask(id, fields) {
  const { data, error } = await db
    .from('tasks')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

export function setTaskStatus(id, status) {
  return updateTask(id, { status });
}

// Delete (F44). Resolves { found: false } when the row was already deleted.
export async function deleteTask(id) {
  const { data, error } = await db.from('tasks').delete().eq('id', id).select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

// ---------- Proposed AI suggestions (F30, F38) ----------

export async function getProposedTasks() {
  const { data, error } = await db
    .from('tasks')
    .select('id, title, date, notes, created_at')
    .eq('proposal_status', 'proposed')
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function countProposedTasks() {
  const { count, error } = await db
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('proposal_status', 'proposed');
  if (error) throw error;
  return count ?? 0;
}

// Conditional update (ARCHITECTURE.md section 3): only a still-proposed row changes.
async function resolveSuggestion(id, proposalStatus) {
  const { data, error } = await db
    .from('tasks')
    .update({ proposal_status: proposalStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('proposal_status', 'proposed')
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

// Approved: becomes a regular task on the board (still unassigned, editable).
export function approveSuggestion(id) {
  return resolveSuggestion(id, 'approved');
}

export function rejectSuggestion(id) {
  return resolveSuggestion(id, 'rejected');
}
