// Task create / edit modal (F12, F14, F15) with delete (F44).
// Hidden until later milestones (DESIGN.md "מה מוצג בכל שלב"): reminder (F17)
// and recurrence (F16) fields, Milestone 8.

import { renderMemberPicker } from './members.js';
import { createTask, updateTask, deleteTask } from './data/tasks.js';
import { formatTime } from './time.js';
import {
  MESSAGES, STATUS_LABELS, LIMITS, icon, createModal, confirmDialog, createField, fieldRow,
} from './ui.js';

// task: existing task row (edit) or null (create). date: prefilled date for a new task.
// Callbacks: onSaved(date) after save, onDeleted() after delete,
// onGone() when the task was already deleted by the other parent.
export function openTaskModal({ task = null, date, opener, fallbackFocus, onSaved, onDeleted, onGone }) {
  const editing = Boolean(task);

  const title = createField({ id: 'task-title', label: MESSAGES.taskTitleLabel, maxLength: LIMITS.title });
  const dateField = createField({ id: 'task-date', label: MESSAGES.dateLabel, type: 'date' });
  const time = createField({ id: 'task-time', label: MESSAGES.timeLabel, type: 'time' });
  const picker = renderMemberPicker({
    id: 'task-assignees',
    legend: MESSAGES.assigneesLabel,
    selectedIds: task?.assigned_member_ids ?? [],
  });
  const status = createField({
    id: 'task-status',
    label: MESSAGES.statusLabel,
    type: 'select',
    options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  });
  const notes = createField({
    id: 'task-notes',
    label: MESSAGES.notesLabel,
    type: 'textarea',
    maxLength: LIMITS.notes,
    placeholder: MESSAGES.notesPlaceholder,
  });

  title.input.value = task?.title ?? '';
  dateField.input.value = task?.date ?? date;
  time.input.value = formatTime(task?.time ?? '');
  status.input.value = task?.status ?? 'todo';
  notes.input.value = task?.notes ?? '';

  // Returns the values to save, or null after showing the errors (PRD 4.13).
  function validate() {
    const values = {
      title: title.input.value.trim(),
      date: dateField.input.value,
      time: time.input.value || null,
      status: status.input.value,
      assigned_member_ids: picker.getSelected(),
      notes: notes.input.value.trim() || null,
    };
    const errors = [
      [title, !values.title ? MESSAGES.taskTitleRequired
        : values.title.length > LIMITS.title ? MESSAGES.tooLong(LIMITS.title) : null],
      [dateField, !values.date ? MESSAGES.dateRequired : null],
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
    title: editing ? MESSAGES.editTaskTitle : MESSAGES.newTaskTitle,
    primaryLabel: editing ? MESSAGES.saveChanges : MESSAGES.save,
    opener,
    fallbackFocus,
    async onSubmit() {
      const values = validate();
      if (!values) return false;
      modal.setBusy(true);
      try {
        if (editing) {
          const { found } = await updateTask(task.id, values);
          if (!found) {
            modal.setBusy(false);
            modal.close({ toFallback: true });
            onGone?.();
            return false;
          }
        } else {
          await createTask(values);
        }
        modal.setBusy(false);
        onSaved?.(values.date);
        return true;
      } catch (err) {
        console.error('Task save failed:', err);
        modal.setBusy(false);
        modal.showError(MESSAGES.saveFailed);
        return false;
      }
    },
  });

  modal.body.append(title.wrap, fieldRow(dateField, time), picker.el, status.wrap, notes.wrap);

  if (editing) {
    // Text button on the far side of the footer, away from "save" (DESIGN.md, F44).
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn--danger-text modal__delete';
    del.dataset.modalExtra = '';
    del.append(icon('trash'));
    const label = document.createElement('span');
    label.textContent = MESSAGES.delete;
    del.append(label);
    modal.footer.append(del);

    del.addEventListener('click', async () => {
      const ok = await confirmDialog({
        message: MESSAGES.confirmDeleteTask,
        confirmLabel: MESSAGES.delete,
        returnFocus: del,
      });
      if (!ok) return;
      modal.setBusy(true, MESSAGES.saveChanges); // keeps the primary label unchanged
      try {
        await deleteTask(task.id); // already gone = same result: it is off the board
        modal.setBusy(false);
        modal.close({ toFallback: true });
        onDeleted?.();
      } catch (err) {
        console.error('Task delete failed:', err);
        modal.setBusy(false);
        modal.showError(MESSAGES.deleteFailed);
        del.focus();
      }
    });
  }

  modal.open(title.input);
}
