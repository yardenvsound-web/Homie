// Pending page (pending.html): F28 inbox with counter, F29 approve and assign a
// Google event (modal), F43 dismiss a Google event, F30 approve / reject an AI
// suggestion, F47 refresh. Every action is a conditional update: if the other
// parent got there first, the page says "הפריט כבר טופל" and reloads.
// Text from Google and from the model is always set with textContent.

import { initProtectedPage, setPendingCount } from './nav.js';
import { getPendingEvents, dismissGoogleEvent } from './data/events.js';
import { getProposedTasks, approveSuggestion, rejectSuggestion } from './data/tasks.js';
import { formatDayLabel, formatTime } from './time.js';
import { MESSAGES, SOURCE_TAGS, icon, showError, clearError } from './ui.js';
import { openGoogleApproveModal } from './event-modal.js';

const el = {
  content: document.querySelector('.pending__content'),
  alerts: document.querySelector('.pending__alerts'),
  status: document.querySelector('#pending-status'),
  skeleton: document.querySelector('.pending__content .skeleton'),
  google: document.querySelector('#pending-google'),
  googleTitle: document.querySelector('#pending-google-title'),
  googleList: document.querySelector('#pending-google .pending-list'),
  ai: document.querySelector('#pending-ai'),
  aiTitle: document.querySelector('#pending-ai-title'),
  aiList: document.querySelector('#pending-ai .pending-list'),
  empty: document.querySelector('.empty-state'),
  emptyIcon: document.querySelector('.empty-state__icon'),
  emptyText: document.querySelector('.empty-state__text'),
  refresh: document.querySelector('.pending__refresh'),
  pageTitle: document.querySelector('.screen-title'),
};

let loadSeq = 0;

// ---------- Small builders ----------

