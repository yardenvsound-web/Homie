// Board (index.html) with three views (Milestone 10, ADR-20): daily columns per
// member (F52), weekly calendar (F21) and monthly grid (F53), picked from the
// view menu in the heading (F51). The cards live in cards.js, each view in its
// own module.
// Also: F42 (day arrows), F47 (refresh), F41 (Last Write Wins),
// F12/F14/F44 (task modal), F18/F19/F45 (event modal), F11 ("last updated"),
// F10 (overlap chip) and F32 ("עודכן ב-Google" chip).

import { initProtectedPage, refreshPendingCount } from './nav.js';
import { getBoardTasks } from './data/tasks.js';
import { getBoardEvents } from './data/events.js';
import {
  todayISO, addDays, addMonths, weekStart, monthStart, monthEnd,
  formatDayLabel, formatWeekRange, formatMonthLabel,
} from './time.js';
import {
  MESSAGES, icon, showError, clearError, markLoading, markLoaded, markFailed, lastUpdatedDetail,
} from './ui.js';
import { openTaskModal } from './task-modal.js';
import { openEventModal } from './event-modal.js';
import { setCardHandlers, updateOverlapChips } from './cards.js';
import { renderDay } from './view-day.js';
import { renderWeek } from './view-week.js';
import { renderMonth } from './view-month.js';

const el = {
  content: document.querySelector('.board__content'),
  view: document.querySelector('.board__view'),
  alerts: document.querySelector('.board__alerts'),
  date: document.querySelector('.daybar__date'),
  prev: document.querySelector('[data-day="prev"]'),
  next: document.querySelector('[data-day="next"]'),
  today: document.querySelector('.daybar__today'),
  empty: document.querySelector('.empty-state'),
  emptyText: document.querySelector('.empty-state__text'),
  skeleton: document.querySelector('.skeleton'),
  add: document.querySelector('.add'),
  addMenu: document.querySelector('.add__menu'),
  addToggles: document.querySelectorAll('.add__toggle'),
  emptyAdd: document.querySelector('.empty-state__add'),
  viewSwitch: document.querySelector('.view-switch'),
  viewToggle: document.querySelector('.view-toggle'),
  viewMenu: document.querySelector('.view-menu'),
};

const VIEWS = {
  day: { label: MESSAGES.viewDay, prev: MESSAGES.prevDay, next: MESSAGES.nextDay },
  week: { label: MESSAGES.viewWeek, prev: MESSAGES.prevWeek, next: MESSAGES.nextWeek },
  month: { label: MESSAGES.viewMonth, prev: MESSAGES.prevMonth, next: MESSAGES.nextMonth },
};

// In memory only: a page reload always opens the daily view on today (F42, F51).
let view = 'day';
let selectedDate = todayISO();
let loadSeq = 0;
// Edited item whose card gets focus back once the board has re-rendered (ADR-8).
// { kind: 'task' | 'event', id }
let focusItem = null;
// Items on screen. A task's status is updated here after a save, so overlap
// chips can be recomputed without a reload (F10, ADR-17).
let shownItems = [];

// ---------- Periods ----------

// Dates that are loaded and drawn: { from, to }.
function loadedRange() {
  if (view === 'day') return { from: selectedDate, to: selectedDate };
  if (view === 'week') {
    const from = weekStart(selectedDate);
    return { from, to: addDays(from, 6) };
  }
  // Month: whole weeks around the month.
  return { from: weekStart(monthStart(selectedDate)), to: addDays(weekStart(monthEnd(selectedDate)), 6) };
}

// The period the arrows move by (the month itself, without the padding days).
function period() {
  if (view === 'month') return { from: monthStart(selectedDate), to: monthEnd(selectedDate) };
  return loadedRange();
}

const within = (date, { from, to }) => date >= from && date <= to;

// Date a new task / event starts with: today when it is in the period, else its first day.
function newItemDate() {
  const p = period();
  return within(todayISO(), p) ? todayISO() : p.from;
}

// ---------- Rendering ----------

function onStatusSaved() {
  updateOverlapChips(shownItems);
}

