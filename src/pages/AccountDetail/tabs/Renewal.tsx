import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { formatDate, daysFromNow } from '../../../utils/helpers';
import { UrgencyBadge } from '../../../components/common/Badge';
import type { Account, RenewalStatus } from '../../../types';

interface Props {
  account: Account;
}

const RENEWAL_STATUSES: RenewalStatus[] = ['Active', 'Renewed', 'Churned', 'At Risk'];

const STATUS_COLORS: Record<RenewalStatus, string> = {
  Active: 'bg-blue-100 text-blue-700',
  Renewed: 'bg-green-100 text-green-700',
  Churned: 'bg-red-100 text-red-700',
  'At Risk': 'bg-amber-100 text-amber-700',
};

export default function Renewal({ account }: Props) {
  const { updateAccount } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    renewalStatus: account.renewalStatus,
    healthScore: account.healthScore?.toString() ?? '',
    riskNotes: account.riskNotes ?? '',
    nextRenewalAction: account.nextRenewalAction ?? '',
    nextRenewalActionOwner: account.nextRenewalActionOwner ?? '',
  });

  function handleSave() {
    updateAccount(account.id, {
      renewalStatus: form.renewalStatus,
      healthScore: form.healthScore ? parseInt(form.healthScore) : undefined,
      riskNotes: form.riskNotes || undefined,
      nextRenewalAction: form.nextRenewalAction || undefined,
      nextRenewalActionOwner: form.nextRenewalActionOwner || undefined,
    });
    setEditing(false);
  }

  const days = account.renewalDate ? daysFromNow(account.renewalDate) : null;

  return (
    <div className="space-y-5">
      {/* Renewal header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Renewal Overview</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[account.renewalStatus]}`}>
            {account.renewalStatus}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Renewal Date</p>
            <p className="text-sm font-semibold text-slate-800">{account.renewalDate ? formatDate(account.renewalDate) : '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Days Left</p>
            <div>{days !== null ? <UrgencyBadge days={days} /> : <span className="text-sm text-slate-500">—</span>}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Renewal Type</p>
            <p className="text-sm font-semibold text-slate-800">{account.renewalType ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Health & Risk</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors">Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm({ renewalStatus: account.renewalStatus, healthScore: account.healthScore?.toString() ?? '', riskNotes: account.riskNotes ?? '', nextRenewalAction: account.nextRenewalAction ?? '', nextRenewalActionOwner: account.nextRenewalActionOwner ?? '' }); }} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Renewal Status</label>
                <select value={form.renewalStatus} onChange={(e) => setForm((f) => ({ ...f, renewalStatus: e.target.value as RenewalStatus }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {RENEWAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Health Score (1–10)</label>
                <input type="number" min={1} max={10} value={form.healthScore} onChange={(e) => setForm((f) => ({ ...f, healthScore: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Risk Notes / Churn Signals</label>
              <textarea rows={3} value={form.riskNotes} onChange={(e) => setForm((f) => ({ ...f, riskNotes: e.target.value }))} placeholder="Any risk indicators, churn signals, or context…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Next Renewal Action</label>
                <input type="text" value={form.nextRenewalAction} onChange={(e) => setForm((f) => ({ ...f, nextRenewalAction: e.target.value }))} placeholder="e.g. Send renewal proposal" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Owner</label>
                <input type="text" value={form.nextRenewalActionOwner} onChange={(e) => setForm((f) => ({ ...f, nextRenewalActionOwner: e.target.value }))} placeholder="Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {account.healthScore !== undefined && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-2">Health Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${account.healthScore >= 7 ? 'bg-green-500' : account.healthScore >= 4 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${account.healthScore * 10}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-700">{account.healthScore}<span className="text-sm text-slate-400">/10</span></span>
                </div>
              </div>
            )}

            {account.riskNotes && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Risk Notes / Churn Signals</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg p-3">{account.riskNotes}</p>
              </div>
            )}

            {account.nextRenewalAction && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-indigo-700 mb-0.5">Next Renewal Action</p>
                <p className="text-sm text-indigo-800">{account.nextRenewalAction}</p>
                {account.nextRenewalActionOwner && <p className="text-xs text-indigo-500 mt-0.5">Owner: {account.nextRenewalActionOwner}</p>}
              </div>
            )}

            {!account.healthScore && !account.riskNotes && !account.nextRenewalAction && (
              <p className="text-sm text-slate-400 italic">No renewal details filled in yet. Click Edit to add.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
