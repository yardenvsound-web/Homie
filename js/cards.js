// Task and event cards, shared by the board views (Milestone 10, ADR-20).
// F06, F07, F08, F09, F10 (overlap chip), F32/F50 ("עודכן ב-Google" chip).
// The board registers what a click does with setCardHandlers().

import { getMembers, renderAvatar } from './members.js';
import { setTaskStatus } from './data/tasks.js';
import { formatTime, minutesOf } from './time.js';
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR } from './config.js';
import { MESSAGES, STATUS_LABELS, SOURCE_TAGS, icon, flagChip, isRecentGoogleUpdate } from './ui.js';
import { findOverlaps, overlapKey } from './overlap.js';

// { openTask(task, opener), openEvent(event, opener), onStatusGone(), onStatusFailed() }
let handlers = {};

export function setCardHandlers(h) {
  handlers = h;
}

// ---------- Members and colors (DESIGN.md "כללי צבע לפי מספר המשויכים") ----------

// Assigned members in members.json order (not selection order); unknown ids are skipped.
export function assignedMembers(ids) {
  const set = new Set(Array.isArray(ids) ? ids : []);
  return getMembers().filter((m) => set.has(m.id));
}

// ownerId: the card sits in that member's column (F52), so only the other
// assignees are shown ("גם: דנה"); nothing when the owner is the only one.
function renderAssignees(members, ownerId = null) {
  const wrap = document.createElement('span');
  wrap.className = 'assignees';
  if (members.length === 0) {
    if (ownerId) return null; // the "ללא שיוך" column already says it
    wrap.classList.add('assignees--none');
    wrap.textContent = MESSAGES.unassigned;
    return wrap;
  }
  const shown = ownerId ? members.filter((m) => m.id !== ownerId) : members;
  if (shown.length === 0) return null;
  const avatars = document.createElement('span');
  avatars.className = 'assignees__avatars';
  for (const m of shown) avatars.append(renderAvatar(m, 'xs'));
  const names = document.createElement('span');
  const list = shown.map((m) => m.name).join(', ');
  names.textContent = ownerId ? MESSAGES.alsoAssigned(list) : list;
  wrap.append(avatars, names);
  return wrap;
}

function timeMeta(text) {
  const span = document.createElement('span');
  span.className = 'meta-time';
  span.append(icon('clock'));
  const value = document.createElement('span');
  value.dir = 'ltr';
  value.textContent = text;
  span.append(value);
  return span;
}

// ---------- Ordering and hours (PRD 4.13) ----------

export function isUntimed(item) {
  return item.kind === 'event' ? !item.start_time : !item.time;
}

