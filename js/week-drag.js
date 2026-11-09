// Drag and drop in the weekly view: move a task or a Homie event to another
// hour and/or day. Drop targets:
//   - a day column (.week__col)   → that day, at the hour under the pointer
//   - a "ללא שעה" cell            → that day, without a time
//   - a day header (.week__day)   → that day, same time
// Mouse: drag after a small move. Touch: press and hold, then drag (a quick
// swipe still scrolls the page). The edit modal stays the keyboard way to move.

import { formatDayLabel, formatTime } from './time.js';
import { MESSAGES } from './ui.js';
import { isUntimed, startMinutes, endMinutes } from './cards.js';

const SNAP = 15; // minutes
const MOVE_THRESHOLD = 6; // px before a mouse press becomes a drag
const LONG_PRESS_MS = 350;
const EDGE = 48; // px from an edge where auto-scroll starts
const SCROLL_SPEED = 12;

const pad = (n) => String(n).padStart(2, '0');
const toTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
// Keeps "15:00–16:30" left-to-right inside the Hebrew label.
const ltr = (text) => `\u2066${text}\u2069`;

// Event length in minutes, or null when it has no end time (tasks never have one).
function duration(item) {
  if (item.kind !== 'event' || !item.start_time || !item.end_time) return null;
  return endMinutes(item) - startMinutes(item);
}

// New fields for the item at a target, or null when nothing changes.
function changesFor(item, target) {
  const date = target.date;
  if (target.type === 'untimed') {
    if (item.date === date && isUntimed(item)) return null;
    return item.kind === 'task' ? { date, time: null } : { date, start_time: null, end_time: null };
  }
  if (target.type === 'day') {
    if (item.date === date) return null;
    return { date };
  }
  const start = target.minutes;
  if (item.date === date && !isUntimed(item) && startMinutes(item) === start) return null;
  if (item.kind === 'task') return { date, time: toTime(start) };
  const len = duration(item);
  const end = len === null ? null : Math.min(start + len, 24 * 60 - 1);
  return { date, start_time: toTime(start), end_time: end === null ? null : toTime(end) };
}

// Text shown on the dragged block: where it will land.
function targetLabel(item, target) {
  const day = formatDayLabel(target.date);
  if (target.type === 'untimed') return `${day}, ${MESSAGES.untimedRow}`;
  if (target.type === 'day') {
    const time = isUntimed(item) ? '' : formatTime(item.kind === 'task' ? item.time : item.start_time);
    return time ? `${day}, ${ltr(time)}` : day;
  }
  const len = duration(item);
  const start = toTime(target.minutes);
  const time = len === null ? start : `${start}–${toTime(Math.min(target.minutes + len, 24 * 60 - 1))}`;
  return `${day}, ${ltr(time)}`;
}

