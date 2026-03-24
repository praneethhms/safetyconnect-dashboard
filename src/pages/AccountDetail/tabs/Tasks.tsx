import { useState } from 'react';
import { Plus, Pencil, Trash2, CheckSquare } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatDate, isOverdue } from '../../../utils/helpers';
import { PriorityBadge, StatusBadge } from '../../../components/common/Badge';
import TaskModal from '../../../components/modals/TaskModal';
import EmptyState from '../../../components/common/EmptyState';
import type { Task, TaskStatus, Priority } from '../../../types';

interface Props {
  accountId: string;
}

export default function AccountTasks({ accountId }: Props) {
  const { tasks, updateTask, deleteTask } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');

  const accountTasks = tasks
    .filter((t) => t.accountId === accountId)
    .filter((t) => !filterStatus || t.status === filterStatus)
    .filter((t) => !filterPriority || t.priority === filterPriority)
    .sort((a, b) => {
      const aOver = isOverdue(a.dueDate, a.status) ? -1 : 0;
      const bOver = isOverdue(b.dueDate, b.status) ? -1 : 0;
      if (aOver !== bOver) return aOver - bOver;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            {['To Do', 'In Progress', 'Done'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priority</option>
            {['High', 'Med', 'Low'].map((p) => <option key={p}>{p}</option>)}
          </select>
          <span className="text-sm text-slate-500">{accountTasks.length} tasks</span>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Add Task
        </button>
      </div>

      {accountTasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks" description="Add tasks specific to this account." action={
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
            <Plus size={14} /> Add task
          </button>
        } />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Task', 'Due Date', 'Priority', 'Status', 'Category', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountTasks.map((t) => {
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <tr key={t.id} className={overdue ? 'bg-red-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${overdue ? 'text-red-700' : 'text-slate-800'}`}>{t.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>{formatDate(t.dueDate)}</span>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{t.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditTask(t)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"><Pencil size={13} /></button>
                        <button onClick={() => deleteTask(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <TaskModal isOpen onClose={() => setShowAddModal(false)} accountId={accountId} />}
      {editTask && <TaskModal isOpen onClose={() => setEditTask(null)} initialTask={editTask} />}
    </div>
  );
}
