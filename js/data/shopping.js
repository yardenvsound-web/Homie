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

// Duplicate check for Quick Add (F26): an active item with the same name,
// ignoring case and surrounding spaces. Checked against the database (not just
// the screen), so an item the other parent added is found too. Returns the item or null.
export async function findActiveByName(name) {
  const key = name.trim().toLocaleLowerCase();
  const items = await getActiveItems();
  return items.find((item) => item.name.trim().toLocaleLowerCase() === key) ?? null;
}

// Quick Add (F23). The page runs findActiveByName first (F26).
export async function addItem({ name, quantity }) {
  const { data, error } = await db
    .from('shopping_items')
    .insert({ name, quantity, purchased: false })
    .select(LIST_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

// All updates are Last Write Wins (F41): a plain update, no condition on the
// old value. Each resolves { found: false } when the row no longer exists.
async function updateItem(id, fields) {
  const { data, error } = await db
    .from('shopping_items')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}

// "נקנה" (F24).
export function markPurchased(id) {
  return updateItem(id, { purchased: true });
}

// "בטל" in the toast (F46): back to the active list.
export function markUnpurchased(id) {
  return updateItem(id, { purchased: false });
}

// Quantity box (F25) and "עדכון כמות" for a duplicate (F26).
export function updateQuantity(id, quantity) {
  return updateItem(id, { quantity });
}

// ✕ (F27): immediate delete, no confirmation.
export async function deleteItem(id) {
  const { data, error } = await db.from('shopping_items').delete().eq('id', id).select('id');
  if (error) throw error;
  return { found: data.length > 0 };
}
