import { useApp } from '../../../context/AppContext';
import { formatDate, daysFromNow, daysAgo } from '../../../utils/helpers';
import { HealthBadge, SegmentBadge, SolutionTag, UrgencyBadge } from '../../../components/common/Badge';
import type { Account } from '../../../types';

interface Props {
  account: Account;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value ?? '—'}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

export default function Overview({ account }: Props) {
  const { tasks, activities, meetings } = useApp();

  const accountTasks = tasks.filter((t) => t.accountId === account.id && t.status !== 'Done');
  const accountActivities = activities.filter((a) => a.accountId === account.id);
  const lastActivity = accountActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const lastMeeting = meetings
    .filter((m) => m.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  return (
    <div className="space-y-6">
      {/* Quick stats strip */}
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Open Tasks" value={accountTasks.length} />
        <Stat
          label="Last Meeting"
          value={lastMeeting ? formatDate(lastMeeting.date) : 'None logged'}
        />
        <Stat
          label="Days to Renewal"
          value={account.renewalDate
            ? <UrgencyBadge days={daysFromNow(account.renewalDate)} />
            : 'No renewal date'}
        />
        <Stat
          label="Last Activity"
          value={lastActivity ? `${daysAgo(lastActivity.date)}d ago` : 'No activity'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Account info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Account Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Segment" value={account.segment} />
            <Field label="Industry" value={account.industry} />
            <Field label="Location" value={account.location} />
            <Field label="Devices" value={account.devices?.toLocaleString()} />
            <Field label="Renewal Type" value={account.renewalType} />
            <Field label="Renewal Date" value={account.renewalDate ? formatDate(account.renewalDate) : undefined} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">Solutions</p>
            <div className="flex flex-wrap gap-1.5">
              {account.solutions.map((s) => <SolutionTag key={s} solution={s} />)}
            </div>
          </div>
        </div>

        {/* Contacts & health */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Key Contacts</h3>
            <div className="space-y-3">
              <Field label="Primary Contact" value={account.primaryContact} />
              <Field label="Champion" value={account.champion} />
              <Field label="Executive Sponsor" value={account.executiveSponsor} />
            </div>
            {!account.primaryContact && !account.champion && !account.executiveSponsor && (
              <p className="text-xs text-slate-400">No key contacts defined. Add contacts in the Stakeholders tab.</p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Health</h3>
              <HealthBadge health={account.health} />
            </div>
            {account.healthScore !== undefined && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Health Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${account.healthScore >= 7 ? 'bg-green-500' : account.healthScore >= 4 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${account.healthScore * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{account.healthScore}/10</span>
                </div>
              </div>
            )}
            {account.riskNotes && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Risk Notes</p>
                <p className="text-xs text-slate-700 leading-relaxed">{account.riskNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
