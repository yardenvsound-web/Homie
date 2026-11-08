// Internal event modal (F18, F20): create only in Milestone 4.
// Editing and deleting internal events (F19, F45) come in Milestone 7; the
// Google approve-and-assign modal (F29) comes in Milestone 6.

import { renderMemberPicker } from './members.js';
import { createEvent } from './data/events.js';
import { MESSAGES, LIMITS, createModal, createField, fieldRow } from './ui.js';

// date: prefilled date. onSaved(date) runs after a successful save.
export function openEventModal({ date, opener, fallbackFocus, onSaved }) {
  const title = createField({ id: 'event-title', label: MESSAGES.eventTitleLabel, maxLength: LIMITS.title });
  const dateField = createField({ id: 'event-date', label: MESSAGES.dateLabel, type: 'date' });
  const start = createField({ id: 'event-start', label: MESSAGES.startTimeLabel, type: 'time' });
  const end = createField({ id: 'event-end', label: MESSAGES.endTimeLabel, type: 'time' });
  const picker = renderMemberPicker({ id: 'event-members', legend: MESSAGES.participantsLabel });
  const notes = createField({
    id: 'event-notes',
    label: MESSAGES.notesLabel,
    type: 'textarea',
    maxLength: LIMITS.notes,
    placeholder: MESSAGES.notesPlaceholder,
  });
  dateField.input.value = date;

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
    title: MESSAGES.newEventTitle,
    primaryLabel: MESSAGES.save,
    opener,
    fallbackFocus,
    async onSubmit() {
      const values = validate();
      if (!values) return false;
      modal.setBusy(true);
      try {
        await createEvent(values);
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
  modal.open(title.input);
}
