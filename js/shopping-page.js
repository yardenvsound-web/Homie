// Shopping list page (shopping.html): F23 Quick Add, F24 mark as purchased,
// F25 editable quantity, F26 duplicate warning, F27 ✕ delete, F46 "בטל" toast,
// F47 refresh, F11 "last updated".

import { initProtectedPage, refreshPendingCount } from './nav.js';
import {
  getActiveItems, findActiveByName, addItem, markPurchased, markUnpurchased,
  updateQuantity, deleteItem,
} from './data/shopping.js';
import {
  MESSAGES, LIMITS, icon, showError, clearError, showToast,
  markLoading, markLoaded, markFailed, lastUpdatedDetail,
} from './ui.js';

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
  toastRegion: document.querySelector('.toast-region'),
};

let loadSeq = 0;
let adding = false;
// Open duplicate warning (F26): { el, existing } or null.
let duplicate = null;

// Whole number, 1 or more (PRD 4.13). input: a number field.
function parseQuantity(input) {
  const raw = input.value.trim();
  const n = Number(raw);
  if (input.validity.badInput || raw === '' || !Number.isInteger(n) || n < 1) return null;
  return n;
}

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

  // Quantity box (F25): saved on change (leaving the field or Enter).
  const qty = document.createElement('input');
  qty.type = 'number';
  qty.min = '1';
  qty.step = '1';
  qty.inputMode = 'numeric';
  qty.className = 'shop-item__qty';
  qty.value = String(item.quantity);
  qty.setAttribute('aria-label', MESSAGES.quantityOf(item.name));

  const qtyError = document.createElement('p');
  qtyError.className = 'field__error shop-item__error';
  qtyError.id = `qty-error-${item.id}`;
  qtyError.hidden = true;

  function setQtyError(message) {
    setFieldError(qty, qtyError, message);
  }

  let savingQty = false;
  async function commitQuantity() {
    const quantity = parseQuantity(qty);
    if (quantity === null) {
      qty.value = String(item.quantity); // invalid: back to the saved value
      setQtyError(MESSAGES.quantityInvalid);
      return;
    }
    setQtyError(null);
    if (quantity === item.quantity || savingQty) return;
    const previous = item.quantity;
    item.quantity = quantity; // optimistic
    checkbox.setAttribute('aria-label', MESSAGES.markPurchased(item.name, quantity));
    savingQty = true;
    try {
      const { found } = await updateQuantity(item.id, quantity);
      if (!found) loadList({ keep: true }); // deleted by the other parent
    } catch (err) {
      console.error('Quantity update failed:', err);
      item.quantity = previous;
      qty.value = String(previous);
      checkbox.setAttribute('aria-label', MESSAGES.markPurchased(item.name, previous));
      showError(el.alerts, MESSAGES.statusSaveFailed, () => loadList({ keep: true }));
    } finally {
      savingQty = false;
    }
  }
  qty.addEventListener('change', commitQuantity);
  qty.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitQuantity();
    }
  });

  // ✕ (F27): deletes right away, no confirmation.
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'icon-btn shop-item__delete';
  del.setAttribute('aria-label', MESSAGES.deleteItem(item.name));
  del.append(icon('close'));
  del.addEventListener('click', () => remove(li, item));

  li.append(check, name, qty, del, qtyError);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) purchase(li, checkbox, item);
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

// Removes a row right away (optimistic) and returns a function that puts it back.
function removeRow(li, focusEl) {
  const target = focusAfterRemoval(li);
  const next = li.nextElementSibling;
  const hadFocus = li.contains(document.activeElement) || document.activeElement === focusEl;
  li.remove();
  updateEmpty();
  if (hadFocus) target.focus();
  return () => {
    if (next?.isConnected) el.list.insertBefore(li, next);
    else el.list.append(li);
    updateEmpty();
  };
}

async function purchase(li, checkbox, item) {
  clearError(el.alerts);
  const restore = removeRow(li, checkbox);

  try {
    const { found } = await markPurchased(item.id);
    // found: false means the row is already gone; nothing to undo.
    if (found) showUndoToast(item);
  } catch (err) {
    console.error('Mark purchased failed:', err);
    checkbox.checked = false;
    restore();
    showError(el.alerts, MESSAGES.statusSaveFailed, () => loadList({ keep: true }));
  }
}

// ---------- "בטל" toast (F46) ----------

// Shown only after the purchase was saved. 5 seconds, then there is no way back.
function showUndoToast(item) {
  showToast({
    region: el.toastRegion,
    message: MESSAGES.purchasedToast(item.name),
    actionLabel: MESSAGES.undo,
    onAction: () => undoPurchase(item),
  });
}

