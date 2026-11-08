// Daily view (F52): one column per household member, plus "ללא שיוך" when needed.
// In each column: untimed items first, then timed items by start time.

import { getMembers, renderAvatar } from './members.js';
import { MESSAGES } from './ui.js';
import { renderItemCard, compareItems } from './cards.js';

function column({ id, name, member, items, onStatusSaved }) {
  const section = document.createElement('section');
  section.className = 'day-col';
  section.setAttribute('aria-labelledby', `day-col-${id}`);
  if (member) {
    section.style.setProperty('--col-tint', member.tint);
    section.style.setProperty('--col-stripe', member.color);
  } else {
    section.classList.add('day-col--none');
  }

  const head = document.createElement('div');
  head.className = 'day-col__head';
  if (member) head.append(renderAvatar(member, 'm'));
  const title = document.createElement('h2');
  title.className = 'day-col__name';
  title.id = `day-col-${id}`;
  title.textContent = name;
  head.append(title);
  section.append(head);

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'day-col__empty';
    empty.textContent = MESSAGES.columnEmpty;
    section.append(empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'day-col__list';
    const ownerId = member ? member.id : null;
    for (const item of items) list.append(renderItemCard(item, { ownerId, onStatusSaved }));
    section.append(list);
  }
  return section;
}

// Returns false when the day has no items at all (the board shows its empty state).
export function renderDay(container, items, { onStatusSaved }) {
  const sorted = [...items].sort(compareItems);
  const wrap = document.createElement('div');
  wrap.className = 'day-cols';

  for (const member of getMembers()) {
    const own = sorted.filter((i) => Array.isArray(i.assigned_member_ids) && i.assigned_member_ids.includes(member.id));
    wrap.append(column({ id: member.id, name: member.name, member, items: own, onStatusSaved }));
  }

  const known = new Set(getMembers().map((m) => m.id));
  const unassigned = sorted.filter((i) => !(i.assigned_member_ids ?? []).some((id) => known.has(id)));
  if (unassigned.length > 0) {
    wrap.append(column({ id: 'none', name: MESSAGES.unassigned, member: null, items: unassigned, onStatusSaved }));
  }

  container.replaceChildren(wrap);
  return items.length > 0;
}
