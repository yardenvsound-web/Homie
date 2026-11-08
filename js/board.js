// Daily board (index.html): untimed items + hourly Timeline.
// F04, F05, F06, F07, F09, F42 (day arrows), F47 (refresh), F41 (Last Write Wins),
// F12/F14/F44 (task modal), F18 (event modal) through the add menu.
// Not built yet (hidden, DESIGN.md "מה מוצג בכל שלב"): event editing, faded done
// tasks and "last updated" (M7), overlap chip (M8).

import { initProtectedPage } from './nav.js';
import { getMembers, renderAvatar } from './members.js';
import { getBoardTasks, setTaskStatus } from './data/tasks.js';
import { getBoardEvents } from './data/events.js';
import { todayISO, addDays, formatDayLabel, formatTime, minutesOf } from './time.js';
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR } from './config.js';
import { MESSAGES, STATUS_LABELS, SOURCE_TAGS, icon, showError, clearError } from './ui.js';
import { openTaskModal } from './task-modal.js';
import { openEventModal } from './event-modal.js';

const el = {
  content: document.querySelector('.board__content'),
  alerts: document.querySelector('.board__alerts'),
  date: document.querySelector('.daybar__date'),
  prev: document.querySelector('[data-day="prev"]'),
  next: document.querySelector('[data-day="next"]'),
  today: document.querySelector('.daybar__today'),
  untimed: document.querySelector('#untimed'),
  untimedList: document.querySelector('#untimed .card-list'),
  timeline: document.querySelector('#timeline'),
  timelineList: document.querySelector('#timeline .timeline'),
  empty: document.querySelector('.empty-state'),
  emptyText: document.querySelector('.empty-state__text'),
  skeleton: document.querySelector('.skeleton'),
  add: document.querySelector('.add'),
  addMenu: document.querySelector('.add__menu'),
  addToggles: document.querySelectorAll('.add__toggle'),
  emptyAdd: document.querySelector('.empty-state__add'),
};

// In memory only: a page reload always opens on today (F42, ARCHITECTURE.md section 8).
let selectedDate = todayISO();
let loadSeq = 0;
// Edited task whose card gets focus back once the board has re-rendered.
let focusTaskId = null;

// ---------- Members and colors (DESIGN.md "כללי צבע לפי מספר המשויכים") ----------

// Assigned members in members.json order (not selection order); unknown ids are skipped.
function assignedMembers(ids) {
  const set = new Set(Array.isArray(ids) ? ids : []);
  return getMembers().filter((m) => set.has(m.id));
}

function renderAssignees(members) {
  const wrap = document.createElement('span');
  wrap.className = 'assignees';
  if (members.length === 0) {
    wrap.classList.add('assignees--none');
    wrap.textContent = MESSAGES.unassigned;
    return wrap;
  }
  const avatars = document.createElement('span');
  avatars.className = 'assignees__avatars';
  for (const m of members) avatars.append(renderAvatar(m, 'xs'));
  const names = document.createElement('span');
  names.textContent = members.map((m) => m.name).join(', ');
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

// ---------- Cards ----------

function statusChip(status) {
  const chip = document.createElement('span');
  chip.className = `chip chip--${status}`;
  chip.textContent = STATUS_LABELS[status];
  return chip;
}

function renderTaskCard(task) {
  const members = assignedMembers(task.assigned_member_ids);
  const li = document.createElement('li');
  li.className = 'item-card item-card--task';
  // Checked color: the single assignee's stripe, otherwise sage (the CSS default).
  if (members.length === 1) li.style.setProperty('--check-color', members[0].color);

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
  open.dataset.taskId = task.id;
  open.textContent = task.title;
  open.setAttribute('aria-label', MESSAGES.editTask(task.title));
  open.addEventListener('click', () => openTaskEditor(task, open));
  title.append(open);
  const meta = document.createElement('p');
  meta.className = 'item-card__meta';
  if (task.time) meta.append(timeMeta(formatTime(task.time)));
  meta.append(renderAssignees(members));
  body.append(title, meta);

  let chip = statusChip(task.status);

  function show(status) {
    checkbox.checked = status === 'done';
    checkbox.setAttribute('aria-label', status === 'done' ? MESSAGES.markTodo(task.title) : MESSAGES.markDone(task.title));
    const next = statusChip(status);
    chip.replaceWith(next);
    chip = next;
  }
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
    show(status); // optimistic
    saving = true;
    li.setAttribute('aria-busy', 'true');
    try {
      const { found } = await setTaskStatus(task.id, status);
      if (!found) {
        loadDay({ keep: true }); // clears old alerts synchronously, so show the message after
        showError(el.alerts, MESSAGES.taskGone, () => loadDay({ keep: true }));
        return;
      }
      task.status = status;
    } catch (err) {
      console.error('Status update failed:', err);
      show(previous);
      showError(el.alerts, MESSAGES.statusSaveFailed, () => loadDay({ keep: true }));
    } finally {
      saving = false;
      li.removeAttribute('aria-busy');
    }
  });

  li.append(check, body, chip);
  return li;
}

