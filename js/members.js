// Household members from data/members.json (F03).
// The file order is the display order everywhere (DESIGN.md).

import { USE_AVATAR_IMAGES } from './config.js';

let members = null;

export async function loadMembers() {
  if (members) return members;
  const response = await fetch('data/members.json');
  if (!response.ok) throw new Error(`members.json: HTTP ${response.status}`);
  members = await response.json();
  return members;
}

export function getMembers() {
  return members ?? [];
}

export function getMember(id) {
  return getMembers().find((m) => m.id === id) ?? null;
}

// Used only to show the signed-in parent's name.
export function findParentByUserId(userId) {
  return getMembers().find((m) => m.is_parent && m.supabase_user_id === userId) ?? null;
}

// Avatar circle. size: 'xs' | 's' | 'm' | 'l' (24 / 32 / 48 / 72).
// Decorative (aria-hidden): the member's name is always shown next to it as text.
// Pass null for an unknown person: a neutral circle with the given letter.
export function renderAvatar(member, size = 's', fallbackLetter = '?') {
  const el = document.createElement('span');
  el.className = `avatar avatar--${size}`;
  el.setAttribute('aria-hidden', 'true');

  if (!member) {
    el.classList.add('avatar--unknown');
    el.textContent = fallbackLetter;
    return el;
  }

  // Member colors come from members.json (same values as the member tokens).
  el.style.setProperty('--avatar-tint', member.tint);
  el.style.setProperty('--avatar-stripe', member.color);

  if (USE_AVATAR_IMAGES) {
    const img = document.createElement('img');
    img.src = member.avatar;
    img.alt = '';
    el.append(img);
  } else {
    el.textContent = member.name.charAt(0);
  }
  return el;
}
