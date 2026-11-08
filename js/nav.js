// Shared navigation: top bar (+ bottom bar on phone) with the signed-in parent
// and "יציאה". Also bootstraps every protected page (session → members → nav).
// Not shown yet (DESIGN.md "מה מוצג בכל שלב"): weekly calendar tab (M8),
// pending counter (M6), refresh button (M3), "last updated" (M7).

import { requireSession, signOut } from './auth.js';
import { loadMembers, findParentByUserId, renderAvatar } from './members.js';
import { MESSAGES, icon, showError, clearError } from './ui.js';

const TABS = [
  { page: 'index', href: 'index.html', label: 'לוח היום', icon: 'home' },
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
    li.append(a);
    list.append(li);
  }
  const nav = document.createElement('nav');
  nav.className = className;
  nav.setAttribute('aria-label', 'ניווט ראשי');
  nav.append(list);
  return nav;
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

export function renderNav({ page, title, parent = null, parentKnown = true }) {
  document.querySelector('.topbar')?.remove();
  document.querySelector('.bottomnav')?.remove();

  const header = document.createElement('header');
  header.className = 'topbar';

  // Phone only: the screen title sits in the top bar (decorative copy of the page h1).
  const titleEl = document.createElement('span');
  titleEl.className = 'topbar__title';
  titleEl.setAttribute('aria-hidden', 'true');
  titleEl.textContent = title;

  const brand = document.createElement('a');
  brand.className = 'topbar__brand';
  brand.href = 'index.html';
  brand.textContent = 'Homie';

  header.append(titleEl, brand, buildLinks(page, 'topnav'), buildAccount(parent, parentKnown));
  document.body.prepend(header);
  document.body.append(buildLinks(page, 'bottomnav'));
}

// Bootstraps a protected page. onReady(members) runs after members load.
export async function initProtectedPage({ page, title, onReady }) {
  const user = await requireSession();
  const main = document.querySelector('main');

  async function load() {
    try {
      const members = await loadMembers();
      clearError(main);
      const parent = findParentByUserId(user.id);
      if (!parent) console.warn('Signed-in user is not listed in members.json:', user.id);
      renderNav({ page, title, parent });
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
