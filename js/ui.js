// Shared UI helpers and Hebrew UI wording: icons, error bar, "last updated"
// (F11), toast (F46), modal, confirm dialog, delete button and form fields.

import { nowTimeLabel } from './time.js';

export const MESSAGES = {
  membersLoadFailed: 'לא הצלחנו לטעון את בני הבית',
  retry: 'נסו שוב',
  loginBadCredentials: 'האימייל או הסיסמה שגויים',
  loginNetwork: 'לא הצלחנו להתחבר. בדקו את החיבור ונסו שוב',
  emailRequired: 'נא למלא אימייל',
  passwordRequired: 'נא למלא סיסמה',
  signingIn: 'נכנסים…',
  signIn: 'כניסה',
  signOut: 'יציאה',
  unknownParent: 'הורה',
  refresh: 'רענון',
  prevDay: 'היום הקודם',
  nextDay: 'היום הבא',
  today: 'היום',
  boardLoadFailed: 'לא הצלחנו לעדכן',
  lastUpdated: (time) => `עודכן לאחרונה: ${time}`,
  updating: 'מעדכן…',
  statusSaveFailed: 'לא הצלחנו לשמור את השינוי',
  taskGone: 'המשימה כבר לא קיימת',
  emptyToday: 'אין משימות להיום',
  emptyOtherDay: 'אין משימות ביום הזה',
  untimedTitle: 'משימות ללא שעה',
  timelineTitle: 'היום לפי שעות',
  unassigned: 'ללא שיוך',
  allDay: 'יום שלם',
  markDone: (title) => `סמן כהושלמה: ${title}`,
  markTodo: (title) => `סמן כלביצוע: ${title}`,
  editTask: (title) => `עריכת משימה: ${title}`,
  editEvent: (title) => `עריכת אירוע: ${title}`,
  eventGone: 'האירוע כבר לא קיים',
  overlap: 'חפיפה',
  // Board views (Milestone 10: F51, F52, F21, F53)
  viewDay: 'יומי',
  viewWeek: 'שבועי',
  viewMonth: 'חודשי',
  viewMenu: (current) => `בחירת תצוגה, כרגע: ${current}`,
  prevWeek: 'השבוע הקודם',
  nextWeek: 'השבוע הבא',
  prevMonth: 'החודש הקודם',
  nextMonth: 'החודש הבא',
  thisWeek: 'השבוע',
  thisMonth: 'החודש',
  columnEmpty: 'אין משימות',
  alsoAssigned: (names) => `גם: ${names}`,
  untimedRow: 'ללא שעה',
  emptyWeek: 'אין משימות ואירועים בשבוע הזה',
  emptyMonth: 'אין משימות ואירועים בחודש הזה',
  openDay: (label) => `פתיחת ${label} בתצוגה היומית`,
  monthDayLabel: (label, names) => `${label}: ${names || 'אין פריטים'}`,
  legend: 'מקרא בני הבית',
  updatedFromGoogle: 'עודכן ב-Google',

  // Add menu and modals (Milestone 4)
  add: 'הוספה',
  addTask: 'הוספת משימה',
  newTaskTitle: 'משימה חדשה',
  editTaskTitle: 'עריכת משימה',
  newEventTitle: 'אירוע חדש',
  editEventTitle: 'עריכת אירוע',
  save: 'שמור',
  saveChanges: 'שמירת שינויים',
  saving: 'שומר…',
  cancel: 'ביטול',
  close: 'סגירה',
  delete: 'מחיקה',
  confirmDeleteTask: 'למחוק את המשימה?',
  confirmDeleteEvent: 'למחוק את האירוע?',
  saveFailed: 'לא הצלחנו לשמור',
  deleteFailed: 'לא הצלחנו למחוק',
  taskTitleLabel: 'שם המשימה',
  eventTitleLabel: 'שם האירוע',
  dateLabel: 'תאריך',
  timeLabel: 'שעה (לא חובה)',
  startTimeLabel: 'שעת התחלה',
  endTimeLabel: 'שעת סיום',
  assigneesLabel: 'אחראים',
  participantsLabel: 'משויכים',
  statusLabel: 'סטטוס',
  notesLabel: 'הערות',
  notesPlaceholder: 'הוספת הערה…',
  taskTitleRequired: 'נא למלא שם משימה',
  eventTitleRequired: 'נא למלא שם אירוע',
  tooLong: (max) => `עד ${max} תווים`,
  dateRequired: 'נא לבחור תאריך',
  endRequired: 'נא למלא שעת סיום',
  endBeforeStart: 'שעת הסיום צריכה להיות אחרי שעת ההתחלה',
  endWithoutStart: 'בלי שעת התחלה, האירוע הוא יום שלם. נא למחוק את שעת הסיום',

  // Shopping list (Milestone 5)
  shoppingEmpty: 'הרשימה ריקה',
  productNameLabel: 'שם מוצר',
  quantityLabel: 'כמות',
  productRequired: 'נא למלא שם מוצר',
  quantityInvalid: 'כמות צריכה להיות מספר שלם, 1 לפחות',
  adding: 'מוסיף…',
  addItemFailed: 'לא הצלחנו להוסיף את המוצר',
  quantityValue: (qty) => `כמות: ${qty}`,
  markPurchased: (name, qty) => (qty > 1 ? `סמן כנקנה: ${name}, ${qty}` : `סמן כנקנה: ${name}`),
  quantityOf: (name) => `כמות: ${name}`,
  deleteItem: (name) => `מחיקה: ${name}`,
  duplicateItem: (name, qty) => `${name} כבר ברשימה, כמות ${qty}`,
  updateQuantity: 'עדכון כמות',
  purchasedToast: (name) => `סומן כנקנה: ${name}`,
  undo: 'בטל',
  undoFailed: 'לא הצלחנו לבטל',

  // Pending (Milestone 6)
  pendingTitle: 'ממתין לאישור',
  pendingGoogleTitle: 'אירועי Google חדשים',
  pendingAiTitle: 'הצעות AI',
  pendingEmpty: 'אין פריטים שממתינים',
  pendingCount: (n) => (n === 1 ? 'פריט אחד ממתין' : `${n} פריטים ממתינים`),
  pendingTabLabel: (n) => (n === 1 ? 'ממתין לאישור, פריט אחד' : `ממתין לאישור, ${n} פריטים`),
  review: 'בדוק ואשר',
  dismiss: 'התעלם',
  approve: 'אשר',
  reject: 'דחה',
  reviewEvent: (title) => `בדוק ואשר: ${title}`,
  dismissEvent: (title) => `התעלם: ${title}`,
  approveSuggestion: (title) => `אשר את ההצעה: ${title}`,
  rejectSuggestion: (title) => `דחה את ההצעה: ${title}`,
  aiSuggestion: 'הצעת AI',
  approveAssign: 'אשר ושייך',
  googleApproveTitle: 'אישור ושיוך אירוע Google',
  googleReadOnly: 'Google · קריאה בלבד',
  assignOneOrMore: 'שיוך לבן בית אחד או יותר',
  pickOneMember: 'יש לבחור לפחות בן בית אחד',
  alreadyHandled: 'הפריט כבר טופל',
  noValue: '—',
};

