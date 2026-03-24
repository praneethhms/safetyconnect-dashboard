import { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatDate } from '../../../utils/helpers';
import MeetingModal from '../../../components/modals/MeetingModal';
import EmptyState from '../../../components/common/EmptyState';
import type { Meeting } from '../../../types';

interface Props {
  accountId: string;
}

const STATUS_COLORS: Record<string, string> = {
  'To Do': 'text-slate-500',
  'In Progress': 'text-blue-600',
  Done: 'text-green-600',
};

export default function Meetings({ accountId }: Props) {
  const { meetings, deleteMeeting } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);

  const accountMeetings = meetings
    .filter((m) => m.accountId === accountId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const nextMeeting = accountMeetings.find((m) => m.nextScheduledMeeting);

  return (
    <div className="space-y-4">
      {/* Next scheduled meeting banner */}
      {nextMeeting?.nextScheduledMeeting && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CalendarDays size={16} className="text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-700">Next Scheduled Meeting</p>
            <p className="text-sm text-indigo-800">{formatDate(nextMeeting.nextScheduledMeeting)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{accountMeetings.length} meetings logged</span>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} /> Log Meeting
        </button>
      </div>

      {accountMeetings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No meetings logged" description="Log QBRs, check-ins, kick-offs, and escalation calls here." action={
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
            <Plus size={14} /> Log meeting
          </button>
        } />
      ) : (
        <div className="space-y-4">
          {accountMeetings.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">{m.meetingType}</span>
                    <span className="text-sm font-semibold text-slate-800">{formatDate(m.date)}</span>
                  </div>
                  {m.attendees && <p className="text-xs text-slate-500 mt-1">👤 {m.attendees}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditMeeting(m)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><Pencil size={14} /></button>
                  <button onClick={() => deleteMeeting(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {m.summary && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{m.summary}</p>
                  </div>
                )}

                {m.actionItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Action Items</p>
                    <div className="space-y-2">
                      {m.actionItems.map((ai) => (
                        <div key={ai.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800">{ai.description}</p>
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">{ai.owner}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(ai.dueDate)}</span>
                          <span className={`text-xs font-medium flex-shrink-0 ${STATUS_COLORS[ai.status]}`}>{ai.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {m.nextScheduledMeeting && (
                  <p className="text-xs text-indigo-600 font-medium">
                    Next meeting: {formatDate(m.nextScheduledMeeting)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <MeetingModal isOpen onClose={() => setShowAddModal(false)} accountId={accountId} />}
      {editMeeting && <MeetingModal isOpen onClose={() => setEditMeeting(null)} accountId={accountId} initialMeeting={editMeeting} />}
    </div>
  );
}