function renderBoard(tasks, events) {
  const items = [
    ...events.map((e) => ({ ...e, kind: 'event' })),
    ...tasks.map((t) => ({ ...t, kind: 'task' })),
  ];
  shownItems = items;
  let hasContent = true;
  const range = loadedRange();

  if (view === 'day') {
    hasContent = renderDay(el.view, items, { onStatusSaved });
    updateOverlapChips(items);
  } else if (view === 'week') {
    renderWeek(el.view, items, { from: range.from, onOpenDay: openDay });
  } else {
    renderMonth(el.view, items, { ...range, month: selectedDate.slice(0, 7), onOpenDay: openDay });
  }

  el.view.hidden = !hasContent;
  el.emptyText.textContent = selectedDate === todayISO() ? MESSAGES.emptyToday : MESSAGES.emptyOtherDay;
  el.empty.hidden = hasContent;

  if (focusItem) {
    const target = [...el.view.querySelectorAll('button[data-kind][data-id]')]
      .find((b) => b.dataset.kind === focusItem.kind && b.dataset.id === focusItem.id);
    (target ?? visibleToggle()).focus();
    focusItem = null;
  }
}

// ---------- Loading ----------

function setBusy(busy) {
  el.content.setAttribute('aria-busy', String(busy));
  for (const button of document.querySelectorAll('[data-refresh]')) button.disabled = busy;
}

function clearBoard() {
  el.view.hidden = true;
  el.empty.hidden = true;
  el.view.replaceChildren();
}

// keep: true keeps the current content visible while reloading the same period
// (refresh). Otherwise the content is replaced by skeleton rows.
async function load({ keep = false } = {}) {
  const seq = ++loadSeq;
  const { from, to } = loadedRange();
  clearError(el.alerts);
  setBusy(true);
  markLoading();
  if (!keep) {
    clearBoard();
    el.skeleton.hidden = false;
  }

  try {
    const [tasks, events] = await Promise.all([getBoardTasks(from, to), getBoardEvents(from, to)]);
    if (seq !== loadSeq) return; // a newer request (e.g. another arrow click) won
    renderBoard(tasks, events);
    markLoaded();
  } catch (err) {
    if (seq !== loadSeq) return;
    console.error('Board load failed:', err);
    markFailed();
    showError(el.alerts, MESSAGES.boardLoadFailed, () => load({ keep: true }), lastUpdatedDetail());
  } finally {
    if (seq === loadSeq) {
      el.skeleton.hidden = true;
      setBusy(false);
    }
  }
}

// ---------- Date bar (F42, F51) ----------

function showDate() {
  if (view === 'day') el.date.textContent = formatDayLabel(selectedDate);
  else if (view === 'week') {
    const { from, to } = loadedRange();
    el.date.textContent = formatWeekRange(from, to);
  } else el.date.textContent = formatMonthLabel(selectedDate);
  el.today.hidden = within(todayISO(), period());
  el.prev.setAttribute('aria-label', VIEWS[view].prev);
  el.next.setAttribute('aria-label', VIEWS[view].next);
}

function goTo(date) {
  selectedDate = date;
  showDate();
  load();
}

function step(direction) {
  if (view === 'day') goTo(addDays(selectedDate, direction));
  else if (view === 'week') goTo(addDays(selectedDate, 7 * direction));
  else goTo(addMonths(selectedDate, direction));
}

function initDayBar() {
  el.prev.append(icon('chevron-right'));
  el.next.append(icon('chevron-left'));
  el.today.textContent = MESSAGES.today;

  const phoneRefresh = document.querySelector('.daybar__refresh');
  phoneRefresh.append(icon('refresh'));
  phoneRefresh.setAttribute('aria-label', MESSAGES.refresh);
  phoneRefresh.addEventListener('click', refresh);

  el.prev.addEventListener('click', () => step(-1));
  el.next.addEventListener('click', () => step(1));
  el.today.addEventListener('click', () => {
    goTo(todayISO());
    el.prev.focus(); // the "היום" button disappears; keep focus in the date bar
  });
  showDate();
}

function refresh() {
  load({ keep: true });
  refreshPendingCount();
}

// ---------- View menu (F51) ----------

function setView(next) {
  view = next;
  const label = VIEWS[view].label;
  el.viewToggle.querySelector('.view-toggle__text').textContent = label;
  el.viewToggle.setAttribute('aria-label', MESSAGES.viewMenu(label));
  for (const item of el.viewMenu.querySelectorAll('[data-view]')) {
    item.setAttribute('aria-checked', String(item.dataset.view === view));
  }
  el.content.dataset.view = view;
  showDate();
  load();
}

