import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckSquare,
  AlertTriangle,
  Clock,
  Plus,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, daysFromNow, daysAgo } from '../../utils/helpers';
import { HealthBadge, PriorityBadge, UrgencyBadge, SolutionTag } from '../../components/common/Badge';
import TaskModal from '../../components/modals/TaskModal';
import type { Task } from '../../types';

function StatCard({ icon: Icon, label, value, color = 'slate' }: { icon: React.ElementType; label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-white border-slate-200 text-slate-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };
  const iconColors: Record<string, string> = {
    slate: 'text-slate-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    indigo: 'text-indigo-400',
  };
  return (
    <div className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${colors[color]}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-current/10`}>
        <Icon size={20} className={iconColors[color]} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function TaskRow({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const { accounts } = useApp();
  const account = accounts.find((a) => a.id === task.accountId);
  return (
    <div
      onClick={() => onEdit(task)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 font-medium truncate">{task.title}</p>
        {account && <p className="text-xs text-slate-500 truncate">{account.name}</p>}
      </div>
      <PriorityBadge priority={task.priority} />
      <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>
    </div>
  );
}

export default function Home() {
  const {
    accounts,
    tasksDueToday,
    overdueTasks,
    accountsNeedingAttention,
    upcomingRenewals,
    activities,
  } = useApp();

  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const navigate = useNavigate();

  const accountLinkedDueToday = tasksDueToday.filter((t) => t.accountId);
  const standaloneDueToday = tasksDueToday.filter((t) => !t.accountId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Accounts" value={accounts.length} color="slate" />
        <StatCard icon={CheckSquare} label="Due Today" value={tasksDueToday.length} color="indigo" />
        <StatCard icon={AlertCircle} label="Overdue Tasks" value={overdueTasks.length} color="red" />
        <StatCard icon={Clock} label="Need Attention" value={accountsNeedingAttention.length} color="amber" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's Focus */}
        <div className="col-span-2 space-y-4">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-500" />
                  <h2 className="text-sm font-semibold text-red-700">Overdue ({overdueTasks.length})</h2>
                </div>
              </div>
              <div className="divide-y divide-red-100">
                {overdueTasks.slice(0, 5).map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={setEditTask} />
                ))}
                {overdueTasks.length > 5 && (
                  <button onClick={() => navigate('/tasks')} className="w-full px-4 py-2 text-xs text-red-600 font-medium hover:bg-red-100 text-left transition-colors">
                    +{overdueTasks.length - 5} more overdue tasks →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Today's tasks */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-800">Today's Focus</h2>
                {tasksDueToday.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">{tasksDueToday.length}</span>
                )}
              </div>
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus size={13} /> Quick Add
              </button>
            </div>

            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                  <CheckSquare size={20} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">All clear for today!</p>
                <p className="text-xs text-slate-500 mt-1">No tasks due today.</p>
                <button onClick={() => setShowAddTask(true)} className="mt-4 flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors">
                  <Plus size={13} /> Add a task
                </button>
              </div>
            ) : (
              <div>
                {accountLinkedDueToday.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Tasks</p>
                    <div className="divide-y divide-slate-100">
                      {accountLinkedDueToday.map((t) => <TaskRow key={t.id} task={t} onEdit={setEditTask} />)}
                    </div>
                  </>
                )}
                {standaloneDueToday.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Standalone Tasks</p>
                    <div className="divide-y divide-slate-100">
                      {standaloneDueToday.map((t) => <TaskRow key={t.id} task={t} onEdit={setEditTask} />)}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Renewals */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">Upcoming Renewals</h2>
            </div>
            {upcomingRenewals.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-500 text-center">No renewals in the next 90 days</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingRenewals.slice(0, 6).map((a) => (
                  <button key={a.id} onClick={() => navigate(`/accounts/${a.id}`)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{a.name}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.renewalDate!)}</p>
                    </div>
                    <UrgencyBadge days={daysFromNow(a.renewalDate!)} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Accounts Needing Attention */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">Needs Attention</h2>
              <p className="text-xs text-slate-500 mt-0.5">No activity in 7+ days</p>
            </div>
            {accountsNeedingAttention.length === 0 ? (
              <p className="px-4 py-6 text-xs text-green-600 text-center font-medium">All accounts have recent activity</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {accountsNeedingAttention.slice(0, 6).map((a) => {
                  const lastAct = activities.filter((ac) => ac.accountId === a.id).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
                  return (
                    <button key={a.id} onClick={() => navigate(`/accounts/${a.id}`)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.segment}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <HealthBadge health={a.health} />
                        <p className="text-xs text-slate-400 mt-0.5">
                          {lastAct ? `${daysAgo(lastAct.date)}d ago` : 'No activity'}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {accountsNeedingAttention.length > 6 && (
                  <button onClick={() => navigate('/accounts')} className="w-full px-4 py-2 text-xs text-indigo-600 font-medium hover:bg-slate-50 text-left transition-colors">
                    +{accountsNeedingAttention.length - 6} more →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddTask && <TaskModal isOpen onClose={() => setShowAddTask(false)} />}
      {editTask && <TaskModal isOpen onClose={() => setEditTask(null)} initialTask={editTask} />}
    </div>
  );
}
