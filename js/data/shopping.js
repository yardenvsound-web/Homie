// Queries and updates for the `shopping_items` table. Pages never call Supabase directly.

import { db } from '../supabase.js';

const LIST_FIELDS = 'id, name, quantity, created_at';

// Active list: items not purchased yet, oldest first (ARCHITECTURE.md, "שאילתות מרכזיות").
export async function getActiveItems() {
  const { data, error } = await db
    .from('shopping_items')
    .select(LIST_FIELDS)
    .eq('purchased', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Quick Add (F23). No duplicate check until F26 (Milestone 7).
export async function addItem({ name, quantity }) {
  const { data, error } = await db
    .from('shopping_items')
    .insert({ name, quantity, purchased: false })
    .select(LIST_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

// "נקנה" (F24). Last Write Wins: a plain update, no condition on the old value.
// Resolves { found: false } when the row no longer exists.
export async function markPurchased(id) {
  const { data, error } = await db
    .from('shopping_items')
    .update({ purchased: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}