// From the week / month grid: open one day in the daily view.
function openDay(date) {
  selectedDate = date;
  setView('day');
  el.viewToggle.focus();
}

function setViewMenuOpen(open, returnFocus = false) {
  el.viewMenu.hidden = !open;
  el.viewToggle.setAttribute('aria-expanded', String(open));
  if (open) el.viewMenu.querySelector('[aria-checked="true"]').focus();
  else if (returnFocus) el.viewToggle.focus();
}

function initViewMenu() {
  const text = document.createElement('span');
  text.className = 'view-toggle__text';
  el.viewToggle.append(text, icon('chevron-down'));

  const items = [...el.viewMenu.querySelectorAll('[data-view]')];
  for (const item of items) {
    const check = icon('check');
    check.classList.add('view-menu__check');
    const label = document.createElement('span');
    label.textContent = VIEWS[item.dataset.view].label;
    item.append(check, label);
    item.addEventListener('click', () => {
      setViewMenuOpen(false, true);
      if (item.dataset.view !== view) setView(item.dataset.view);
    });
  }

  el.viewToggle.addEventListener('click', () => setViewMenuOpen(el.viewMenu.hidden));
  el.viewToggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && el.viewMenu.hidden) {
      e.preventDefault();
      setViewMenuOpen(true);
    }
  });
  el.viewSwitch.addEventListener('keydown', (e) => {
    if (el.viewMenu.hidden) return;
    if (e.key === 'Escape') {
      setViewMenuOpen(false, true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
      items[(next + items.length) % items.length].focus();
    } else if (e.key === 'Tab') {
      setViewMenuOpen(false);
    }
  });
  document.addEventListener('click', (e) => {
    if (!el.viewMenu.hidden && !el.viewSwitch.contains(e.target)) setViewMenuOpen(false);
  });

  const label = VIEWS[view].label;
  text.textContent = label;
  el.viewToggle.setAttribute('aria-label', MESSAGES.viewMenu(label));
  el.content.dataset.view = view;
}

// ---------- Add menu and modals ----------

// Toggle button that is visible at the current width (FAB on phone, "הוספה ▾" wider).
function visibleToggle() {
  return [...el.addToggles].find((b) => b.getClientRects().length > 0) ?? el.addToggles[0];
}

// After a save the board shows the item's date, so the new item is always
// visible right away (ADR-9). Date already on screen: reload in place;
// otherwise move to it and keep the current view.
function afterSave(date) {
  if (within(date, loadedRange())) load({ keep: true });
  else goTo(date);
}

function afterGone(message = MESSAGES.taskGone) {
  load({ keep: true }); // clears old alerts synchronously, so show the message after
  showError(el.alerts, message, () => load({ keep: true }));
}

function openTaskEditor(task, opener) {
  openTaskModal({
    task,
    opener,
    fallbackFocus: visibleToggle(),
    onSaved: (date) => {
      focusItem = { kind: 'task', id: task.id };
      afterSave(date);
    },
    onDeleted: () => load({ keep: true }),
    onGone: () => afterGone(),
  });
}

function openEventEditor(event, opener) {
  openEventModal({
    event,
    opener,
    fallbackFocus: visibleToggle(),
    onSaved: (date) => {
      focusItem = { kind: 'event', id: event.id };
      afterSave(date);
    },
    onDeleted: () => load({ keep: true }),
    onGone: () => afterGone(MESSAGES.eventGone),
  });
}

function openNew(kind, opener) {
  const options = { date: newItemDate(), opener, fallbackFocus: visibleToggle(), onSaved: afterSave };
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

setCardHandlers({
  openTask: openTaskEditor,
  openEvent: openEventEditor,
  onStatusGone: () => afterGone(),
  onStatusFailed: () => showError(el.alerts, MESSAGES.statusSaveFailed, () => load({ keep: true })),
});
initViewMenu();
initDayBar();
initAddMenu();
initProtectedPage({
  page: 'index',
  title: 'לוח היום',
  onRefresh: refresh,
  onReady: () => load(),
});
