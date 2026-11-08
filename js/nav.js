// Shared navigation: top bar (+ bottom bar on phone) with the signed-in parent
// and "יציאה". Also bootstraps every protected page (session → members → nav).
// Pending counter (F28) on the "ממתין לאישור" tab, counted on every page load.
// Not shown yet (DESIGN.md "מה מוצג בכל שלב"): weekly calendar tab (M8).
// The desktop refresh button and "last updated" (F11) appear only on pages that
// pass onRefresh (ADR-7, ADR-16).

import { requireSession, signOut } from './auth.js';
import { loadMembers, findParentByUserId, renderAvatar } from './members.js';
import { countPendingEvents } from './data/events.js';
import { countProposedTasks } from './data/tasks.js';
import { MESSAGES, icon, showError, clearError, renderLastUpdated } from './ui.js';

const TABS = [
  { page: 'index', href: 'index.html', label: 'לוח', icon: 'home' },
  { page: 'shopping', href: 'shopping.html', label: 'קניות', icon: 'cart' },
  { page: 'pending', href: 'pending.html', label: 'ממתין לאישור', icon: 'clock' },
];

function buildLinks(page, className) {
  const list = document.createElement('ul');
  list.className = `${className}__list`;
  for (const tab of TABS) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = `${className}__link`;
    a.href = tab.href;
    if (tab.page === page) a.setAttribute('aria-current', 'page');

    const iconWrap = document.createElement('span');
    iconWrap.className = `${className}__icon`;
    iconWrap.append(icon(tab.icon));

    const label = document.createElement('span');
    label.className = `${className}__label`;
    label.textContent = tab.label;

    a.append(iconWrap, label);
    if (tab.page === 'pending') {
      a.dataset.pendingLink = '';
      // Phone: on the icon; desktop: after the label.
      (className === 'bottomnav' ? iconWrap : a).append(countBadge());
    }
    li.append(a);
    list.append(li);
  }
  const nav = document.createElement('nav');
  nav.className = className;
  nav.setAttribute('aria-label', 'ניווט ראשי');
  nav.append(list);
  return nav;
}

// Red counter circle. The number itself is the signal (not the color); screen
// readers get it from the link's aria-label instead (setPendingCount).
export function countBadge() {
  const badge = document.createElement('span');
  badge.className = 'count-badge';
  badge.dataset.pendingCount = '';
  badge.setAttribute('aria-hidden', 'true');
  badge.hidden = true;
  return badge;
}

// Shows n on every counter on the page (tabs, and the Pending page title).
export function setPendingCount(n) {
  for (const badge of document.querySelectorAll('[data-pending-count]')) {
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }
  for (const link of document.querySelectorAll('[data-pending-link]')) {
    if (n > 0) link.setAttribute('aria-label', MESSAGES.pendingTabLabel(n));
    else link.removeAttribute('aria-label');
  }
}

// Counts pending Google events + proposed AI tasks. On failure the counter is
// just hidden: the page itself keeps working.
export async function refreshPendingCount() {
  try {
    const [events, tasks] = await Promise.all([countPendingEvents(), countProposedTasks()]);
    setPendingCount(events + tasks);
  } catch (err) {
    console.error('Pending count failed:', err);
    setPendingCount(0);
  }
}

