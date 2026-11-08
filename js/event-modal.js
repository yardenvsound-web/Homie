// Internal event modal: create (F18, F20), edit (F19) and delete (F45).
// Google approve-and-assign modal (F29).

import { renderMemberPicker } from './members.js';
import { createEvent, updateEvent, deleteEvent, approveGoogleEvent } from './data/events.js';
import { formatTime } from './time.js';
import { MESSAGES, LIMITS, icon, createModal, addDeleteButton, createField, fieldRow } from './ui.js';

// event: existing internal event (edit) or null (create). date: prefilled date
// for a new event. Callbacks: onSaved(date) after save, onDeleted() after delete,
// onGone() when the event was already deleted by the other parent.
export function openEventModal({ event = null, date, opener, fallbackFocus, onSaved, onDeleted, onGone }) {
  const editing = Boolean(event);
  const title = createField({ id: 'event-title', label: MESSAGES.eventTitleLabel, maxLength: LIMITS.title });
  const dateField = createField({ id: 'event-date', label: MESSAGES.dateLabel, type: 'date' });
  const start = createField({ id: 'event-start', label: MESSAGES.startTimeLabel, type: 'time' });
  const end = createField({ id: 'event-end', label: MESSAGES.endTimeLabel, type: 'time' });
  const picker = renderMemberPicker({
    id: 'event-members',
    legend: MESSAGES.participantsLabel,
    selectedIds: event?.assigned_member_ids ?? [],
  });
  const notes = createField({
    id: 'event-notes',
    label: MESSAGES.notesLabel,
    type: 'textarea',
    maxLength: LIMITS.notes,
    placeholder: MESSAGES.notesPlaceholder,
  });
  title.input.value = event?.title ?? '';
  dateField.input.value = event?.date ?? date;
  start.input.value = formatTime(event?.start_time ?? '');
  end.input.value = formatTime(event?.end_time ?? '');
  notes.input.value = event?.notes ?? '';

  // Changing the start time can fix the end-time error, so clear it too.
  start.input.addEventListener('input', () => end.setError(null));

  // PRD 4.13: no start time = all-day event (end must stay empty); with a start
  // time, the end time is required and later the same day.
  function validate() {
    const values = {
      title: title.input.value.trim(),
      date: dateField.input.value,
      start_time: start.input.value || null,
      end_time: end.input.value || null,
      assigned_member_ids: picker.getSelected(),
      notes: notes.input.value.trim() || null,
    };
    let endError = null;
    if (values.start_time && !values.end_time) endError = MESSAGES.endRequired;
    else if (!values.start_time && values.end_time) endError = MESSAGES.endWithoutStart;
    else if (values.start_time && values.end_time <= values.start_time) endError = MESSAGES.endBeforeStart;

    const errors = [
      [title, !values.title ? MESSAGES.eventTitleRequired
        : values.title.length > LIMITS.title ? MESSAGES.tooLong(LIMITS.title) : null],
      [dateField, !values.date ? MESSAGES.dateRequired : null],
      [end, endError],
      [notes, values.notes && values.notes.length > LIMITS.notes ? MESSAGES.tooLong(LIMITS.notes) : null],
    ];
    let first = null;
    for (const [field, message] of errors) {
      field.setError(message);
      if (message && !first) first = field;
    }
    if (first) {
      first.input.focus();
      return null;
    }
    return values;
  }

  const modal = createModal({
    title: editing ? MESSAGES.editEventTitle : MESSAGES.newEventTitle,
    primaryLabel: editing ? MESSAGES.saveChanges : MESSAGES.save,
    opener,
    fallbackFocus,
    async onSubmit() {
      const values = validate();
      if (!values) return false;
      modal.setBusy(true);
      try {
        if (editing) {
          const { found } = await updateEvent(event.id, values);
          if (!found) {
            modal.setBusy(false);
            modal.close({ toFallback: true });
            onGone?.();
            return false;
          }
        } else {
          await createEvent(values);
        }
        modal.setBusy(false);
        onSaved?.(values.date);
        return true;
      } catch (err) {
        console.error('Event save failed:', err);
        modal.setBusy(false);
        modal.showError(MESSAGES.saveFailed);
        return false;
      }
    },
  });

  modal.body.append(title.wrap, dateField.wrap, fieldRow(start, end), picker.el, notes.wrap);

  if (editing) {
    addDeleteButton(modal, {
      confirmMessage: MESSAGES.confirmDeleteEvent,
      onDelete: () => deleteEvent(event.id),
      onDeleted,
    });
  }

  modal.open(title.input);
}

// ---------- Approve and assign a Google event (F29) ----------

// '2026-10-13' → '13.10.2026'
function formatFullDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Read-only field (DESIGN.md "שדה נעול"): Google data is never edited in Homie.
function lockedField(id, label, value) {
  const field = createField({ id, label });
  field.input.readOnly = true;
  field.input.value = value;
  field.input.classList.add('field__input--locked');
  return field;
}

// event: a pending Google event. onDone({ found }) runs after a save attempt that
// reached the database (found: false = the other parent already handled it).
export function openGoogleApproveModal({ event, opener, fallbackFocus, onDone }) {
  const badge = document.createElement('p');
  badge.className = 'readonly-tag';
  badge.append(icon('lock'));
  const badgeText = document.createElement('span');
  badgeText.textContent = MESSAGES.googleReadOnly;
  badge.append(badgeText);

  const title = lockedField('google-title', MESSAGES.eventTitleLabel, event.title);
  const dateField = lockedField('google-date', MESSAGES.dateLabel, formatFullDate(event.date));
  const start = lockedField('google-start', MESSAGES.startTimeLabel,
    event.start_time ? formatTime(event.start_time) : MESSAGES.allDay);
  const end = lockedField('google-end', MESSAGES.endTimeLabel,
    event.end_time ? formatTime(event.end_time) : MESSAGES.noValue);
  for (const f of [dateField, start, end]) f.input.classList.add('field__input--ltr');

  // Hint shown while nothing is picked, so the disabled button is explained in words.
  const hint = document.createElement('p');
  hint.className = 'field__hint';
  hint.id = 'google-members-hint';
  hint.textContent = MESSAGES.pickOneMember;

  const picker = renderMemberPicker({
    id: 'google-members',
    legend: MESSAGES.assignOneOrMore,
    onChange: (ids) => update(ids.length > 0),
  });
  picker.el.append(hint);

  const modal = createModal({
    title: MESSAGES.googleApproveTitle,
    primaryLabel: MESSAGES.approveAssign,
    opener,
    fallbackFocus,
    async onSubmit() {
      const ids = picker.getSelected();
      if (ids.length === 0) return false; // PRD 4.13: at least one member
      modal.setBusy(true);
      try {
        const result = await approveGoogleEvent(event.id, ids);
        modal.setBusy(false);
        onDone?.(result);
        return true;
      } catch (err) {
        console.error('Google event approve failed:', err);
        modal.setBusy(false);
        modal.showError(MESSAGES.saveFailed);
        return false;
      }
    },
  });

  function update(hasSelection) {
    modal.setPrimaryEnabled(hasSelection);
    hint.hidden = hasSelection;
    if (hasSelection) modal.primary.removeAttribute('aria-describedby');
    else modal.primary.setAttribute('aria-describedby', hint.id);
  }
  update(false);

  modal.body.append(badge, title.wrap, dateField.wrap, fieldRow(start, end), picker.el);
  // The four fields are locked, so focus starts on the first member chip.
  modal.open(picker.firstInput);
}