// Input limits (PRD 4.13).
export const LIMITS = {
  title: 100,
  notes: 500,
  productName: 60,
};

// Task status: English code in the database, Hebrew label in the UI (ARCHITECTURE.md, section 2).
export const STATUS_LABELS = {
  todo: 'לביצוע',
  done: 'הושלמה',
};

// Event source tag: the word plus an icon, never color alone.
export const SOURCE_TAGS = {
  homie: { label: 'Homie', icon: 'home' },
  google: { label: 'Google', icon: 'calendar' },
};

// Outline icons (24×24, stroke = currentColor, width from CSS).
const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M2.5 3.5H5l2.4 11.5h10.6l2-8H6.2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
  warning: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><path d="M12 17.2v.3"/>',
  logout: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4v4h-4"/>',
  'chevron-right': '<path d="M9 5l7 7-7 7"/>',
  'chevron-left': '<path d="M15 5l-7 7 7 7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  circle: '<circle cx="12" cy="12" r="7.5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5"/><path d="M14 11v5.5"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  'chevron-down': '<path d="M6 9.5l6 6 6-6"/>',
  sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
};

// Display-only flag chips on a card (Milestone 8): icon + word, never color alone.
// kind: 'overlap' (F10) | 'updated' (F32, "עודכן ב-Google").
const FLAG_CHIPS = {
  overlap: { icon: 'warning', label: () => MESSAGES.overlap },
  updated: { icon: 'refresh', label: () => MESSAGES.updatedFromGoogle },
};

