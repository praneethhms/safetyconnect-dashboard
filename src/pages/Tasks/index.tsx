import { useState, useMemo } from 'react';
import { Plus, CheckSquare, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, isOverdue } from '../../utils/helpers';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import TaskModal from '../../components/modals/TaskModal';
import EmptyState from '../../components/common/EmptyState';
import type { Task, TaskStatus, Priority, TaskCategory } from '../../types';

type GroupBy = 'account' | 'dueDate' | 'priority' | 'status';

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const PRIORITIES: Priority[] = ['High', 'Med', 'Low'];
const CATEGORIES: TaskCategory[] = ['Onboarding', 'Renewal', 'Escalation', 'Expansion', 'Health', 'Admin', 'Follow-up', 'Other'];

function TaskRow({ task, accountName, selected, onSelect, onEdit, onDelete }: {
  task: Task;
  accountName?: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <tr className={overdue && task.status !== 'Done' ? 'bg-red-50' : 'hover:bg-slate-50'}>
      <td className="px-4 py-3 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(task.id)}
          className="w-4 h-4 accent-indigo-600"
        />
      </td>
      <td className="px-4 py-3">
        <p className={`text-sm font-medium ${overdue && task.status !== 'Done' ? 'text-red-700' : 'text-slate-800'}`}>{task.title}</p>
        {accountName && <p className="text-xs text-slate-500">{accountName}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${overdue && task.status !== 'Done' ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>{formatDate(task.dueDate)}</span>
      </td>
      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
      <td className="px-4 py-3 text-xs text-slate-500">{task.category}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"><Pencil size={13} /></button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function Tasks() {
  const { tasks, accounts, deleteTask, bulkUpdateTasks, overdueTasks } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>('Done');
  const [groupBy, setGroupBy] = useState<GroupBy>('account');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | ''>('');

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterAccount && t.accountId !== filterAccount) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, filterAccount, filterPriority, filterStatus, filterCategory]);

  const nonOverdueFiltered = filtered.filter((t) => !isOverdue(t.dueDate, t.status));

  function accountName(id?: string) {
    return id ? accounts.find((a) => a.id === id)?.name : undefined;
  }

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleAll(taskList: Task[]) {
    const ids = taskList.map((t) => t.id);
    const allSelected = ids.every((id) => selected.includes(id));
    setSelected((prev) => allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
  }

  function applyBulkStatus() {
    if (selected.length === 0) return;
    bulkUpdateTasks(selected, { status: bulkStatus });
    setSelected([]);
  }

  function groupTasks(taskList: Task[]): Array<{ label: string; tasks: Task[] }> {
    if (groupBy === 'account') {
      const accountGroups = new Map<string, Task[]>();
      taskList.forEach((t) => {
        const key = t.accountId ?? '__standalone__';
        if (!accountGroups.has(key)) accountGroups.set(key, []);
        accountGroups.get(key)!.push(t);
      });
      return Array.from(accountGroups.entries()).map(([key, tasks]) => ({
        label: key === '__standalone__' ? 'Standalone Tasks' : (accountName(key) ?? key),
        tasks,
      }));
    }
    if (groupBy === 'priority') {
      return PRIORITIES.map((p) => ({ label: p + ' Priority', tasks: taskList.filter((t) => t.priority === p) })).filter((g) => g.tasks.length > 0);
    }
    if (groupBy === 'status') {
      return STATUSES.map((s) => ({ label: s, tasks: taskList.filter((t) => t.status === s) })).filter((g) => g.tasks.length > 0);
    }
    if (groupBy === 'dueDate') {
      const today = new Date().toISOString().slice(0, 10);
      const groups: Record<string, Task[]> = {};
      taskList.forEach((t) => {
        const key = t.dueDate <= today ? 'Today & Earlier' : t.dueDate;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([date, tasks]) => ({
        label: date === 'Today & Earlier' ? date : formatDate(date),
        tasks,
      }));
    }
    return [{ label: 'All Tasks', tasks: taskList }];
  }

  const groups = groupTasks(nonOverdueFiltered);

  function TableHead({ tasks }: { tasks: Task[] }) {
    const ids = tasks.map((t) => t.id);
    const allSel = ids.length > 0 && ids.every((id) => selected.includes(id));
    return (
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-4 py-3 w-8"><input type="checkbox" checked={allSel} onChange={() => toggleAll(tasks)} className="w-4 h-4 accent-indigo-600" /></th>
          {['Task', 'Due Date', 'Priority', 'Status', 'Category', ''].map((h) => (
            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tasks.length} total · {overdueTasks.length} overdue</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Filters + group */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Priority</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as TaskCategory | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Group by:</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="account">Account</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">{selected.length} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as TaskStatus)} className="px-3 py-1.5 text-sm border border-indigo-300 rounded-lg bg-white focus:outline-none">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={applyBulkStatus} className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Apply</button>
          <button onClick={() => setSelected([])} className="text-sm text-indigo-600 hover:text-indigo-800">Clear</button>
        </div>
      )}

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200">
            <h2 className="text-sm font-semibold text-red-700">⚠️ Overdue ({overdueTasks.length})</h2>
          </div>
          <table className="w-full text-sm">
            <TableHead tasks={overdueTasks} />
            <tbody className="divide-y divide-red-100">
              {overdueTasks.map((t) => (
                <TaskRow key={t.id} task={t} accountName={accountName(t.accountId)} selected={selected.includes(t.id)} onSelect={toggleSelect} onEdit={setEditTask} onDelete={deleteTask} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grouped tasks */}
      {nonOverdueFiltered.length === 0 ? (
        overdueTasks.length === 0 && (
          <EmptyState icon={CheckSquare} title="No tasks" description="Add tasks to track your work across accounts." action={
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
              <Plus size={14} /> Add task
            </button>
          } />
        )
      ) : (
        <div className="space-y-4">
          {groups.filter((g) => g.tasks.length > 0).map((group) => (
            <div key={group.label} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">{group.label} <span className="text-slate-400 font-normal">({group.tasks.length})</span></h3>
              </div>
              <table className="w-full text-sm">
                <TableHead tasks={group.tasks} />
                <tbody className="divide-y divide-slate-100">
                  {group.tasks.map((t) => (
                    <TaskRow key={t.id} task={t} accountName={groupBy !== 'account' ? accountName(t.accountId) : undefined} selected={selected.includes(t.id)} onSelect={toggleSelect} onEdit={setEditTask} onDelete={deleteTask} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <TaskModal isOpen onClose={() => setShowAddModal(false)} />}
      {editTask && <TaskModal isOpen onClose={() => setEditTask(null)} initialTask={editTask} />}
    </div>
  );
}