// parent: member object, or null. parentKnown: false when members failed to load
// (then no name is shown, only "יציאה").
function buildAccount(parent, parentKnown) {
  const name = parent ? parent.name : parentKnown ? MESSAGES.unknownParent : null;

  const account = document.createElement('div');
  account.className = 'account';

  // Phone: avatar button that opens a small menu.
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'account__toggle';
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'account-panel');
  toggle.setAttribute('aria-label', name ? `${name} – תפריט חשבון` : 'תפריט חשבון');
  toggle.append(name ? renderAvatar(parent, 's', name.charAt(0)) : icon('user'));

  // Desktop: the same panel is shown inline in the top bar.
  const panel = document.createElement('div');
  panel.className = 'account__panel';
  panel.id = 'account-panel';

  if (name) {
    const who = document.createElement('span');
    who.className = 'account__who';
    who.append(renderAvatar(parent, 's', name.charAt(0)));
    const nameEl = document.createElement('span');
    nameEl.className = 'account__name';
    nameEl.textContent = name;
    who.append(nameEl);
    panel.append(who);
  }

  const logout = document.createElement('button');
  logout.type = 'button';
  logout.className = 'btn btn--secondary btn--small account__logout';
  logout.append(icon('logout'));
  const logoutText = document.createElement('span');
  logoutText.textContent = MESSAGES.signOut;
  logout.append(logoutText);
  logout.addEventListener('click', () => {
    logout.disabled = true;
    signOut();
  });
  panel.append(logout);

  function setOpen(open, returnFocus = false) {
    account.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) logout.focus();
    else if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setOpen(!account.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && account.classList.contains('is-open')) setOpen(false, true);
  });
  document.addEventListener('click', (e) => {
    if (account.classList.contains('is-open') && !account.contains(e.target)) setOpen(false);
  });

  account.append(toggle, panel);
  return account;
}

// Desktop / tablet only (hidden on phone by CSS; the phone button lives in the page).
function buildRefresh(onRefresh) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn--secondary btn--small topbar__refresh';
  button.dataset.refresh = '';
  button.append(icon('refresh'));
  const text = document.createElement('span');
  text.textContent = MESSAGES.refresh;
  button.append(text);
  button.addEventListener('click', () => onRefresh());
  return button;
}

export function renderNav({ page, title, parent = null, parentKnown = true, onRefresh = null }) {
  document.querySelector('.topbar')?.remove();
  document.querySelector('.bottomnav')?.remove();

  const header = document.createElement('header');
  header.className = 'topbar';

  // Phone only: the screen title sits in the top bar (decorative copy of the page h1).
  const titleEl = document.createElement('span');
  titleEl.className = 'topbar__title';
  titleEl.setAttribute('aria-hidden', 'true');
  titleEl.textContent = title;
  if (page === 'pending') titleEl.append(countBadge());

  const brand = document.createElement('a');
  brand.className = 'topbar__brand';
  brand.href = 'index.html';
  const logo = document.createElement('img');
  logo.className = 'topbar__logo';
  logo.src = 'img/logo-mark.png';
  logo.alt = '';
  logo.width = 28;
  logo.height = 28;
  brand.append(logo, 'Homie');

  header.append(titleEl, brand, buildLinks(page, 'topnav'));
  if (onRefresh) {
    // Desktop / tablet: "עודכן לאחרונה" sits right before the refresh button.
    const updated = document.createElement('span');
    updated.className = 'last-updated topbar__updated';
    updated.dataset.lastUpdated = '';
    updated.hidden = true;
    header.append(updated, buildRefresh(onRefresh));
  }
  header.append(buildAccount(parent, parentKnown));
  document.body.prepend(header);
  document.body.append(buildLinks(page, 'bottomnav'));
  renderLastUpdated();
}

// Bootstraps a protected page. onReady(members) runs after members load.
// onRefresh (optional) adds the desktop "רענון" button to the top bar.
// The Pending page sets the counter from its own data, so it skips the count here.
export async function initProtectedPage({ page, title, onReady, onRefresh = null }) {
  const user = await requireSession();
  const main = document.querySelector('main');

  async function load() {
    try {
      const members = await loadMembers();
      clearError(main);
      const parent = findParentByUserId(user.id);
      if (!parent) console.warn('Signed-in user is not listed in members.json:', user.id);
      renderNav({ page, title, parent, onRefresh });
      if (page !== 'pending') refreshPendingCount();
      onReady?.(members);
    } catch (err) {
      console.error(err);
      renderNav({ page, title, parentKnown: false });
      showError(main, MESSAGES.membersLoadFailed, load);
    }
  }

  await load();
  document.body.classList.remove('is-loading');
}
