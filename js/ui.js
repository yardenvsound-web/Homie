// Shared UI helpers and Hebrew UI wording: icons, error bar, modal, confirm
// dialog and form fields. Still to come: "last updated" (Milestone 7).

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

  // Add menu and modals (Milestone 4)
  add: 'הוספה',
  addTask: 'הוספת משימה',
  newTaskTitle: 'משימה חדשה',
  editTaskTitle: 'עריכת משימה',
  newEventTitle: 'אירוע חדש',
  save: 'שמור',
  saveChanges: 'שמירת שינויים',
  saving: 'שומר…',
  cancel: 'ביטול',
  close: 'סגירה',
  delete: 'מחיקה',
  confirmDeleteTask: 'למחוק את המשימה?',
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
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5"/><path d="M14 11v5.5"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  'chevron-down': '<path d="M6 9.5l6 6 6-6"/>',
};

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon');
  svg.innerHTML = ICON_PATHS[name]; // static markup from this file only
  return svg;
}

// Error bar at the top of the content, with a "try again" button.
export function showError(container, message, onRetry) {
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
export function createModal({ title, primaryLabel, opener = null, fallbackFocus = null, onSubmit }) {
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
  primary.textContent = primaryLabel;
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn--secondary';
  cancel.textContent = MESSAGES.cancel;
  footer.append(primary, cancel);

  form.append(header, body, footer);
  dialog.append(form);

  let busy = false;
  const controls = [primary, cancel, closeBtn];

  function setBusy(value, label = MESSAGES.saving) {
    busy = value;
    for (const c of controls) c.disabled = value;
    for (const extra of footer.querySelectorAll('[data-modal-extra]')) extra.disabled = value;
    primary.textContent = value ? label : primaryLabel;
    dialog.setAttribute('aria-busy', String(value));
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
    if (busy) return;
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
    setBusy,
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
