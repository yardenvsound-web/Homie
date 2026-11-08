// Shopping list page (shopping.html): F23 Quick Add, F24 mark as purchased, F47 refresh.
// Not built yet (hidden, DESIGN.md "מה מוצג בכל שלב"): editable quantity (F25),
// duplicate warning (F26), ✕ delete (F27), "בטל" toast (F46), "last updated" (F11).

import { initProtectedPage } from './nav.js';
import { getActiveItems, addItem, markPurchased } from './data/shopping.js';
import { MESSAGES, LIMITS, icon, showError, clearError } from './ui.js';

const el = {
  content: document.querySelector('.shopping__content'),
  alerts: document.querySelector('.shopping__alerts'),
  skeleton: document.querySelector('.shopping__content .skeleton'),
  list: document.querySelector('.shop-list'),
  empty: document.querySelector('.empty-state'),
  emptyIcon: document.querySelector('.empty-state__icon'),
  emptyText: document.querySelector('.empty-state__text'),
  refresh: document.querySelector('.shopping__refresh'),
  form: document.querySelector('.quick-add'),
  name: document.querySelector('#item-name'),
  nameLabel: document.querySelector('label[for="item-name"]'),
  nameError: document.querySelector('#item-name-error'),
  qty: document.querySelector('#item-qty'),
  qtyLabel: document.querySelector('label[for="item-qty"]'),
  qtyError: document.querySelector('#item-qty-error'),
  submit: document.querySelector('.quick-add__submit'),
  formError: document.querySelector('#quick-add-error'),
};

let loadSeq = 0;
let adding = false;

// ---------- Rows ----------

function renderRow(item) {
  const li = document.createElement('li');
  li.className = 'shop-item';
  li.dataset.id = item.id;

  // Real checkbox over a 44×44 touch area; the visible 24×24 box is drawn next to it.
  const check = document.createElement('span');
  check.className = 'check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'check__input';
  checkbox.setAttribute('aria-label', MESSAGES.markPurchased(item.name, item.quantity));
  const box = document.createElement('span');
  box.className = 'check__box';
  box.setAttribute('aria-hidden', 'true');
  box.append(icon('check'));
  check.append(checkbox, box);

  const name = document.createElement('span');
  name.className = 'shop-item__name';
  name.textContent = item.name;

  // Display only until F25 (Milestone 7).
  const qty = document.createElement('span');
  qty.className = 'shop-item__qty';
  qty.setAttribute('aria-label', MESSAGES.quantityValue(item.quantity));
  qty.textContent = String(item.quantity);

  li.append(check, name, qty);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) purchase(li, checkbox);
  });
  return li;
}

function updateEmpty() {
  const isEmpty = el.list.children.length === 0;
  el.list.hidden = isEmpty;
  el.empty.hidden = !isEmpty;
}

function renderList(items) {
  el.list.replaceChildren(...items.map(renderRow));
  updateEmpty();
}

// ---------- Mark as purchased (F24) ----------

// Where focus goes when a row disappears: next row, else previous, else the name field.
function focusAfterRemoval(li) {
  const neighbor = li.nextElementSibling ?? li.previousElementSibling;
  return neighbor?.querySelector('.check__input') ?? el.name;
}

async function purchase(li, checkbox) {
  clearError(el.alerts);
  const target = focusAfterRemoval(li);
  const next = li.nextElementSibling;
  const hadFocus = document.activeElement === checkbox;

  // Optimistic: the row disappears right away.
  li.remove();
  updateEmpty();
  if (hadFocus) target.focus();

  try {
    await markPurchased(li.dataset.id);
    // found: false means the row is already gone; nothing to show.
  } catch (err) {
    console.error('Mark purchased failed:', err);
    checkbox.checked = false;
    // Put the row back where it was.
    if (next?.isConnected) el.list.insertBefore(li, next);
    else el.list.append(li);
    updateEmpty();
    showError(el.alerts, MESSAGES.statusSaveFailed, () => loadList({ keep: true }));
  }
}

// ---------- Quick Add (F23) ----------

function setFieldError(input, errorEl, message) {
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorEl.id);
    errorEl.replaceChildren(icon('warning'), document.createTextNode(message));
    errorEl.hidden = false;
  } else {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    errorEl.replaceChildren();
    errorEl.hidden = true;
  }
}