// Within a group: by time, then event before task, then creation order.
export function compareItems(a, b) {
  const ta = a.kind === 'event' ? a.start_time : a.time;
  const tb = b.kind === 'event' ? b.start_time : b.time;
  if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
  if (!ta !== !tb) return ta ? 1 : -1; // untimed first
  if (a.kind !== b.kind) return a.kind === 'event' ? -1 : 1;
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

export function startMinutes(item) {
  return minutesOf(item.kind === 'event' ? item.start_time : item.time);
}

export function endMinutes(item) {
  if (item.kind === 'task' || !item.end_time) return startMinutes(item);
  const end = minutesOf(item.end_time);
  // A Google event that crosses midnight is shown until the end of the day.
  return end < startMinutes(item) ? 24 * 60 : end;
}

// Hours with a row: [first, last). Default 07–22, widened to the round hour
// that contains any timed item, so nothing disappears.
export function hourRange(items) {
  let first = TIMELINE_START_HOUR;
  let last = TIMELINE_END_HOUR;
  for (const item of items) {
    if (isUntimed(item)) continue;
    const startHour = Math.floor(startMinutes(item) / 60);
    first = Math.min(first, startHour);
    last = Math.max(last, Math.ceil(endMinutes(item) / 60), startHour + 1);
  }
  return [first, Math.min(last, 24)];
}

export function eventTimeText(event) {
  if (!event.start_time) return MESSAGES.allDay;
  if (!event.end_time) return formatTime(event.start_time);
  return `${formatTime(event.start_time)}–${formatTime(event.end_time)}`;
}

export function itemTimeText(item) {
  if (item.kind === 'event') return eventTimeText(item);
  return item.time ? formatTime(item.time) : '';
}

// ---------- Overlap chips (F10, ADR-17) ----------

// Overlaps of one member only: the items assigned to them, reduced to that member.
function memberOverlaps(items, memberId) {
  const own = items
    .filter((i) => Array.isArray(i.assigned_member_ids) && i.assigned_member_ids.includes(memberId))
    .map((i) => ({ ...i, assigned_member_ids: [memberId] }));
  return findOverlaps(own);
}

// Adds / removes the "חפיפה" chip on every card on screen. A card in a member's
// column (data-owner) shows the chip only when that member has the overlap.
export function updateOverlapChips(items) {
  const cache = new Map();
  const overlapsFor = (owner) => {
    if (!cache.has(owner)) cache.set(owner, owner ? memberOverlaps(items, owner) : findOverlaps(items));
    return cache.get(owner);
  };
  for (const card of document.querySelectorAll('.item-card[data-key]')) {
    const row = card.querySelector('.item-card__flags');
    const chip = row.querySelector('[data-flag="overlap"]');
    const should = overlapsFor(card.dataset.owner ?? '').has(card.dataset.key);
    if (should && !chip) row.prepend(flagChip('overlap'));
    else if (!should && chip) chip.remove();
  }
}

// ---------- Cards ----------

// Row of display-only chips under the meta line. Hidden by CSS while empty.
function flagsRow() {
  const row = document.createElement('p');
  row.className = 'item-card__flags';
  return row;
}

function statusChip(status) {
  const chip = document.createElement('span');
  chip.className = `chip chip--${status}`;
  const text = document.createElement('span');
  text.textContent = STATUS_LABELS[status];
  chip.append(icon(status === 'done' ? 'check' : 'circle'), text);
  return chip;
}

// Every card of this task on screen (a shared task appears in several columns).
function cardsOfTask(id) {
  return [...document.querySelectorAll(`.item-card[data-key="task:${CSS.escape(id)}"]`)];
}

// onSaved(): runs after the status was saved (the board recomputes overlap chips).
function renderTaskCard(task, ownerId, onSaved) {
  const members = assignedMembers(task.assigned_member_ids);
  const li = document.createElement('li');
  li.className = 'item-card item-card--task';
  li.dataset.key = overlapKey(task);
  if (ownerId) li.dataset.owner = ownerId;

  // Real checkbox over a 44×44 touch area; the visible 24×24 box is drawn next to it.
  const check = document.createElement('span');
  check.className = 'check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'check__input';
  const box = document.createElement('span');
  box.className = 'check__box';
  box.setAttribute('aria-hidden', 'true');
  box.append(icon('check'));
  check.append(checkbox, box);

  const body = document.createElement('div');
  body.className = 'item-card__body';
  // The title button covers the whole card (CSS) and opens the edit modal (F14).
  // The checkbox sits above it, so a click on the checkbox only changes status.
  const title = document.createElement('h3');
  title.className = 'item-card__title';
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'item-card__open';
  open.dataset.kind = 'task';
  open.dataset.id = task.id;
  open.textContent = task.title;
  open.setAttribute('aria-label', MESSAGES.editTask(task.title));
  open.addEventListener('click', () => handlers.openTask?.(task, open));
  title.append(open);
  const meta = document.createElement('p');
  meta.className = 'item-card__meta';
  if (task.time) meta.append(timeMeta(formatTime(task.time)));
  const who = renderAssignees(members, ownerId);
  if (who) meta.append(who);
  body.append(title, meta, flagsRow());

  let chip = statusChip(task.status);
  meta.append(chip);

  function show(status) {
    checkbox.checked = status === 'done';
    li.classList.toggle('item-card--done', status === 'done'); // F08
    checkbox.setAttribute('aria-label', status === 'done' ? MESSAGES.markTodo(task.title) : MESSAGES.markDone(task.title));
    const next = statusChip(status);
    chip.replaceWith(next);
    chip = next;
  }
  li.showStatus = show; // lets the other copies of a shared task follow (F52)
  show(task.status);

  // While a save is in flight, further clicks are ignored. The checkbox is not
  // disabled, because disabling the focused element would drop keyboard focus.
  let saving = false;
  checkbox.addEventListener('change', async () => {
    if (saving) {
      checkbox.checked = !checkbox.checked; // undo the extra click
      return;
    }
    const previous = task.status;
    const status = checkbox.checked ? 'done' : 'todo';
    const copies = cardsOfTask(task.id);
    for (const c of copies) c.showStatus?.(status); // optimistic, in every column
    saving = true;
    li.setAttribute('aria-busy', 'true');
    try {
      const { found } = await setTaskStatus(task.id, status);
      if (!found) {
        handlers.onStatusGone?.();
        return;
      }
      task.status = status;
      onSaved?.(); // a done task no longer counts as an overlap (ADR-17)
    } catch (err) {
      console.error('Status update failed:', err);
      for (const c of cardsOfTask(task.id)) c.showStatus?.(previous);
      handlers.onStatusFailed?.();
    } finally {
      saving = false;
      li.removeAttribute('aria-busy');
    }
  });

  li.append(check, body);
  return li;
}

export function sourceTag(source) {
  const info = SOURCE_TAGS[source] ?? SOURCE_TAGS.homie;
  const tag = document.createElement('span');
  tag.className = 'source-tag';
  tag.append(icon(info.icon));
  const text = document.createElement('span');
  text.textContent = info.label;
  tag.append(text);
  return tag;
}

function renderEventCard(event, ownerId) {
  const members = assignedMembers(event.assigned_member_ids);
  const li = document.createElement('li');
  li.className = 'item-card item-card--event';
  li.dataset.key = overlapKey(event);
  if (ownerId) li.dataset.owner = ownerId;
  if (members.length > 0) {
    li.style.setProperty('--card-tint', members[0].tint);
    li.style.setProperty('--card-stripe', members[0].color);
  }

  const body = document.createElement('div');
  body.className = 'item-card__body';
  const title = document.createElement('h3');
  title.className = 'item-card__title';
  if (event.source === 'homie') {
    // Internal event: the title button covers the card and opens the editor (F19).
    // A Google event is never edited in Homie, so its card is not clickable.
    li.classList.add('item-card--clickable');
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'item-card__open';
    open.dataset.kind = 'event';
    open.dataset.id = event.id;
    open.textContent = event.title;
    open.setAttribute('aria-label', MESSAGES.editEvent(event.title));
    open.addEventListener('click', () => handlers.openEvent?.(event, open));
    title.append(open);
  } else {
    title.textContent = event.title;
  }
  const meta = document.createElement('p');
  meta.className = 'item-card__meta';
  meta.append(timeMeta(eventTimeText(event)));
  meta.append(sourceTag(event.source));
  const who = renderAssignees(members, ownerId);
  if (who) meta.append(who);
  const flags = flagsRow();
  if (event.source === 'google' && isRecentGoogleUpdate(event)) flags.append(flagChip('updated')); // F32, F50
  body.append(title, meta, flags);

  // Icon by type (DESIGN.md): a calendar tile marks every event card.
  const tile = document.createElement('span');
  tile.className = 'icon-tile icon-tile--event';
  tile.setAttribute('aria-hidden', 'true');
  tile.append(icon('calendar'));
  li.append(tile, body);
  return li;
}

// item: a task or event with `kind`. options: { ownerId, onStatusSaved }.
export function renderItemCard(item, { ownerId = null, onStatusSaved = null } = {}) {
  return item.kind === 'event' ? renderEventCard(item, ownerId) : renderTaskCard(item, ownerId, onStatusSaved);
}

// Opens the editor of a task or an internal event. Google events are read-only.
export function openItem(item, opener) {
  if (item.kind === 'task') handlers.openTask?.(item, opener);
  else if (item.source === 'homie') handlers.openEvent?.(item, opener);
}