// F50: "עודכן ב-Google" shows only for 3 days after the event's last update.
// `updated_at` is a timestamptz, so the difference is time-zone independent.
const GOOGLE_UPDATE_DAYS = 3;

export function isRecentGoogleUpdate(event) {
  if (!event.updated_from_google || !event.updated_at) return false;
  const age = Date.now() - new Date(event.updated_at).getTime();
  return age < GOOGLE_UPDATE_DAYS * 24 * 60 * 60 * 1000;
}

export function flagChip(kind) {
  const chip = document.createElement('span');
  chip.className = `chip chip--flag chip--${kind}`;
  chip.dataset.flag = kind;
  const text = document.createElement('span');
  text.textContent = FLAG_CHIPS[kind].label();
  chip.append(icon(FLAG_CHIPS[kind].icon), text);
  return chip;
}

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon');
  svg.innerHTML = ICON_PATHS[name]; // static markup from this file only
  return svg;
}

// ---------- "Last updated" (F11, ARCHITECTURE.md section 5) ----------

// Time of the last successful load of this page's data. In memory only.
let lastLoadedAt = null;

function setLastUpdatedText(text) {
  for (const node of document.querySelectorAll('[data-last-updated]')) {
    node.textContent = text ?? '';
    node.hidden = !text;
  }
}

// Re-applies the current state (e.g. after the top bar was rebuilt).
export function renderLastUpdated() {
  setLastUpdatedText(lastLoadedAt ? MESSAGES.lastUpdated(lastLoadedAt) : null);
}

export function markLoading() {
  setLastUpdatedText(MESSAGES.updating);
}

export function markLoaded() {
  lastLoadedAt = nowTimeLabel();
  renderLastUpdated();
}

// A failed load keeps the previous time.
export function markFailed() {
  renderLastUpdated();
}

// Extra line for a load-error bar: the last successful time, if there is one.
export function lastUpdatedDetail() {
  return lastLoadedAt ? MESSAGES.lastUpdated(lastLoadedAt) : null;
}

