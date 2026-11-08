// Creates the single Supabase client used by the whole site.
// Relies on the global `supabase` loaded from the pinned CDN <script> tag.
// All table access must go through js/data/*.js (from Milestone 3 on).

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  console.error('supabase-js did not load from the CDN. Check the <script> tag and the network.');
}

export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
