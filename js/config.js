// Public configuration. The Supabase URL and the publishable (anon) key are
// meant to live in the browser: all data is protected by RLS (sql/policies.sql).
// Never put a secret / service_role key here.

export const SUPABASE_URL = 'https://irmbzkhlklgrzepgskmd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_SLlPXQ-Ub5pC7XF1v_94dQ_pDZi-sml';

export const TIMEZONE = 'Asia/Jerusalem';

// Default Timeline hours (PRD 4.13); the board widens them when an item falls outside.
export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 22;

// Number of weeks a recurring task is expanded into (F16, after MVP).
export const RECURRENCE_WEEKS = 4;

// Avatar illustrations (assets/avatars/m1.png … m4.png) are supplied later.
// Until then every avatar is a tinted circle with the member's first letter.
// Switch to true once the four image files exist (ADR-5).
export const USE_AVATAR_IMAGES = false;