// Error bar at the top of the content, with a "try again" button.
// detail (optional): a second, quieter line (e.g. "עודכן לאחרונה: 14:32").
export function showError(container, message, onRetry, detail = null) {
  clearError(container);
  const bar = document.createElement('div');
  bar.className = 'error-bar';
  bar.setAttribute('role', 'alert');

  const text = document.createElement('p');
  text.className = 'error-bar__text';
  text.append(icon('warning'));
  const span = document.createElement('span');
  span.textContent = message;
  text.append(span);
  if (detail) {
    const extra = document.createElement('span');
    extra.className = 'error-bar__detail';
    extra.textContent = ` · ${detail}`;
    span.append(extra);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn--secondary btn--small';
  button.textContent = MESSAGES.retry;
  button.addEventListener('click', () => {
    clearError(container);
    onRetry();
  });

  bar.append(text, button);
  container.prepend(bar);
  return bar;
}

export function clearError(container) {
  container.querySelector(':scope > .error-bar')?.remove();
}

// ---------- Toast (F46) ----------

let activeToast = null;

// One toast at a time: a new one replaces the previous (whose action is lost).
// The timer pauses while the pointer is over it or focus is inside, so a
// keyboard user has time to reach the action. region: an aria-live container.
export function showToast({ region, message, actionLabel, onAction, duration = 5000 }) {
  activeToast?.dismiss();

  const toast = document.createElement('div');
  toast.className = 'toast';
  const text = document.createElement('span');
  text.className = 'toast__text';
  text.textContent = message;
  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'toast__action';
  action.textContent = actionLabel;
  toast.append(text, action);

  let timer = null;
  let hovered = false;
  let focused = false;
  const start = () => {
    clearTimeout(timer);
    timer = setTimeout(() => api.dismiss(), duration);
  };
  const pause = () => clearTimeout(timer);
  const resumeIfIdle = () => {
    if (!hovered && !focused) start();
  };

  const api = {
    dismiss() {
      clearTimeout(timer);
      // If focus was on the toast, keep it on the page.
      const hadFocus = toast.contains(document.activeElement);
      toast.remove();
      if (activeToast === api) activeToast = null;
      return hadFocus;
    },
  };

  toast.addEventListener('mouseenter', () => { hovered = true; pause(); });
  toast.addEventListener('mouseleave', () => { hovered = false; resumeIfIdle(); });
  toast.addEventListener('focusin', () => { focused = true; pause(); });
  toast.addEventListener('focusout', () => { focused = false; resumeIfIdle(); });
  action.addEventListener('click', () => {
    api.dismiss();
    onAction();
  });

  region.append(toast);
  activeToast = api;
  start();
  return api;
}

// ---------- Modal (DESIGN.md "חלון (Modal)", ADR-8) ----------

let modalSeq = 0;

function iconButton(name, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-btn';
  button.setAttribute('aria-label', label);
  button.append(icon(name));
  return button;
}

// Builds a modal on a native <dialog> (focus stays inside, Esc closes, the page
// behind is inert). Clicking the backdrop does not close it, so typed data is kept.
// onSubmit() runs on "save" / Enter; return true to close.
// fallbackFocus: where focus goes if the opener no longer exists (e.g. a deleted card).
// icon: optional ICON_PATHS name shown in a round tile before the title (mockup-v2).
export function createModal({ title, primaryLabel, icon: iconName = null, opener = null, fallbackFocus = null, onSubmit }) {
  const id = `modal-${++modalSeq}`;
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', `${id}-title`);

  const form = document.createElement('form');
  form.className = 'modal__form';
  form.noValidate = true; // our own Hebrew messages, next to the field

  const header = document.createElement('div');
  header.className = 'modal__header';
  const heading = document.createElement('h2');
  heading.className = 'modal__title';
  heading.id = `${id}-title`;
  heading.textContent = title;
  const closeBtn = iconButton('close', MESSAGES.close);
  if (iconName) {
    const tile = document.createElement('span');
    tile.className = 'modal__icon';
    tile.append(icon(iconName));
    header.append(tile);
  }
  header.append(heading, closeBtn);

  const body = document.createElement('div');
  body.className = 'modal__body';
  const alerts = document.createElement('div');
  alerts.className = 'modal__alerts';
  body.append(alerts);

  const footer = document.createElement('div');
  footer.className = 'modal__footer';
  const primary = document.createElement('button');
  primary.type = 'submit';
  primary.className = 'btn btn--primary';
  // The label lives in its own span, so setBusy() can change it without removing the icon.
  const primaryText = document.createElement('span');
  primaryText.textContent = primaryLabel;
  primary.append(icon('check'), primaryText);
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn--quiet';
  cancel.textContent = MESSAGES.cancel;
  footer.append(primary, cancel);

  form.append(header, body, footer);
  dialog.append(form);

  let busy = false;
  // false = the primary button stays unavailable (e.g. no member picked yet).
  let primaryEnabled = true;
  const controls = [cancel, closeBtn];

  function setBusy(value, label = MESSAGES.saving) {
    busy = value;
    for (const c of controls) c.disabled = value;
    primary.disabled = value || !primaryEnabled;
    for (const extra of footer.querySelectorAll('[data-modal-extra]')) extra.disabled = value;
    primaryText.textContent = value ? label : primaryLabel;
    dialog.setAttribute('aria-busy', String(value));
  }

  function setPrimaryEnabled(value) {
    primaryEnabled = value;
    if (!busy) primary.disabled = !value;
  }

  // Cleanup runs directly, not only from the 'close' event: browsers may delay
  // that event (e.g. in a background tab), which would leave the dialog behind.
  let finished = false;
  // toFallback: the opener is about to disappear (e.g. its card was deleted).
  function finish(toFallback = false) {
    if (finished) return;
    finished = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    const openerOk = !toFallback && opener?.isConnected && opener.getClientRects().length > 0;
    (openerOk ? opener : fallbackFocus)?.focus();
  }

  function close({ toFallback = false } = {}) {
    finish(toFallback);
  }

  closeBtn.addEventListener('click', () => close());
  cancel.addEventListener('click', () => close());
  // Esc: blocked while a save is in flight; otherwise handled here.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (!busy) finish();
  });
  dialog.addEventListener('close', () => finish());

  async function submit() {
    if (busy || !primaryEnabled) return;
    clearError(alerts);
    if (await onSubmit()) close();
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });

  return {
    dialog,
    body,
    footer,
    alerts,
    primary,
    setBusy,
    setPrimaryEnabled,
    close,
    // Error bar inside the modal; "נסו שוב" repeats the save.
    showError: (message) => showError(alerts, message, submit),
    open(focusTarget) {
      document.body.append(dialog);
      dialog.showModal();
      focusTarget?.focus();
    },
  };
}

