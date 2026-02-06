'use client';

import { useState } from 'react';
import {
  toggleReminderSchedule,
  updateReminderSchedule,
  deleteReminderSchedule,
  createReminderSchedule,
  type ReminderScheduleRow,
} from '@/lib/actions/admin/reminders';
import { minutesToValueAndUnit, valueToMinutes } from '@/lib/utils/reminder-schedule';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

const UNITS = [
  { value: 'day', label: 'Day(s)' },
  { value: 'hour', label: 'Hour(s)' },
  { value: 'min', label: 'Minute(s)' },
] as const;

export function ReminderSchedulesList({ initialSchedules }: { initialSchedules: ReminderScheduleRow[] }) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('1');
  const [newUnit, setNewUnit] = useState<string>('hour');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState<string>('min');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  function showError(msg: string) {
    setToast({ isOpen: true, message: msg, type: 'error' });
  }
  function showSuccess(msg: string) {
    setToast({ isOpen: true, message: msg, type: 'success' });
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await toggleReminderSchedule(id, !isActive);
    if (res?.error) {
      showError(res.error);
      return;
    }
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)));
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(null);
    const res = await deleteReminderSchedule(id);
    if (res?.error) {
      showError(res.error);
      return;
    }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Schedule removed.');
  }

  function startEdit(s: ReminderScheduleRow) {
    setEditingId(s.id);
    setEditLabel(s.label);
    const { value, unit } = minutesToValueAndUnit(s.minutes_before);
    setEditValue(String(value));
    setEditUnit(unit);
  }

  async function saveEdit() {
    if (!editingId) return;
    const value = Number(editValue);
    const minutesBefore = valueToMinutes(value, editUnit);
    if (value <= 0 || minutesBefore <= 0) {
      showError('Enter a positive value.');
      return;
    }
    const res = await updateReminderSchedule(editingId, {
      label: editLabel.trim(),
      minutes_before: minutesBefore,
    });
    if (res?.error) {
      showError(res.error);
      return;
    }
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === editingId ? { ...s, label: editLabel.trim(), minutes_before: minutesBefore } : s
      )
    );
    setEditingId(null);
    showSuccess('Schedule updated.');
  }

  async function handleAdd() {
    const label = newLabel.trim();
    const value = Number(newValue);
    if (!label || value <= 0) {
      showError('Enter a label and a positive value.');
      return;
    }
    const minutesBefore = valueToMinutes(value, newUnit);
    if (minutesBefore <= 0) {
      showError('Invalid value for the selected unit.');
      return;
    }
    const formData = new FormData();
    formData.set('label', label);
    formData.set('value', String(value));
    formData.set('unit', newUnit);
    const res = await createReminderSchedule(null, formData);
    if (res?.error) {
      showError(res.error);
      return;
    }
    const created = res?.created;
    if (created) {
      setSchedules((prev) => [...prev, created]);
    }
    setNewLabel('');
    setNewValue('1');
    setNewUnit('hour');
    setAdding(false);
    showSuccess('Schedule added.');
  }

  const formatMinutes = (m: number) => {
    if (m >= 1440) return `${m / 1440} day(s) before`;
    if (m >= 60) return `${m / 60} hour(s) before`;
    if (m < 1) return `${Math.round(m * 60)} sec before`;
    return `${m} min before`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-lg font-semibold text-[#1E3A5F]">Schedules</h3>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#E55A2B]"
          >
            + Add schedule
          </button>
        ) : null}
      </div>

      {adding && (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-[#1E3A5F]/10">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Label</span>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. 1 hour before"
              className="border rounded-lg px-3 py-2 w-48"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Value</span>
            <input
              type="number"
              min={0.5}
              step={newUnit === 'day' || newUnit === 'hour' ? 0.5 : 1}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="border rounded-lg px-3 py-2 w-28"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Unit</span>
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="border rounded-lg px-3 py-2 w-32"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewLabel(''); setNewValue('1'); setNewUnit('hour'); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {schedules.map((s) => (
          <li key={s.id} className="py-3 flex flex-wrap items-center gap-3">
            {editingId === s.id ? (
              <>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                  placeholder="Label"
                />
                <input
                  type="number"
                  min={0.5}
                  step={editUnit === 'day' || editUnit === 'hour' ? 0.5 : 1}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border rounded px-2 py-1 w-20"
                />
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-sm"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                <button type="button" onClick={saveEdit} className="text-sm text-[#1E3A5F] font-medium">
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="font-medium text-gray-900">{s.label}</span>
                <span className="text-sm text-gray-500">({formatMinutes(s.minutes_before)})</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.is_active}
                    onChange={() => handleToggle(s.id, s.is_active)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <button
                  type="button"
                  onClick={() => startEdit(s)}
                  className="text-sm text-[#FF6B35] hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {schedules.length === 0 && !adding && (
        <p className="text-gray-500 text-sm">No reminder schedules. Add one above.</p>
      )}

      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Remove reminder schedule"
        message="Remove this reminder schedule? You can add it again later."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, isOpen: false }))}
      />
    </div>
  );
}
