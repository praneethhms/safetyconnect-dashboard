import { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Task, Priority, TaskStatus, TaskCategory } from '../../types';
import { todayStr } from '../../utils/helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  initialTask?: Task;
}

const PRIORITIES: Priority[] = ['High', 'Med', 'Low'];
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const CATEGORIES: TaskCategory[] = ['Onboarding', 'Renewal', 'Escalation', 'Expansion', 'Health', 'Admin', 'Follow-up', 'Other'];

export default function TaskModal({ isOpen, onClose, accountId, initialTask }: Props) {
  const { addTask, updateTask, accounts } = useApp();
  const isEdit = !!initialTask;

  const [form, setForm] = useState({
    title: initialTask?.title ?? '',
    dueDate: initialTask?.dueDate ?? todayStr(),
    priority: initialTask?.priority ?? 'Med' as Priority,
    status: initialTask?.status ?? 'To Do' as TaskStatus,
    category: initialTask?.category ?? 'Other' as TaskCategory,
    accountId: initialTask?.accountId ?? accountId ?? '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) return;
    const payload = {
      title: form.title.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      status: form.status,
      category: form.category,
      accountId: form.accountId || undefined,
    };
    if (isEdit) {
      updateTask(initialTask!.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Task' : 'Add Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Task title…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Account (optional)</label>
          <select value={form.accountId} onChange={(e) => set('accountId', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Standalone task —</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            {isEdit ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