function button(className, label, iconName, ariaLabel) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn ${className}`;
  if (iconName) b.append(icon(iconName));
  const text = document.createElement('span');
  text.textContent = label;
  b.append(text);
  if (ariaLabel) b.setAttribute('aria-label', ariaLabel);
  return b;
}

// Icon + text. ltrText (optional) is a time range, isolated left-to-right so
// "10:00–10:45" is not flipped by the RTL layout.
function metaLine(text, iconName, ltrText = null) {
  const span = document.createElement('span');
  span.className = 'meta-time';
  span.append(icon(iconName));
  const t = document.createElement('span');
  t.textContent = text;
  if (ltrText) {
    t.append(' · ');
    const time = document.createElement('span');
    time.dir = 'ltr';
    time.textContent = ltrText;
    t.append(time);
  }
  span.append(t);
  return span;
}

// "יום ב׳, 13.10" + "17:00–18:30" (or "יום שלם", which is Hebrew)
function eventTime(event) {
  if (!event.start_time) return MESSAGES.allDay;
  return event.end_time
    ? `${formatTime(event.start_time)}–${formatTime(event.end_time)}`
    : formatTime(event.start_time);
}

function sourceTag(source) {
  const tag = document.createElement('span');
  tag.className = 'source-tag';
  tag.append(icon(source.icon));
  const text = document.createElement('span');
  text.textContent = source.label;
  tag.append(text);
  return tag;
}

// ---------- Cards ----------

function renderEventCard(event) {
  const li = document.createElement('li');
  li.className = 'pending-card';
  li.dataset.id = event.id;

  const body = document.createElement('div');
  body.className = 'pending-card__body';
  const title = document.createElement('h3');
  title.className = 'item-card__title';
  title.textContent = event.title;
  const meta = document.createElement('p');
  meta.className = 'item-card__meta';
  meta.append(metaLine(formatDayLabel(event.date), 'clock', eventTime(event)), sourceTag(SOURCE_TAGS.google));
  body.append(title, meta);

  const actions = document.createElement('div');
  actions.className = 'pending-card__actions';
  const review = button('btn--primary btn--small', MESSAGES.review, null, MESSAGES.reviewEvent(event.title));
  const dismiss = button('btn--secondary btn--small', MESSAGES.dismiss, null, MESSAGES.dismissEvent(event.title));
  actions.append(review, dismiss);

  review.addEventListener('click', () => {
    openGoogleApproveModal({
      event,
      opener: review,
      fallbackFocus: el.pageTitle,
      onDone: ({ found }) => {
        // Runs after the modal has closed, so focus can move to the next card.
        setTimeout(() => (found ? removeCard(li, { force: true }) : alreadyHandled()));
      },
    });
  });
  dismiss.addEventListener('click', () => act(li, () => dismissGoogleEvent(event.id)));

  li.append(body, actions);
  return li;
}

function renderSuggestionCard(task) {
  const li = document.createElement('li');
  li.className = 'pending-card pending-card--ai';
  li.dataset.id = task.id;

  const head = document.createElement('div');
  head.className = 'pending-card__head';
  const badge = document.createElement('span');
  badge.className = 'ai-icon';
  badge.append(icon('sparkle'));

  const body = document.createElement('div');
  body.className = 'pending-card__body';
  const title = document.createElement('h3');
  title.className = 'item-card__title';
  // The icon is decorative; the words "הצעת AI" are read before the title.
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  label.textContent = `${MESSAGES.aiSuggestion}: `;
  title.append(label, document.createTextNode(task.title));
  const meta = document.createElement('p');
  meta.className = 'item-card__meta';
  if (task.notes) {
    const note = document.createElement('span');
    note.textContent = task.notes;
    meta.append(note);
  }
  meta.append(metaLine(formatDayLabel(task.date), 'calendar'));
  body.append(title, meta);
  head.append(badge, body);

  const actions = document.createElement('div');
  actions.className = 'pending-card__actions pending-card__actions--split';
  const approve = button('btn--primary btn--small', MESSAGES.approve, 'check', MESSAGES.approveSuggestion(task.title));
  const reject = button('btn--secondary btn--small', MESSAGES.reject, 'close', MESSAGES.rejectSuggestion(task.title));
  actions.append(approve, reject);

  approve.addEventListener('click', () => act(li, () => approveSuggestion(task.id)));
  reject.addEventListener('click', () => act(li, () => rejectSuggestion(task.id)));

  li.append(head, actions);
  return li;
}

// ---------- Actions ----------

function setCardBusy(li, busy) {
  li.setAttribute('aria-busy', String(busy));
  for (const b of li.querySelectorAll('button')) b.disabled = busy;
}

// Dismiss / approve / reject straight from the card (no confirm, DESIGN.md).
async function act(li, run) {
  clearError(el.alerts);
  setCardBusy(li, true);
  try {
    const { found } = await run();
    if (!found) return alreadyHandled();
    removeCard(li);
  } catch (err) {
    console.error('Pending action failed:', err);
    setCardBusy(li, false);
    showError(el.alerts, MESSAGES.statusSaveFailed, () => loadPending({ keep: true }));
  }
}

// Where focus goes when a card disappears: next card, previous card, the
// section title, else the page title.
function focusTarget(li) {
  const neighbor = li.nextElementSibling ?? li.previousElementSibling;
  if (neighbor) return neighbor.querySelector('button');
  return null;
}

// force: move focus even if it is not in the card (after the approve modal).
function removeCard(li, { force = false } = {}) {
  const hadFocus = force || li.contains(document.activeElement) || document.activeElement === document.body;
  const target = focusTarget(li);
  li.remove();
  update({ announce: true });
  if (!hadFocus) return;
  if (target) target.focus();
  else {
    const other = [el.googleList, el.aiList].find((list) => list.children.length > 0);
    (other ? other.querySelector('button') : el.pageTitle).focus();
  }
}

// The other parent already handled it: say so and show the current state.
function alreadyHandled() {
  showError(el.alerts, MESSAGES.alreadyHandled, () => loadPending({ keep: true }));
  // The clicked card may vanish in the reload, so focus moves to the page title.
  loadPending({ keep: true, keepAlerts: true }).then(() => el.pageTitle.focus());
}

// ---------- Rendering ----------

// announce: tell screen readers the new count (after an action, not on load).
function update({ announce = false } = {}) {
  const google = el.googleList.children.length;
  const ai = el.aiList.children.length;
  el.google.hidden = google === 0;
  el.ai.hidden = ai === 0;
  el.empty.hidden = google + ai > 0;
  setPendingCount(google + ai);
  if (announce) {
    el.status.textContent = google + ai > 0 ? MESSAGES.pendingCount(google + ai) : MESSAGES.pendingEmpty;
  }
}

function render(events, tasks) {
  el.googleList.replaceChildren(...events.map(renderEventCard));
  el.aiList.replaceChildren(...tasks.map(renderSuggestionCard));
  update();
}

// ---------- Loading ----------

function setBusy(busy) {
  el.content.setAttribute('aria-busy', String(busy));
  for (const b of document.querySelectorAll('[data-refresh]')) b.disabled = busy;
}

// keep: true keeps the current cards visible while reloading (refresh / retry).
async function loadPending({ keep = false, keepAlerts = false } = {}) {
  const seq = ++loadSeq;
  if (!keepAlerts) clearError(el.alerts);
  setBusy(true);
  if (!keep) {
    el.google.hidden = true;
    el.ai.hidden = true;
    el.empty.hidden = true;
    el.skeleton.hidden = false;
  }

  try {
    const [events, tasks] = await Promise.all([getPendingEvents(), getProposedTasks()]);
    if (seq !== loadSeq) return; // a newer request won
    render(events, tasks);
  } catch (err) {
    if (seq !== loadSeq) return;
    console.error('Pending load failed:', err);
    showError(el.alerts, MESSAGES.boardLoadFailed, () => loadPending({ keep: true }));
  } finally {
    if (seq === loadSeq) {
      el.skeleton.hidden = true;
      setBusy(false);
    }
  }
}

function refresh() {
  loadPending({ keep: true });
}

// ---------- Start ----------

function initPage() {
  el.googleTitle.textContent = MESSAGES.pendingGoogleTitle;
  el.aiTitle.textContent = MESSAGES.pendingAiTitle;
  el.emptyIcon.append(icon('check'));
  el.emptyText.textContent = MESSAGES.pendingEmpty;
  el.pageTitle.tabIndex = -1;

  el.refresh.append(icon('refresh'));
  el.refresh.setAttribute('aria-label', MESSAGES.refresh);
  el.refresh.addEventListener('click', refresh);
}

initPage();
initProtectedPage({
  page: 'pending',
  title: MESSAGES.pendingTitle,
  onRefresh: refresh,
  onReady: () => loadPending(),
});