async function undoPurchase(item) {
  clearError(el.alerts);
  try {
    await markUnpurchased(item.id);
    await loadList({ keep: true });
    const back = el.list.querySelector(`.shop-item[data-id="${item.id}"] .check__input`);
    (back ?? el.name).focus();
  } catch (err) {
    console.error('Undo purchase failed:', err);
    showError(el.alerts, MESSAGES.undoFailed, () => loadList({ keep: true }));
    el.name.focus();
  }
}

// ---------- Delete (F27) ----------

async function remove(li, item) {
  clearError(el.alerts);
  const restore = removeRow(li);
  try {
    await deleteItem(item.id); // already gone = same result
  } catch (err) {
    console.error('Delete item failed:', err);
    restore();
    showError(el.alerts, MESSAGES.deleteFailed, () => loadList({ keep: true }));
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

// ---------- Duplicate warning (F26) ----------

function hideDuplicate() {
  if (!duplicate) return;
  duplicate.el.remove();
  duplicate = null;
  el.name.classList.remove('field__input--warning');
}

function resetQuickAdd() {
  el.name.value = '';
  el.qty.value = '1';
  el.name.focus();
}

// "המוצר כבר ברשימה": mustard border on the name field and a butter note under
// it, with "עדכון כמות" (primary) and "ביטול" (secondary) – DESIGN.md.
function showDuplicate(existing, quantity) {
  hideDuplicate();
  const box = document.createElement('div');
  box.className = 'dup-alert';
  box.setAttribute('role', 'alert');

  const text = document.createElement('p');
  text.className = 'dup-alert__text';
  text.append(icon('warning'));
  const span = document.createElement('span');
  span.textContent = MESSAGES.duplicateItem(existing.name, existing.quantity);
  text.append(span);

  const actions = document.createElement('div');
  actions.className = 'dup-alert__actions';
  const update = document.createElement('button');
  update.type = 'button';
  update.className = 'btn btn--primary btn--small';
  update.textContent = MESSAGES.updateQuantity;
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn--secondary btn--small';
  cancel.textContent = MESSAGES.cancel;
  actions.append(update, cancel);
  box.append(text, actions);

  // "עדכון כמות" replaces the existing quantity with the one typed (ADR-15).
  update.addEventListener('click', async () => {
    update.disabled = true;
    cancel.disabled = true;
    box.querySelector('.form-error')?.remove();
    try {
      const { found } = await updateQuantity(existing.id, quantity);
      // Deleted meanwhile by the other parent: add it as a new item instead.
      if (!found) await addItem({ name: el.name.value.trim(), quantity });
      hideDuplicate();
      await loadList({ keep: true });
      resetQuickAdd();
    } catch (err) {
      console.error('Duplicate quantity update failed:', err);
      update.disabled = false;
      cancel.disabled = false;
      const error = document.createElement('p');
      error.className = 'form-error';
      error.textContent = MESSAGES.saveFailed;
      box.append(error);
      update.focus();
    }
  });
  cancel.addEventListener('click', () => {
    hideDuplicate();
    el.name.focus();
  });

  el.name.classList.add('field__input--warning');
  el.form.querySelector('.quick-add__row').after(box);
  duplicate = { el: box, existing };
  update.focus();
}

async function onAdd(e) {
  e.preventDefault();
  if (adding) return;
  el.formError.textContent = '';
  hideDuplicate();
  const fields = validate();
  if (!fields) return;

  setAdding(true);
  try {
    const existing = await findActiveByName(fields.name);
    if (existing) {
      setAdding(false);
      showDuplicate(existing, fields.quantity);
      return;
    }
    const item = await addItem(fields);
    el.list.append(renderRow(item));
    updateEmpty();
    resetQuickAdd();
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
  markLoading();
  if (!keep) {
    el.list.hidden = true;
    el.empty.hidden = true;
    el.skeleton.hidden = false;
  }

  try {
    const items = await getActiveItems();
    if (seq !== loadSeq) return; // a newer request won
    renderList(items);
    markLoaded();
  } catch (err) {
    if (seq !== loadSeq) return;
    console.error('Shopping list load failed:', err);
    markFailed();
    showError(el.alerts, MESSAGES.boardLoadFailed, () => loadList({ keep: true }), lastUpdatedDetail());
  } finally {
    if (seq === loadSeq) {
      el.skeleton.hidden = true;
      setBusy(false);
    }
  }
}

function refresh() {
  loadList({ keep: true });
  refreshPendingCount();
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

  el.name.addEventListener('input', () => {
    setFieldError(el.name, el.nameError, null);
    hideDuplicate();
  });
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
