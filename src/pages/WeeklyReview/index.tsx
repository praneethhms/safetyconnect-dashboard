import { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getWeekKey, isThisWeek, formatDate, generateId } from '../../utils/helpers';
import { HealthBadge } from '../../components/common/Badge';
import type { ChecklistItem } from '../../types';

export default function WeeklyReview() {
  const { activities, tasks, accounts, weeklyNotes, saveWeeklyNote } = useApp();
  const weekKey = getWeekKey();

  const currentNote = weeklyNotes.find((n) => n.weekKey === weekKey);
  const [notes, setNotes] = useState(currentNote?.notes ?? '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    currentNote?.standupChecklist ?? [
      { id: generateId(), text: 'Review overdue tasks', completed: false },
      { id: generateId(), text: 'Check upcoming renewals', completed: false },
      { id: generateId(), text: 'Log yesterday\'s activities', completed: false },
      { id: generateId(), text: 'Follow up on escalations', completed: false },
      { id: generateId(), text: 'Update account health scores', completed: false },
    ]
  );
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // This week's data
  const thisWeekActivities = useMemo(
    () => activities.filter((a) => isThisWeek(a.date)),
    [activities]
  );

  const tasksCompletedThisWeek = useMemo(
    () => tasks.filter((t) => t.status === 'Done' && isThisWeek(t.updatedAt)),
    [tasks]
  );

  const tasksCreatedThisWeek = useMemo(
    () => tasks.filter((t) => isThisWeek(t.createdAt)),
    [tasks]
  );

  const accountsTouchedIds = useMemo(() => {
    return [...new Set(thisWeekActivities.map((a) => a.accountId))];
  }, [thisWeekActivities]);

  const accountsTouched = useMemo(
    () => accounts.filter((a) => accountsTouchedIds.includes(a.id)),
    [accounts, accountsTouchedIds]
  );

  function saveNotes() {
    saveWeeklyNote(weekKey, { notes, standupChecklist: checklist });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  function toggleChecklist(id: string) {
    const next = checklist.map((c) => c.id === id ? { ...c, completed: !c.completed } : c);
    setChecklist(next);
    saveWeeklyNote(weekKey, { notes, standupChecklist: next });
  }

  function addChecklistItem() {
    if (!newChecklistItem.trim()) return;
    const next = [...checklist, { id: generateId(), text: newChecklistItem.trim(), completed: false }];
    setChecklist(next);
    setNewChecklistItem('');
    saveWeeklyNote(weekKey, { notes, standupChecklist: next });
  }

  function removeChecklistItem(id: string) {
    const next = checklist.filter((c) => c.id !== id);
    setChecklist(next);
    saveWeeklyNote(weekKey, { notes, standupChecklist: next });
  }

  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Weekly Review</h1>
        <p className="text-sm text-slate-500 mt-0.5">Week {weekKey}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Activities Logged', value: thisWeekActivities.length, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Tasks Completed', value: tasksCompletedThisWeek.length, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
          { label: 'Tasks Created', value: tasksCreatedThisWeek.length, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Accounts Touched', value: accountsTouched.length, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: activities + accounts */}
        <div className="col-span-2 space-y-5">
          {/* This week's activities */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">Activities This Week</h2>
            </div>
            {thisWeekActivities.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No activities logged this week yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {thisWeekActivities
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((act) => {
                    const account = accounts.find((a) => a.id === act.accountId);
                    return (
                      <div key={act.id} className="px-5 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-indigo-600">{act.type}</span>
                            <span className="text-xs text-slate-500">{account?.name}</span>
                          </div>
                          <p className="text-sm text-slate-700 truncate">{act.note}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(act.date)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Accounts touched */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">Accounts Touched This Week ({accountsTouched.length})</h2>
            </div>
            {accountsTouched.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No account activity this week.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {accountsTouched.map((a) => {
                  const actCount = thisWeekActivities.filter((act) => act.accountId === a.id).length;
                  return (
                    <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.name}</p>
                        <p className="text-xs text-slate-500">{actCount} {actCount === 1 ? 'activity' : 'activities'}</p>
                      </div>
                      <HealthBadge health={a.health} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly journal */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Weekly Notes</h2>
              <div className="flex items-center gap-2">
                {notesSaved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
                <button onClick={saveNotes} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Save</button>
              </div>
            </div>
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weekly reflections, wins, blockers, focus for next week…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Right: standup checklist */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 sticky top-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Standup Prep</h2>
              <span className="text-xs text-slate-500">{completedCount}/{checklist.length}</span>
            </div>

            {checklist.length > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%` }}
                />
              </div>
            )}

            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleChecklist(item.id)}
                    className={`flex-shrink-0 transition-colors ${item.completed ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'}`}
                  >
                    {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="Add item…"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={addChecklistItem} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
