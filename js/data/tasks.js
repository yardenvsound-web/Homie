// Queries and updates for the `tasks` table. Pages never call Supabase directly.

import { db } from '../supabase.js';

const BOARD_FIELDS = 'id, title, date, time, status, assigned_member_ids, created_at';

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

// Last Write Wins (F41): a plain update with no condition on the old value.
// Resolves { found: false } when the row no longer exists.
export async function setTaskStatus(id, status) {
  const { data, error } = await db
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}
