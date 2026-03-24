import { useState } from 'react';
import { Plus, Pin, PinOff, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatDate } from '../../../utils/helpers';
import ActivityModal from '../../../components/modals/ActivityModal';
import EmptyState from '../../../components/common/EmptyState';
import type { Activity, ActivityType } from '../../../types';

interface Props {
  accountId: string;
}

const TYPE_COLORS: Record<ActivityType, string> = {
  Call: 'bg-blue-100 text-blue-700',
  Email: 'bg-purple-100 text-purple-700',
  Meeting: 'bg-indigo-100 text-indigo-700',
  'Internal Note': 'bg-slate-100 text-slate-600',
  QBR: 'bg-amber-100 text-amber-700',
  Onboarding: 'bg-teal-100 text-teal-700',
  Escalation: 'bg-red-100 text-red-700',
  'Check-in': 'bg-green-100 text-green-700',
  Training: 'bg-orange-100 text-orange-700',
  Other: 'bg-slate-100 text-slate-600',
};

const ALL_TYPES: ActivityType[] = ['Call', 'Email', 'Meeting', 'Internal Note', 'QBR', 'Onboarding', 'Escalation', 'Check-in', 'Training', 'Other'];

export default function ActivityLog({ accountId }: Props) {
  const { activities, updateActivity, deleteActivity } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [filterType, setFilterType] = useState<ActivityType | ''>('');

  const accountActivities = activities
    .filter((a) => a.accountId === accountId)
    .filter((a) => !filterType || a.type === filterType)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ActivityType | '')}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {ALL_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <span className="text-sm text-slate-500">{accountActivities.length} entries</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} /> Log Activity
        </button>
      </div>

      {accountActivities.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No activities logged"
          description="Start logging calls, emails, meetings, and notes here."
          action={
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
              <Plus size={14} /> Log first activity
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {accountActivities.map((act) => (
            <div
              key={act.id}
              className={`bg-white border rounded-xl p-4 transition-shadow hover:shadow-sm ${act.pinned ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[act.type]}`}>{act.type}</span>
                  <span className="text-xs text-slate-500">{formatDate(act.date)}</span>
                  {act.pinned && <span className="text-xs text-indigo-600 font-medium flex items-center gap-1"><Pin size={10} /> Pinned</span>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => updateActivity(act.id, { pinned: !act.pinned })}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-slate-100 transition-colors"
                    title={act.pinned ? 'Unpin' : 'Pin'}
                  >
                    {act.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button onClick={() => setEditActivity(act)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteActivity(act.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{act.note}</p>
              {act.createdBy && <p className="mt-2 text-xs text-slate-400">— {act.createdBy}</p>}
            </div>
          ))}
        </div>
      )}

      {showAddModal && <ActivityModal isOpen onClose={() => setShowAddModal(false)} accountId={accountId} />}
      {editActivity && <ActivityModal isOpen onClose={() => setEditActivity(null)} accountId={accountId} initialActivity={editActivity} />}
    </div>
  );
}
