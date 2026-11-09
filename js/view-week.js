// Weekly view (F21): Sunday–Saturday columns, a "ללא שעה" row and hour rows.
// Timed blocks are placed by start time and sized by duration; items that
// overlap on the same day share the column side by side.

import { getMembers, renderAvatar } from './members.js';
import { addDays, todayISO, weekdayLetter, dayOfMonth, formatDayLabel } from './time.js';
import { MESSAGES, STATUS_LABELS, icon } from './ui.js';
import {
  assignedMembers, compareItems, isUntimed, startMinutes, endMinutes, hourRange, itemTimeText, openItem,
} from './cards.js';
import { makeDraggable } from './week-drag.js';

// A task (no end time) or an event without an end gets one hour of height.
const POINT_MINUTES = 60;
const MIN_MINUTES = 30;

function blockEnd(item) {
  const start = startMinutes(item);
  const end = endMinutes(item);
  return end > start ? Math.max(end, start + MIN_MINUTES) : start + POINT_MINUTES;
}

// Lanes for overlapping blocks of one day: { item, lane, lanes }.
function layoutDay(items) {
  const sorted = [...items].sort((a, b) => startMinutes(a) - startMinutes(b) || compareItems(a, b));
  const result = [];
  let group = [];
  let groupEnd = -1;
  let laneEnds = [];

  const closeGroup = () => {
    for (const entry of group) entry.lanes = laneEnds.length;
    group = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    const start = startMinutes(item);
    const end = blockEnd(item);
    if (start >= groupEnd) {
      closeGroup();
      groupEnd = -1;
    }
    let lane = laneEnds.findIndex((e) => e <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    const entry = { item, lane, lanes: 1 };
    group.push(entry);
    result.push(entry);
    groupEnd = Math.max(groupEnd, end);
  }
  closeGroup();
  return result;
}

// One block: member tint + stripe, title, time and avatars (never color alone).
function renderBlock(item, { compact, onMove }) {
  const members = assignedMembers(item.assigned_member_ids);
  const clickable = item.kind === 'task' || item.source === 'homie';
  const block = document.createElement(clickable ? 'button' : 'div');
  block.className = 'week-block';
  if (clickable) {
    block.type = 'button';
    block.dataset.kind = item.kind;
    block.dataset.id = item.id;
    block.addEventListener('click', () => openItem(item, block));
    if (onMove) makeDraggable(block, item, { onDrop: onMove });
  }
  if (compact) block.classList.add('week-block--untimed');
  if (members.length > 0) {
    block.style.setProperty('--block-tint', members[0].tint);
    block.style.setProperty('--block-stripe', members[0].color);
  }
  const done = item.kind === 'task' && item.status === 'done';
  if (done) block.classList.add('week-block--done');

  const title = document.createElement('span');
  title.className = 'week-block__title';
  // Icon by type (DESIGN.md): task or event; a done task shows a check instead.
  title.append(icon(done ? 'check' : item.kind === 'task' ? 'task' : 'calendar'));
  const titleText = document.createElement('span');
  titleText.textContent = item.title;
  title.append(titleText);
  block.append(title);

  const time = itemTimeText(item);
  const meta = document.createElement('span');
  meta.className = 'week-block__meta';
  if (time && !compact) {
    const t = document.createElement('span');
    t.dir = 'ltr';
    t.textContent = time;
    meta.append(t);
  }
  const avatars = document.createElement('span');
  avatars.className = 'week-block__avatars';
  for (const m of members) avatars.append(renderAvatar(m, 'xs'));
  meta.append(avatars);
  block.append(meta);

  const who = members.length ? members.map((m) => m.name).join(', ') : MESSAGES.unassigned;
  const extras = [time, who];
  if (item.kind === 'task') extras.push(STATUS_LABELS[item.status]);
  if (item.kind === 'event') extras.push(item.source === 'google' ? 'Google' : 'Homie');
  block.setAttribute('aria-label', [item.title, ...extras].filter(Boolean).join(', '));
  if (!clickable) block.setAttribute('role', 'group');
  return block;
}

function renderLegend() {
  const list = document.createElement('ul');
  list.className = 'legend';
  list.setAttribute('aria-label', MESSAGES.legend);
  for (const m of getMembers()) {
    const li = document.createElement('li');
    li.className = 'legend__item';
    const name = document.createElement('span');
    name.textContent = m.name;
    li.append(renderAvatar(m, 's'), name);
    list.append(li);
  }
  return list;
}

// from: Sunday of the shown week. onOpenDay(date) switches to the daily view.
// onMove(item, changes) saves a drag-and-drop move (week-drag.js).
export function renderWeek(container, items, { from, onOpenDay, onMove }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const today = todayISO();
  const [first, last] = hourRange(items);

  const wrap = document.createElement('div');
  wrap.className = 'week';

  if (items.length === 0) {
    const note = document.createElement('p');
    note.className = 'view-note';
    note.textContent = MESSAGES.emptyWeek;
    wrap.append(note);
  }

  const scroller = document.createElement('div');
  scroller.className = 'week__scroller';
  const grid = document.createElement('div');
  grid.className = 'week__grid';
  grid.style.setProperty('--hours', String(last - first));
  grid.dataset.first = String(first);
  grid.dataset.last = String(last);

  // Header row: corner + one button per day.
  const corner = document.createElement('div');
  corner.className = 'week__corner';
  grid.append(corner);
  for (const day of days) {
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'week__day';
    head.dataset.date = day;
    if (day === today) head.classList.add('week__day--today');
    head.setAttribute('aria-label', MESSAGES.openDay(formatDayLabel(day)));
    if (day === today) head.setAttribute('aria-current', 'date');
    const letter = document.createElement('span');
    letter.className = 'week__letter';
    letter.textContent = weekdayLetter(day);
    const num = document.createElement('span');
    num.className = 'week__num';
    num.textContent = String(dayOfMonth(day));
    head.append(letter, num);
    head.addEventListener('click', () => onOpenDay(day));
    grid.append(head);
  }

  // "ללא שעה" row.
  const untimedLabel = document.createElement('div');
  untimedLabel.className = 'week__rowlabel';
  untimedLabel.textContent = MESSAGES.untimedRow;
  grid.append(untimedLabel);
  for (const day of days) {
    const cell = document.createElement('div');
    cell.className = 'week__untimed';
    cell.dataset.date = day;
    cell.setAttribute('role', 'group');
    cell.setAttribute('aria-label', `${formatDayLabel(day)}, ${MESSAGES.untimedRow}`);
    const dayItems = items.filter((i) => i.date === day && isUntimed(i)).sort(compareItems);
    for (const item of dayItems) cell.append(renderBlock(item, { compact: true, onMove }));
    grid.append(cell);
  }

  // Hour labels + one positioned column per day.
  const hours = document.createElement('div');
  hours.className = 'week__hours';
  hours.setAttribute('aria-hidden', 'true');
  for (let h = first; h < last; h++) {
    const label = document.createElement('span');
    label.className = 'week__hour';
    label.dir = 'ltr';
    label.textContent = `${String(h).padStart(2, '0')}:00`;
    hours.append(label);
  }
  grid.append(hours);

  for (const day of days) {
    const col = document.createElement('div');
    col.className = 'week__col';
    col.dataset.date = day;
    if (day === today) col.classList.add('week__col--today');
    col.setAttribute('role', 'group');
    col.setAttribute('aria-label', formatDayLabel(day));
    const timed = items.filter((i) => i.date === day && !isUntimed(i));
    for (const { item, lane, lanes } of layoutDay(timed)) {
      const block = renderBlock(item, { compact: false, onMove });
      const start = startMinutes(item);
      const end = Math.min(blockEnd(item), last * 60);
      block.style.setProperty('--top', String(start - first * 60));
      block.style.setProperty('--len', String(Math.max(end - start, MIN_MINUTES)));
      block.style.setProperty('--lane', String(lane));
      block.style.setProperty('--lanes', String(lanes));
      col.append(block);
    }
    grid.append(col);
  }

  scroller.append(grid);
  wrap.append(renderLegend(), scroller);
  container.replaceChildren(wrap);
  return true;
}