function eventTimeText(event) {
  if (!event.start_time) return MESSAGES.allDay;
  if (!event.end_time) return formatTime(event.start_time);
  return `${formatTime(event.start_time)}–${formatTime(event.end_time)}`;
}

function renderEventCard(event) {
  const members = assignedMembers(event.assigned_member_ids);
  const li = document.createElement('li');
  li.className = 'item-card item-card--event';
  if (members.length > 0) {
    li.style.setProperty('--card-tint', members[0].tint);
    li.style.setProperty('--card-stripe', members[0].color);
  }

  const body = document.createElement('div');
  body.className = 'item-card__body';
  const title = document.createElement('h3');
  title.className = 'item-card__title';
  title.textContent = event.title;
  const meta = document.createElement('p');
  meta.className = 'item-card__meta';
  meta.append(timeMeta(eventTimeText(event)), renderAssignees(members));
  body.append(title, meta);

  const source = SOURCE_TAGS[event.source] ?? SOURCE_TAGS.homie;
  const tag = document.createElement('span');
  tag.className = 'source-tag';
  tag.append(icon(source.icon));
  const tagText = document.createElement('span');
  tagText.textContent = source.label;
  tag.append(tagText);

  li.append(body, tag);
  return li;
}

// ---------- Timeline (PRD 4.13) ----------

function startMinutes(item) {
  return minutesOf(item.kind === 'event' ? item.start_time : item.time);
}

function endMinutes(item) {
  if (item.kind === 'task' || !item.end_time) return startMinutes(item);
  const end = minutesOf(item.end_time);
  // A Google event that crosses midnight is shown until the end of the day.
  return end < startMinutes(item) ? 24 * 60 : end;
}

// Hours with a row: [first, last). Default 07–22, widened to the round hour
// that contains any item, so nothing disappears.
function hourRange(items) {
  let first = TIMELINE_START_HOUR;
  let last = TIMELINE_END_HOUR;
  for (const item of items) {
    const startHour = Math.floor(startMinutes(item) / 60);
    first = Math.min(first, startHour);
    last = Math.max(last, Math.ceil(endMinutes(item) / 60), startHour + 1);
  }
  return [first, Math.min(last, 24)];
}

function renderTimeline(items) {
  const [first, last] = hourRange(items);
  const byHour = new Map();
  for (const item of items) {
    const hour = Math.floor(startMinutes(item) / 60);
    if (!byHour.has(hour)) byHour.set(hour, []);
    byHour.get(hour).push(item);
  }

  el.timelineList.replaceChildren();
  for (let hour = first; hour < last; hour++) {
    const row = document.createElement('li');
    row.className = 'timeline__row';
    const label = document.createElement('span');
    label.className = 'timeline__hour';
    label.dir = 'ltr';
    label.textContent = `${String(hour).padStart(2, '0')}:00`;
    row.append(label);

    const rowItems = byHour.get(hour);
    if (rowItems) {
      const list = document.createElement('ul');
      list.className = 'timeline__items';
      for (const item of rowItems) list.append(renderItem(item));
      row.append(list);
    } else {
      row.classList.add('timeline__row--empty');
    }
    el.timelineList.append(row);
  }
}

