// Dates and times in Israel time (ARCHITECTURE.md, section 2).
// Dates are 'YYYY-MM-DD' strings and times are 'HH:MM[:SS]' strings, exactly
// as Postgres returns `date` and `time`. No Date object ever holds local time,
// so daylight saving and the browser's own time zone cannot shift a day.

import { TIMEZONE } from './config.js';

const isoFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Today's date in Israel, e.g. '2026-11-08'.
export function todayISO() {
  return isoFormatter.format(new Date());
}

function toUTCDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso, n) {
  const date = toUTCDate(iso);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

const WEEKDAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

// "יום ב׳, 12.10"
export function formatDayLabel(iso) {
  const date = toUTCDate(iso);
  return `יום ${WEEKDAY_LETTERS[date.getUTCDay()]}, ${date.getUTCDate()}.${date.getUTCMonth() + 1}`;
}

// Weekday index 0 (Sunday) … 6 (Saturday).
export function weekdayOf(iso) {
  return toUTCDate(iso).getUTCDay();
}

export function weekdayLetter(iso) {
  return WEEKDAY_LETTERS[weekdayOf(iso)];
}

export function dayOfMonth(iso) {
  return Number(iso.slice(8, 10));
}

// Sunday of the week that contains iso (weeks start on Sunday, DESIGN.md).
export function weekStart(iso) {
  return addDays(iso, -weekdayOf(iso));
}

// First day of the month that contains iso.
export function monthStart(iso) {
  return `${iso.slice(0, 7)}-01`;
}

// Last day of the month that contains iso.
export function monthEnd(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

// First day of the month n months away from the month that contains iso.
export function addMonths(iso, n) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 10);
}

// "11.10 – 17.10"
export function formatWeekRange(from, to) {
  const short = (iso) => `${dayOfMonth(iso)}.${Number(iso.slice(5, 7))}`;
  return `${short(from)} – ${short(to)}`;
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// "נובמבר 2026"
export function formatMonthLabel(iso) {
  return `${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

// '16:30:00' → '16:30'
export function formatTime(time) {
  return time ? time.slice(0, 5) : '';
}

// '16:30:00' → minutes since midnight (990)
export function minutesOf(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Current time in Israel, e.g. '14:32' ("עודכן לאחרונה", F11).
export function nowTimeLabel() {
  return clockFormatter.format(new Date());
}
