import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Meeting, MeetingType, ActionItem, TaskStatus } from '../../types';
import { todayStr, generateId } from '../../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  initialMeeting?: Meeting;
}

const MEETING_TYPES: MeetingType[] = ['QBR', 'Check-in', 'Kick-off', 'Escalation call', 'Executive review', 'Training', 'Demo'];
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

export default function MeetingModal({ isOpen, onClose, accountId, initialMeeting }: Props) {
  const { addMeeting, updateMeeting } = useApp();
  const isEdit = !!initialMeeting;

  const [form, setForm] = useState({
    date: initialMeeting?.date ?? todayStr(),
    meetingType: initialMeeting?.meetingType ?? 'Check-in' as MeetingType,
    attendees: initialMeeting?.attendees ?? '',
    summary: initialMeeting?.summary ?? '',
    nextScheduledMeeting: initialMeeting?.nextScheduledMeeting ?? '',
    actionItems: initialMeeting?.actionItems ?? [] as ActionItem[],
  });

  function addActionItem() {
    setForm((f) => ({
      ...f,
      actionItems: [...f.actionItems, { id: generateId(), description: '', owner: '', dueDate: todayStr(), status: 'To Do' }],
    }));
  }

  function updateActionItem(id: string, field: keyof ActionItem, value: string) {
    setForm((f) => ({
      ...f,
      actionItems: f.actionItems.map((ai) => ai.id === id ? { ...ai, [field]: value } : ai),
    }));
  }

  function removeActionItem(id: string) {
    setForm((f) => ({ ...f, actionItems: f.actionItems.filter((ai) => ai.id !== id) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      accountId,
      date: form.date,
      meetingType: form.meetingType,
      attendees: form.attendees,
      summary: form.summary,
      nextScheduledMeeting: form.nextScheduledMeeting || undefined,
      actionItems: form.actionItems,
    };
    if (isEdit) {
      updateMeeting(initialMeeting!.id, payload);
    } else {
      addMeeting(payload);
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Meeting' : 'Log Meeting'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Meeting Type</label>
            <select value={form.meetingType} onChange={(e) => setForm((f) => ({ ...f, meetingType: e.target.value as MeetingType }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {MEETING_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Attendees</label>
          <input type="text" value={form.attendees} onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))} placeholder="Names, roles…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Summary</label>
          <textarea rows={3} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="Meeting summary and key decisions…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Next Scheduled Meeting</label>
          <input type="date" value={form.nextScheduledMeeting} onChange={(e) => setForm((f) => ({ ...f, nextScheduledMeeting: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-700">Action Items</label>
            <button type="button" onClick={addActionItem} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              <Plus size={12} /> Add item
            </button>
          </div>
          <div className="space-y-2">
            {form.actionItems.map((ai) => (
              <div key={ai.id} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg">
                <input type="text" value={ai.description} onChange={(e) => updateActionItem(ai.id, 'description', e.target.value)} placeholder="Action item…" className="col-span-5 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="text" value={ai.owner} onChange={(e) => updateActionItem(ai.id, 'owner', e.target.value)} placeholder="Owner" className="col-span-2 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="date" value={ai.dueDate} onChange={(e) => updateActionItem(ai.id, 'dueDate', e.target.value)} className="col-span-2 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <select value={ai.status} onChange={(e) => updateActionItem(ai.id, 'status', e.target.value)} className="col-span-2 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button type="button" onClick={() => removeActionItem(ai.id)} className="col-span-1 flex items-center justify-center text-slate-400 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            {isEdit ? 'Save changes' : 'Log meeting'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
