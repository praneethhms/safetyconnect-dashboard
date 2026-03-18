import React, { useMemo } from 'react';
import { X, ExternalLink, TrendingUp, Users, Heart, DollarSign, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clients, contracts, healthSnapshots, userActivity, supportMetrics } from '../../data/mock';
import { driverReports } from '../../data/driverReport';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency, fmtPct } from '../../utils/formatters';

interface AccountDrawerProps {
  clientId: string;
  onClose: () => void;
}

export function AccountDrawer({ clientId, onClose }: AccountDrawerProps) {
  const navigate = useNavigate();
  const { setFilters } = useFilters();

  const d = useMemo(() => {
    const client = clients.find(c => c.client_id === clientId);
    const contract = contracts.find(c => c.client_id === clientId);
    const latestHealth = healthSnapshots.find(h => h.client_id === clientId && h.month === '2026-03');
    const priorHealth = healthSnapshots.find(h => h.client_id === clientId && h.month === '2026-02');
    const latestActivity = userActivity.find(u => u.client_id === clientId && u.month === '2026-03');
    const support = supportMetrics.find(s => s.client_id === clientId);
    const drivers = driverReports.filter(d => d.client_id === clientId && d.month === '2026-03');

    const adoptionRate = latestActivity && latestActivity.licensed_users
      ? (latestActivity.active_users / latestActivity.licensed_users) * 100 : 0;

    const avgDrivingScore = drivers.length
      ? drivers.reduce((s, d) => s + d.driving_score, 0) / drivers.length : null;

    const healthDelta = latestHealth && priorHealth
      ? latestHealth.health_score - priorHealth.health_score : 0;

    return { client, contract, latestHealth, latestActivity, support, avgDrivingScore, adoptionRate, healthDelta };
  }, [clientId]);

  if (!d.client) return null;

  const healthColor = !d.latestHealth ? 'text-gray-400'
    : d.latestHealth.health_score >= 75 ? 'text-green-600'
    : d.latestHealth.health_score >= 50 ? 'text-amber-500' : 'text-red-600';

  const dtrColor = !d.contract ? 'text-gray-400'
    : d.contract.days_to_renewal < 0 ? 'text-red-600'
    : d.contract.days_to_renewal <= 30 ? 'text-red-500'
    : d.contract.days_to_renewal <= 90 ? 'text-amber-500' : 'text-gray-700';

  const scoreColor = d.avgDrivingScore == null ? 'text-gray-400'
    : d.avgDrivingScore >= 80 ? 'text-green-600'
    : d.avgDrivingScore >= 60 ? 'text-amber-500' : 'text-red-600';

  const goTo = (path: string) => {
    setFilters({ selectedClientId: clientId });
    navigate(path);
    onClose();
  };

  const tierColors: Record<string, string> = {
    Enterprise: 'bg-purple-100 text-purple-700',
    'Mid-Market': 'bg-blue-100 text-blue-700',
    SMB: 'bg-gray-100 text-gray-600',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-gray-900 text-base">{d.client.client_name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[d.client.tier] || 'bg-gray-100 text-gray-600'}`}>
                {d.client.tier}
              </span>
            </div>
            <p className="text-xs text-gray-500">{d.client.region} · {d.client.country} · CSM: {d.client.csm_owner}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart size={12} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Health Score</p>
              </div>
              <p className={`text-2xl font-bold ${healthColor}`}>
                {d.latestHealth ? d.latestHealth.health_score : '—'}
              </p>
              {d.latestHealth && (
                <p className={`text-xs mt-0.5 ${d.healthDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {d.healthDelta >= 0 ? '▲' : '▼'} {Math.abs(d.healthDelta).toFixed(0)} vs prior
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">ARR</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{d.contract ? fmtCurrency(d.contract.arr, true) : '—'}</p>
              {d.contract && (
                <p className="text-xs text-gray-400 mt-0.5">{d.contract.billing_cycle}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Users size={12} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Adoption</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{fmtPct(d.adoptionRate)}</p>
              {d.latestActivity && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {d.latestActivity.active_users} / {d.latestActivity.licensed_users} users
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={12} className="text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Renewal</p>
              </div>
              <p className={`text-2xl font-bold ${dtrColor}`}>
                {d.contract
                  ? d.contract.days_to_renewal < 0
                    ? `${Math.abs(d.contract.days_to_renewal)}d ago`
                    : `${d.contract.days_to_renewal}d`
                  : '—'}
              </p>
              {d.contract && (
                <p className="text-xs text-gray-400 mt-0.5">{d.contract.renewal_date}</p>
              )}
            </div>
          </div>

          {/* Additional stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Invoice Status</span>
              <span className={`text-xs font-semibold ${d.contract?.invoice_status === 'Paid' ? 'text-green-600' : d.contract?.invoice_status === 'Overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                {d.contract?.invoice_status || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Attach Rate</span>
              <span className="text-xs font-semibold text-gray-800">{d.latestHealth ? `${d.latestHealth.attach_rate}%` : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Open Support Tickets</span>
              <span className={`text-xs font-semibold ${(d.support?.tickets_open || 0) > 3 ? 'text-red-600' : 'text-gray-800'}`}>
                {d.support?.tickets_open ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Escalations</span>
              <span className={`text-xs font-semibold ${(d.support?.escalation_count || 0) > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                {d.support?.escalation_count ?? '—'}
              </span>
            </div>
            {d.avgDrivingScore !== null && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">Avg Driving Score</span>
                <span className={`text-xs font-semibold ${scoreColor}`}>{d.avgDrivingScore.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Business Unit</span>
              <span className="text-xs text-gray-700">{d.client.business_unit}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">Onboarded</span>
              <span className="text-xs text-gray-700">{new Date(d.client.onboarding_date).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Quadrant */}
          {d.latestHealth && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Portfolio Segment</p>
              {(() => {
                const h = d.latestHealth!;
                const q = h.health_score >= 75 && h.attach_rate >= 50 ? 'Strategic'
                  : h.health_score >= 75 && h.attach_rate < 50 ? 'Expansion Target'
                  : h.health_score < 75 && h.attach_rate >= 50 ? 'Stabilize'
                  : 'Recovery';
                const qColor = q === 'Strategic' ? 'text-green-600 bg-green-50 border-green-200'
                  : q === 'Expansion Target' ? 'text-blue-600 bg-blue-50 border-blue-200'
                  : q === 'Stabilize' ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-red-600 bg-red-50 border-red-200';
                return (
                  <span className={`text-xs font-semibold px-2 py-1 rounded border ${qColor}`}>{q}</span>
                );
              })()}
            </div>
          )}

          {/* Quick navigation */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Open in Tab</p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { label: 'Adoption & Usage', path: '/adoption', icon: TrendingUp },
                { label: 'Action Centre', path: '/actions', icon: Users },
                { label: 'Trends & Analytics', path: '/trends', icon: TrendingUp },
              ].map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => goTo(path)}
                  className="flex items-center justify-between text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={12} />
                    {label}
                  </div>
                  <ExternalLink size={11} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
