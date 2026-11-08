// Session check, sign in and sign out (F01, F02).
// supabase-js persists the session and refreshes the token on its own,
// so a signed-in tablet stays signed in across reloads.
// The redirect here is a convenience only: the real protection is RLS.

import { db } from './supabase.js';

export async function getSession() {
  const { data, error } = await db.auth.getSession();
  if (error) {
    console.error('Could not read the session:', error);
    return null;
  }
  return data.session;
}

// For every page except login.html. Resolves with the signed-in user,
// or redirects to the login page (and never resolves).
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    window.location.replace('login.html');
    return new Promise(() => {});
  }

  // If the session ends while the page is open (e.g. signed out in another tab).
  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('login.html');
  });

  return session.user;
}

// Returns { ok: true } or { ok: false, reason: 'credentials' | 'network' }.
export async function signIn(email, password) {
  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (!error) return { ok: true };
    if (error.code === 'invalid_credentials' || error.status === 400) {
      return { ok: false, reason: 'credentials' };
    }
    console.error('Sign in failed:', error);
    return { ok: false, reason: 'network' };
  } catch (err) {
    console.error('Sign in failed:', err);
    return { ok: false, reason: 'network' };
  }
}

// Local scope: signs out this browser only, so the other parent's
// devices (and the family tablet) stay signed in.
export async function signOut() {
  try {
    await db.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.error('Sign out failed:', err);
  }
  window.location.replace('login.html');
}