// block: the rendered .week-block. onDrop(item, changes) saves the move.
export function makeDraggable(block, item, { onDrop }) {
  block.classList.add('week-block--draggable');

  let gesture = null; // { pointerId, startX, startY, x, y, type, timer, dragging, ... }

  // Touch: once dragging, stop the page from scrolling under the finger.
  block.addEventListener('touchmove', (e) => {
    if (gesture?.dragging) e.preventDefault();
  }, { passive: false });
  block.addEventListener('contextmenu', (e) => {
    if (gesture) e.preventDefault();
  });

  block.addEventListener('pointerdown', (e) => {
    if (gesture || (e.pointerType === 'mouse' && e.button !== 0)) return;
    gesture = {
      pointerId: e.pointerId,
      type: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      dragging: false,
    };
    if (e.pointerType !== 'mouse') {
      gesture.timer = setTimeout(() => startDrag(), LONG_PRESS_MS);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
  });

  function onMove(e) {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    gesture.x = e.clientX;
    gesture.y = e.clientY;
    const moved = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);
    if (!gesture.dragging) {
      if (moved < MOVE_THRESHOLD) return;
      if (gesture.type === 'mouse') startDrag();
      else return finish(false); // a swipe before the long press: let the page scroll
    }
    if (gesture.dragging) {
      e.preventDefault();
      update();
    }
  }

  function onUp(e) {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    finish(gesture.dragging);
  }

  function onCancel(e) {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    finish(false);
  }

  function onKey(e) {
    if (e.key === 'Escape' && gesture?.dragging) {
      e.preventDefault();
      finish(false);
    }
  }

  function startDrag() {
    if (!gesture) return;
    const rect = block.getBoundingClientRect();
    const grid = block.closest('.week__grid');
    gesture.dragging = true;
    gesture.grid = grid;
    gesture.scroller = block.closest('.week__scroller');
    gesture.first = Number(grid.dataset.first);
    gesture.last = Number(grid.dataset.last);
    // Keep the block's top where it was grabbed; an untimed block lands at the pointer.
    gesture.offsetY = isUntimed(item) ? 0 : Math.min(gesture.startY - rect.top, rect.height);
    gesture.offsetX = gesture.startX - rect.left;

    const ghost = block.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('week-block--ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    const label = document.createElement('span');
    label.className = 'week-block__drop';
    label.dir = 'rtl';
    ghost.prepend(label);
    document.body.append(ghost);
    gesture.ghost = ghost;
    gesture.label = label;

    block.classList.add('week-block--dragging');
    document.body.classList.add('is-dragging');
    if (gesture.type !== 'mouse') navigator.vibrate?.(15);
    update();
    gesture.raf = requestAnimationFrame(autoScroll);
  }

  // Target under the pointer: { type: 'col' | 'untimed' | 'day', date, minutes?, el }.
  function findTarget() {
    const { x, y } = gesture;
    const hit = document.elementFromPoint(x, y);
    const el = hit?.closest('.week__col, .week__untimed, .week__day');
    if (!el || !gesture.grid.contains(el)) return null;
    const date = el.dataset.date;
    if (el.classList.contains('week__untimed')) return { type: 'untimed', date, el };
    if (el.classList.contains('week__day')) return { type: 'day', date, el };

    const rect = el.getBoundingClientRect();
    const hours = gesture.last - gesture.first;
    const hourH = rect.height / hours;
    const raw = gesture.first * 60 + ((y - gesture.offsetY - rect.top) / hourH) * 60;
    // May end below the last hour row: the grid grows to fit after the drop.
    const max = 24 * 60 - (duration(item) ?? SNAP);
    const minutes = Math.max(gesture.first * 60, Math.min(max, Math.round(raw / SNAP) * SNAP));
    return { type: 'col', date, minutes, el };
  }

  function update() {
    const { ghost, label } = gesture;
    ghost.style.left = `${gesture.x - gesture.offsetX}px`;
    ghost.style.top = `${gesture.y - gesture.offsetY}px`;

    const target = findTarget();
    if (gesture.target?.el !== target?.el) {
      gesture.target?.el.classList.remove('is-drop-target');
      target?.el.classList.add('is-drop-target');
    }
    gesture.target = target;
    label.textContent = target ? targetLabel(item, target) : '';
    label.hidden = !target;
  }

  // Scroll the week sideways (phone) and the page up/down near the edges.
  function autoScroll() {
    if (!gesture?.dragging) return;
    const { x, y, scroller } = gesture;
    let moved = false;
    if (scroller) {
      const r = scroller.getBoundingClientRect();
      if (x < r.left + EDGE && scroller.scrollLeft !== 0) {
        scroller.scrollLeft -= SCROLL_SPEED;
        moved = true;
      } else if (x > r.right - EDGE) {
        scroller.scrollLeft += SCROLL_SPEED;
        moved = true;
      }
    }
    if (y < EDGE) {
      window.scrollBy(0, -SCROLL_SPEED);
      moved = true;
    } else if (y > window.innerHeight - EDGE) {
      window.scrollBy(0, SCROLL_SPEED);
      moved = true;
    }
    if (moved) update();
    gesture.raf = requestAnimationFrame(autoScroll);
  }

  function finish(drop) {
    const g = gesture;
    gesture = null;
    clearTimeout(g.timer);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', onKey);
    if (!g.dragging) return;

    cancelAnimationFrame(g.raf);
    g.ghost.remove();
    g.target?.el.classList.remove('is-drop-target');
    block.classList.remove('week-block--dragging');
    document.body.classList.remove('is-dragging');

    // The click that follows the release must not open the edit modal.
    const stop = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);

    if (!drop || !g.target) return;
    const changes = changesFor(item, g.target);
    if (changes) onDrop(item, changes);
  }
}
