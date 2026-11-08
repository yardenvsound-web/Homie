// Time overlaps on the daily board (F10, ARCHITECTURE.md section 5, ADR-17).
// Pure logic: no DOM, no Supabase. Runs per family member: two items overlap
// only when they share at least one assigned member.
//
// A task has no end time, so it is a point in time. An event is a range
// [start, end); an event without an end time is a point. Two items overlap when
// two ranges intersect, when both start at the same minute, or when a point
// falls inside a range (start <= t < end).
// Not checked: items without a time (incl. all-day events), done tasks
// (ADR-17), and items with no assigned members.

import { minutesOf } from './time.js';

const DAY_END = 24 * 60;

export function overlapKey(item) {
  return `${item.kind}:${item.id}`;
}

// { start, end } in minutes, or null when the item is not checked.
function span(item) {
  if (item.kind === 'task') {
    if (!item.time || item.status === 'done') return null;
    const t = minutesOf(item.time);
    return { start: t, end: t };
  }
  if (!item.start_time) return null;
  const start = minutesOf(item.start_time);
  if (!item.end_time) return { start, end: start };
  const end = minutesOf(item.end_time);
  // An event that crosses midnight lasts until the end of the day (as on the Timeline).
  return { start, end: end < start ? DAY_END : end };
}

function spansOverlap(a, b) {
  if (a.start === b.start) return true;
  const aPoint = a.start === a.end;
  const bPoint = b.start === b.end;
  if (aPoint && bPoint) return false;
  if (aPoint) return b.start <= a.start && a.start < b.end;
  if (bPoint) return a.start <= b.start && b.start < a.end;
  return a.start < b.end && b.start < a.end;
}

// items: [{ kind: 'task' | 'event', id, time | start_time, end_time, status, assigned_member_ids }]
// Returns a Set of overlapKey(item) for every item that overlaps another.
export function findOverlaps(items) {
  const checked = [];
  for (const item of items) {
    const s = span(item);
    const members = Array.isArray(item.assigned_member_ids) ? item.assigned_member_ids : [];
    if (s && members.length > 0) checked.push({ key: overlapKey(item), span: s, members: new Set(members) });
  }

  const result = new Set();
  for (let i = 0; i < checked.length; i++) {
    for (let j = i + 1; j < checked.length; j++) {
      const a = checked[i];
      const b = checked[j];
      const shared = [...a.members].some((m) => b.members.has(m));
      if (shared && spansOverlap(a.span, b.span)) {
        result.add(a.key);
        result.add(b.key);
      }
    }
  }
  return result;
}
