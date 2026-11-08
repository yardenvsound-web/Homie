// Shared UI helpers and Hebrew UI wording.
// Milestone 3 adds the modal, skeleton rows and "last updated".

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
};

// Outline icons (24×24, stroke = currentColor, width from CSS).
const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M2.5 3.5H5l2.4 11.5h10.6l2-8H6.2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
  warning: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><path d="M12 17.2v.3"/>',
  logout: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
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
