import { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Activity, ActivityType } from '../../types';
import { todayStr } from '../../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  initialActivity?: Activity;
}

const TYPES: ActivityType[] = ['Call', 'Email', 'Meeting', 'Internal Note', 'QBR', 'Onboarding', 'Escalation', 'Check-in', 'Training', 'Other'];

export default function ActivityModal({ isOpen, onClose, accountId, initialActivity }: Props) {
  const { addActivity, updateActivity } = useApp();
  const isEdit = !!initialActivity;

  const [form, setForm] = useState({
    date: initialActivity?.date ?? todayStr(),
    type: initialActivity?.type ?? 'Call' as ActivityType,
    note: initialActivity?.note ?? '',
    createdBy: initialActivity?.createdBy ?? 'Me',
    pinned: initialActivity?.pinned ?? false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.note.trim()) return;
    const payload = {
      accountId,
      date: form.date,
      type: form.type,
      note: form.note.trim(),
      createdBy: form.createdBy || 'Me',
      pinned: form.pinned,
    };
    if (isEdit) {
      updateActivity(initialActivity!.id, payload);
    } else {
      addActivity(payload);
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Activity' : 'Log Activity'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ActivityType }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Notes *</label>
          <textarea
            required
            rows={5}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="What happened? Key outcomes, next steps…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Created by</label>
            <input type="text" value={form.createdBy} onChange={(e) => setForm((f) => ({ ...f, createdBy: e.target.value }))} placeholder="Your name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-slate-700">Pin to top</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            {isEdit ? 'Save changes' : 'Log activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