// Returns { name, quantity } or null (errors shown next to the fields).
function validate() {
  const name = el.name.value.trim();
  const rawQty = el.qty.value.trim();
  let nameError = null;
  let qtyError = null;

  if (!name) nameError = MESSAGES.productRequired;
  else if (name.length > LIMITS.productName) nameError = MESSAGES.tooLong(LIMITS.productName);

  // Empty quantity = 1 (PRD 4.13). Otherwise a whole number, 1 or more.
  let quantity = 1;
  if (rawQty !== '' || el.qty.validity.badInput) {
    quantity = Number(rawQty);
    if (el.qty.validity.badInput || !Number.isInteger(quantity) || quantity < 1) {
      qtyError = MESSAGES.quantityInvalid;
    }
  }

  setFieldError(el.name, el.nameError, nameError);
  setFieldError(el.qty, el.qtyError, qtyError);
  if (nameError) el.name.focus();
  else if (qtyError) el.qty.focus();
  return nameError || qtyError ? null : { name, quantity };
}

function setAdding(value) {
  adding = value;
  el.submit.disabled = value;
  el.submit.replaceChildren(...(value ? [document.createTextNode(MESSAGES.adding)] : submitLabel()));
}

function submitLabel() {
  const text = document.createElement('span');
  text.textContent = MESSAGES.add;
  return [icon('plus'), text];
}

async function onAdd(e) {
  e.preventDefault();
  if (adding) return;
  el.formError.textContent = '';
  const fields = validate();
  if (!fields) return;

  setAdding(true);
  try {
    const item = await addItem(fields);
    el.list.append(renderRow(item));
    updateEmpty();
    el.name.value = '';
    el.qty.value = '1';
    el.name.focus();
  } catch (err) {
    console.error('Add item failed:', err);
    el.formError.textContent = MESSAGES.addItemFailed;
  } finally {
    setAdding(false);
  }
}

// ---------- Loading ----------

function setBusy(busy) {
  el.content.setAttribute('aria-busy', String(busy));
  for (const button of document.querySelectorAll('[data-refresh]')) button.disabled = busy;
}

// keep: true keeps the current list visible while reloading (refresh / retry).
async function loadList({ keep = false } = {}) {
  const seq = ++loadSeq;
  clearError(el.alerts);
  setBusy(true);
  if (!keep) {
    el.list.hidden = true;
    el.empty.hidden = true;
    el.skeleton.hidden = false;
  }

  try {
    const items = await getActiveItems();
    if (seq !== loadSeq) return; // a newer request won
    renderList(items);
  } catch (err) {
    if (seq !== loadSeq) return;
    console.error('Shopping list load failed:', err);
    showError(el.alerts, MESSAGES.boardLoadFailed, () => loadList({ keep: true }));
  } finally {
    if (seq === loadSeq) {
      el.skeleton.hidden = true;
      setBusy(false);
    }
  }
}

function refresh() {
  loadList({ keep: true });
}

// ---------- Start ----------

function initPage() {
  el.nameLabel.textContent = MESSAGES.productNameLabel;
  el.name.placeholder = MESSAGES.productNameLabel;
  el.name.maxLength = LIMITS.productName;
  el.qtyLabel.textContent = MESSAGES.quantityLabel;
  el.qty.placeholder = MESSAGES.quantityLabel;
  el.submit.replaceChildren(...submitLabel());
  el.emptyIcon.append(icon('cart'));
  el.emptyText.textContent = MESSAGES.shoppingEmpty;

  el.refresh.append(icon('refresh'));
  el.refresh.setAttribute('aria-label', MESSAGES.refresh);
  el.refresh.addEventListener('click', refresh);

  el.name.addEventListener('input', () => setFieldError(el.name, el.nameError, null));
  el.qty.addEventListener('input', () => setFieldError(el.qty, el.qtyError, null));
  el.form.addEventListener('submit', onAdd);
}

initPage();
initProtectedPage({
  page: 'shopping',
  title: 'רשימת קניות',
  onRefresh: refresh,
  onReady: () => loadList(),
});