function renderItem(item) {
  return item.kind === 'event' ? renderEventCard(item) : renderTaskCard(item);
}

// Within a group: by time, then event before task, then creation order.
function compareItems(a, b) {
  const ta = a.kind === 'event' ? a.start_time : a.time;
  const tb = b.kind === 'event' ? b.start_time : b.time;
  if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
  if (a.kind !== b.kind) return a.kind === 'event' ? -1 : 1;
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

function renderBoard(tasks, events) {
  const items = [
    ...events.map((e) => ({ ...e, kind: 'event' })),
    ...tasks.map((t) => ({ ...t, kind: 'task' })),
  ];
  const isUntimed = (item) => (item.kind === 'event' ? !item.start_time : !item.time);
  const untimed = items.filter(isUntimed).sort(compareItems);
  const timed = items.filter((i) => !isUntimed(i)).sort(compareItems);

  el.untimedList.replaceChildren(...untimed.map(renderItem));
  el.untimed.hidden = untimed.length === 0;

  if (timed.length > 0) renderTimeline(timed);
  else el.timelineList.replaceChildren();
  el.timeline.hidden = timed.length === 0;

  if (focusTaskId) {
    const target = document.querySelector(`.item-card__open[data-task-id="${focusTaskId}"]`);
    (target ?? visibleToggle()).focus();
    focusTaskId = null;
  }

  el.emptyText.textContent = selectedDate === todayISO() ? MESSAGES.emptyToday : MESSAGES.emptyOtherDay;
  el.empty.hidden = items.length > 0;
}

// ---------- Loading ----------

function setBusy(busy) {
  el.content.setAttribute('aria-busy', String(busy));
  for (const button of document.querySelectorAll('[data-refresh]')) button.disabled = busy;
}

function clearBoard() {
  el.untimed.hidden = true;
  el.timeline.hidden = true;
  el.empty.hidden = true;
  el.untimedList.replaceChildren();
  el.timelineList.replaceChildren();
}

// keep: true keeps the current content visible while reloading the same day
// (refresh). Otherwise the content is replaced by skeleton rows (day change).
async function loadDay({ keep = false } = {}) {
  const seq = ++loadSeq;
  const date = selectedDate;
  clearError(el.alerts);
  setBusy(true);
  if (!keep) {
    clearBoard();
    el.skeleton.hidden = false;
  }

  try {
    const [tasks, events] = await Promise.all([getBoardTasks(date), getBoardEvents(date)]);
    if (seq !== loadSeq) return; // a newer request (e.g. another arrow click) won
    renderBoard(tasks, events);
  } catch (err) {
    if (seq !== loadSeq) return;
    console.error('Board load failed:', err);
    showError(el.alerts, MESSAGES.boardLoadFailed, () => loadDay({ keep: true }));
  } finally {
    if (seq === loadSeq) {
      el.skeleton.hidden = true;
      setBusy(false);
    }
  }
}

// ---------- Day bar (F42) ----------

function showDate() {
  el.date.textContent = formatDayLabel(selectedDate);
  el.today.hidden = selectedDate === todayISO();
}

function goTo(date) {
  selectedDate = date;
  showDate();
  loadDay();
}

function initDayBar() {
  el.prev.append(icon('chevron-right'));
  el.next.append(icon('chevron-left'));
  el.prev.setAttribute('aria-label', MESSAGES.prevDay);
  el.next.setAttribute('aria-label', MESSAGES.nextDay);
  el.today.textContent = MESSAGES.today;

  const phoneRefresh = document.querySelector('.daybar__refresh');
  phoneRefresh.append(icon('refresh'));
  phoneRefresh.setAttribute('aria-label', MESSAGES.refresh);
  phoneRefresh.addEventListener('click', refresh);

  el.prev.addEventListener('click', () => goTo(addDays(selectedDate, -1)));
  el.next.addEventListener('click', () => goTo(addDays(selectedDate, 1)));
  el.today.addEventListener('click', () => {
    goTo(todayISO());
    el.prev.focus(); // the "היום" button disappears; keep focus in the day bar
  });
  showDate();
}

function refresh() {
  loadDay({ keep: true });
}

// ---------- Add menu and modals ----------

// Toggle button that is visible at the current width (FAB on phone, "הוספה ▾" wider).
function visibleToggle() {
  return [...el.addToggles].find((b) => b.getClientRects().length > 0) ?? el.addToggles[0];
}

// After a save the board shows the item's date, so the new item is always
// visible right away (ADR-9). Same date: reload in place.
function afterSave(date) {
  if (date === selectedDate) loadDay({ keep: true });
  else goTo(date);
}

function afterGone() {
  loadDay({ keep: true }); // clears old alerts synchronously, so show the message after
  showError(el.alerts, MESSAGES.taskGone, () => loadDay({ keep: true }));
}

function openTaskEditor(task, opener) {
  openTaskModal({
    task,
    opener,
    fallbackFocus: visibleToggle(),
    onSaved: (date) => {
      focusTaskId = task.id;
      afterSave(date);
    },
    onDeleted: () => loadDay({ keep: true }),
    onGone: afterGone,
  });
}

function openNew(kind, opener) {
  const options = { date: selectedDate, opener, fallbackFocus: visibleToggle(), onSaved: afterSave };
  if (kind === 'event') openEventModal(options);
  else openTaskModal(options);
}

function setMenuOpen(open, returnFocus = false) {
  el.addMenu.hidden = !open;
  for (const toggle of el.addToggles) toggle.setAttribute('aria-expanded', String(open));
  if (open) el.addMenu.querySelector('.add__item').focus();
  else if (returnFocus) visibleToggle().focus();
}

function initAddMenu() {
  const [wide, phone] = [
    document.querySelector('.add__toggle--wide'),
    document.querySelector('.add__toggle--phone'),
  ];
  const wideText = document.createElement('span');
  wideText.textContent = MESSAGES.add;
  wide.append(icon('plus'), wideText, icon('chevron-down'));
  phone.append(icon('plus'));
  phone.setAttribute('aria-label', MESSAGES.add);

  const items = [...el.addMenu.querySelectorAll('.add__item')];
  for (const item of items) {
    const isEvent = item.dataset.add === 'event';
    const text = document.createElement('span');
    text.textContent = isEvent ? MESSAGES.newEventTitle : MESSAGES.newTaskTitle;
    item.append(icon(isEvent ? 'calendar' : 'task'), text);
    item.addEventListener('click', () => {
      const opener = visibleToggle();
      setMenuOpen(false);
      openNew(item.dataset.add, opener);
    });
  }

  for (const toggle of el.addToggles) {
    toggle.addEventListener('click', () => setMenuOpen(el.addMenu.hidden));
  }
  el.add.addEventListener('keydown', (e) => {
    if (el.addMenu.hidden) return;
    if (e.key === 'Escape') {
      setMenuOpen(false, true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
      items[(next + items.length) % items.length].focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!el.addMenu.hidden && !el.add.contains(e.target)) setMenuOpen(false);
  });

  el.emptyAdd.textContent = MESSAGES.addTask;
  el.emptyAdd.addEventListener('click', () => openNew('task', el.emptyAdd));
}

// ---------- Start ----------

initDayBar();
initAddMenu();
initProtectedPage({
  page: 'index',
  title: 'לוח היום',
  onRefresh: refresh,
  onReady: () => loadDay(),
});
