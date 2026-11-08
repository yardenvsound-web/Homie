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

// Multi-select of household members (DESIGN.md "בוחר בני בית"), in members.json
// order. Each chip is a real checkbox + avatar + name, so the selection is never
// shown by color alone. getSelected() returns ids in members.json order.
// onChange(selectedIds) runs whenever a chip is checked or unchecked.
export function renderMemberPicker({ id, legend, selectedIds = [], onChange = null }) {
  const selected = new Set(selectedIds);
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'member-picker';
  const legendEl = document.createElement('legend');
  legendEl.className = 'field__label';
  legendEl.textContent = legend;
  const list = document.createElement('div');
  list.className = 'member-picker__list';

  const inputs = [];
  for (const member of getMembers()) {
    const label = document.createElement('label');
    label.className = 'member-chip';
    label.style.setProperty('--chip-tint', member.tint);

    const check = document.createElement('span');
    check.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'check__input';
    input.id = `${id}-${member.id}`;
    input.value = member.id;
    input.checked = selected.has(member.id);
    const box = document.createElement('span');
    box.className = 'check__box';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    check.append(input, box);

    const name = document.createElement('span');
    name.textContent = member.name;
    label.append(check, renderAvatar(member, 'xs'), name);
    list.append(label);
    inputs.push(input);
  }

  const getSelected = () => inputs.filter((i) => i.checked).map((i) => i.value);
  if (onChange) list.addEventListener('change', () => onChange(getSelected()));

  fieldset.append(legendEl, list);
  return {
    el: fieldset,
    firstInput: inputs[0] ?? null,
    legendEl,
    getSelected,
  };
}
