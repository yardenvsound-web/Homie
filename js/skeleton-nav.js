// TEMPORARY navigation for Milestone 1 (walking skeleton) only.
// Milestone 2 deletes this file and replaces it with js/nav.js
// (bottom bar on phone, top bar on desktop, without the login link).

const LINKS = [
  { href: 'login.html', label: 'כניסה' },
  { href: 'index.html', label: 'לוח היום' },
  { href: 'shopping.html', label: 'קניות' },
  { href: 'pending.html', label: 'ממתין לאישור' },
];

function currentPage() {
  const last = window.location.pathname.split('/').pop();
  return last === '' ? 'index.html' : last;
}

function renderSkeletonNav() {
  const nav = document.createElement('nav');
  nav.className = 'skeleton-nav';
  nav.setAttribute('aria-label', 'ניווט ראשי');

  const list = document.createElement('ul');
  const here = currentPage();

  for (const link of LINKS) {
    const item = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    if (link.href === here) a.setAttribute('aria-current', 'page');
    item.append(a);
    list.append(item);
  }

  nav.append(list);
  document.body.prepend(nav);
}

renderSkeletonNav();
