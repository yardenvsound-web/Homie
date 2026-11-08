// Monthly view (F53): a month grid with one colored dot per member who has an
// item that day. Every day is a button whose label lists the names, so the
// information is never carried by color alone. A click opens the daily view.

import { getMembers } from './members.js';
import { addDays, todayISO, dayOfMonth, formatDayLabel, weekdayLetter } from './time.js';
import { MESSAGES } from './ui.js';

// Legend: a dot and a name per member (DESIGN.md "יומן חודשי").
function renderLegend(members) {
  const list = document.createElement('ul');
  list.className = 'legend';
  list.setAttribute('aria-label', MESSAGES.legend);
  for (const m of members) {
    const li = document.createElement('li');
    li.className = 'legend__item';
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.setProperty('--dot-color', m.color);
    const name = document.createElement('span');
    name.textContent = m.name;
    li.append(dot, name);
    list.append(li);
  }
  return list;
}

// from..to: whole weeks around the month. month: 'YYYY-MM'.
export function renderMonth(container, items, { from, to, month, onOpenDay }) {
  const members = getMembers();
  const known = new Set(members.map((m) => m.id));
  const today = todayISO();

  // date → Set of member ids (+ 'none' for an item without a known assignee)
  const byDay = new Map();
  for (const item of items) {
    if (!byDay.has(item.date)) byDay.set(item.date, new Set());
    const set = byDay.get(item.date);
    const ids = (item.assigned_member_ids ?? []).filter((id) => known.has(id));
    if (ids.length === 0) set.add('none');
    for (const id of ids) set.add(id);
  }

  const wrap = document.createElement('div');
  wrap.className = 'month';

  const inMonth = items.filter((i) => i.date.startsWith(month));
  if (inMonth.length === 0) {
    const note = document.createElement('p');
    note.className = 'view-note';
    note.textContent = MESSAGES.emptyMonth;
    wrap.append(note);
  }

  const head = document.createElement('div');
  head.className = 'month__weekdays';
  head.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 7; i++) {
    const cell = document.createElement('span');
    cell.textContent = weekdayLetter(addDays(from, i));
    head.append(cell);
  }

  const grid = document.createElement('div');
  grid.className = 'month__grid';
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const set = byDay.get(day) ?? new Set();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'month__day';
    if (!day.startsWith(month)) button.classList.add('month__day--outside');
    if (day === today) {
      button.classList.add('month__day--today');
      button.setAttribute('aria-current', 'date');
    }

    const num = document.createElement('span');
    num.className = 'month__num';
    num.textContent = String(dayOfMonth(day));
    const dots = document.createElement('span');
    dots.className = 'month__dots';
    dots.setAttribute('aria-hidden', 'true');
    const names = [];
    for (const m of members) {
      if (!set.has(m.id)) continue;
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.setProperty('--dot-color', m.color);
      dots.append(dot);
      names.push(m.name);
    }
    if (set.has('none')) {
      const dot = document.createElement('span');
      dot.className = 'dot dot--none';
      dots.append(dot);
      names.push(MESSAGES.unassigned);
    }
    button.append(num, dots);
    button.setAttribute('aria-label', MESSAGES.monthDayLabel(formatDayLabel(day), names.join(', ')));
    button.addEventListener('click', () => onOpenDay(day));
    grid.append(button);
  }

  wrap.append(head, grid, renderLegend(members));
  container.replaceChildren(wrap);
  return true;
}