// Small confirmation on top of the current modal. Resolves true on confirm.
// Focus starts on "ביטול", the safe choice; Esc = cancel. returnFocus gets focus
// back on close (passed explicitly: Safari does not focus a button on click).
export function confirmDialog({ message, confirmLabel, returnFocus = null }) {
  return new Promise((resolve) => {
    const previous = returnFocus ?? document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'modal modal--confirm';
    const id = `modal-${++modalSeq}`;
    dialog.setAttribute('aria-labelledby', `${id}-title`);

    const text = document.createElement('p');
    text.className = 'modal__title';
    text.id = `${id}-title`;
    text.textContent = message;

    const footer = document.createElement('div');
    footer.className = 'modal__footer';
    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'btn btn--danger';
    confirm.textContent = confirmLabel;
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn--secondary';
    cancel.textContent = MESSAGES.cancel;
    footer.append(confirm, cancel);

    dialog.append(text, footer);
    let finished = false;
    function finish(result) {
      if (finished) return;
      finished = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      if (!result && previous?.isConnected) previous.focus();
      resolve(result);
    }
    confirm.addEventListener('click', () => finish(true));
    cancel.addEventListener('click', () => finish(false));
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      finish(false);
    });
    dialog.addEventListener('close', () => finish(false));

    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}

// "מחיקה" text button for an edit modal's footer, on the far side from "save"
// (DESIGN.md, F44 / F45). After confirmation: await onDelete() (the database
// call), then the modal closes (focus to its fallback) and onDeleted() runs.
export function addDeleteButton(modal, { confirmMessage, onDelete, onDeleted }) {
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn btn--danger-text modal__delete';
  del.dataset.modalExtra = '';
  del.append(icon('trash'));
  const label = document.createElement('span');
  label.textContent = MESSAGES.delete;
  del.append(label);
  modal.footer.append(del);

  del.addEventListener('click', async () => {
    const ok = await confirmDialog({
      message: confirmMessage,
      confirmLabel: MESSAGES.delete,
      returnFocus: del,
    });
    if (!ok) return;
    modal.setBusy(true, MESSAGES.saveChanges); // keeps the primary label unchanged
    try {
      await onDelete(); // already gone = same result: it is off the board
      modal.setBusy(false);
      modal.close({ toFallback: true });
      onDeleted?.();
    } catch (err) {
      console.error('Delete failed:', err);
      modal.setBusy(false);
      modal.showError(MESSAGES.deleteFailed);
      del.focus();
    }
  });
  return del;
}

// ---------- Form fields (DESIGN.md "שדה") ----------

// type: 'text' | 'date' | 'time' | 'textarea' | 'select' (options: [{ value, label }]).
// Error text is shown under the field and linked with aria-describedby.
export function createField({ id, label, type = 'text', options = [], maxLength, placeholder }) {
  const wrap = document.createElement('div');
  wrap.className = 'field';

  const labelEl = document.createElement('label');
  labelEl.className = 'field__label';
  labelEl.htmlFor = id;
  labelEl.textContent = label;

  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
    input.className = 'field__input field__input--textarea';
  } else if (type === 'select') {
    input = document.createElement('select');
    input.className = 'field__input field__input--select';
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      input.append(option);
    }
  } else {
    input = document.createElement('input');
    input.type = type;
    input.className = 'field__input';
    // Dates and times read left to right but stay aligned with the RTL layout.
    if (type === 'date' || type === 'time') input.classList.add('field__input--ltr');
  }
  input.id = id;
  input.name = id;
  if (maxLength) input.maxLength = maxLength;
  if (placeholder) input.placeholder = placeholder;

  const error = document.createElement('p');
  error.className = 'field__error';
  error.id = `${id}-error`;
  error.hidden = true;

  function setError(message) {
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', error.id);
      error.replaceChildren(icon('warning'), document.createTextNode(message));
      error.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      error.replaceChildren();
      error.hidden = true;
    }
  }
  input.addEventListener('input', () => setError(null));
  input.addEventListener('change', () => setError(null));

  let control = input;
  if (type === 'select') {
    // Chevron drawn with the shared icon, inside the field on the end (left) side.
    control = document.createElement('div');
    control.className = 'field__control';
    const chevron = icon('chevron-down');
    chevron.classList.add('field__icon');
    control.append(input, chevron);
  }

  wrap.append(labelEl, control, error);
  return { wrap, input, setError };
}

// Two fields side by side (date + time, start + end).
export function fieldRow(...fields) {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.append(...fields.map((f) => f.wrap));
  return row;
}
