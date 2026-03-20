import React, { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, LineChart, Line, Legend, Cell,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { Download } from 'lucide-react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusPill } from '../../components/common/StatusPill';
import { AccountDrawer } from '../../components/AccountDrawer/index';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { getFilteredClients } from '../../utils/filterEngine';
import { clients as allClients, contracts, healthSnapshots } from '../../data/mock';
import { fmtCurrency } from '../../utils/formatters';
import { buildCSV, downloadCSV } from '../../utils/exportHelpers';
import { getLatestMonth, getMonthsInRange, getPriorMonth } from '../../utils/dateHelpers';

interface ScatterDot {
  x: number; y: number; arr: number;
  client: string; client_id: string;
  quadrant: string; color: string; isSelected: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterDot }>;
}

type SortCol = 'health' | 'attach' | 'arr' | 'days_to_renewal';
type CompareMode = 'mom' | 'qoq' | 'range';

const ALL_MONTHS = [
  '2025-03','2025-04','2025-05','2025-06','2025-07','2025-08',
  '2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03',
];

const QUARTERS = [
  { label: 'Q1 2025', months: ALL_MONTHS.slice(0, 3) },
  { label: 'Q2 2025', months: ALL_MONTHS.slice(3, 6) },
  { label: 'Q3 2025', months: ALL_MONTHS.slice(6, 9) },
  { label: 'Q4/Q1 \'26', months: ALL_MONTHS.slice(9, 13) },
];

const COMPONENTS = [
  { key: 'active_pct', label: 'Active %', color: '#3b82f6' },
  { key: 'feature_adoption_pct', label: 'Feature Adoption', color: '#8b5cf6' },
  { key: 'engagement_score', label: 'Engagement', color: '#22c55e' },
  { key: 'support_score', label: 'Support', color: '#f59e0b' },
  { key: 'billing_score', label: 'Billing', color: '#ec4899' },
  { key: 'attach_rate', label: 'Attach Rate', color: '#14b8a6' },
];

export function HealthRisk() {
  const { filters } = useFilters();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('health');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>('mom');

  const selectedClientId = filters.selectedClientId;
  const latestMonth = getLatestMonth(filters.dateRange);
  const priorMonth = getPriorMonth(filters.dateRange);
  const monthsInRange = getMonthsInRange(filters.dateRange);

  // ── Portfolio data (always computed) ──────────────────────────────────
  const data = useMemo(() => {
    const filtered = getFilteredClients(filters, user);
    const ids = new Set(filtered.map(c => c.client_id));

    const latestHealth = healthSnapshots.filter(h => h.month === latestMonth && ids.has(h.client_id));
    const contractMap = new Map(contracts.map(c => [c.client_id, c]));
    const clientMap = new Map(allClients.map(c => [c.client_id, c.client_name]));

    const scatterData: ScatterDot[] = latestHealth.map(h => {
      const contract = contractMap.get(h.client_id);
      const arr = contract?.arr || 0;
      const quadrant =
        h.health_score >= 75 && h.attach_rate >= 50 ? 'Strategic' :
        h.health_score >= 75 && h.attach_rate < 50 ? 'Expansion' :
        h.health_score < 75 && h.attach_rate >= 50 ? 'Stabilize' : 'Recovery';
      const isSelected = selectedClientId === h.client_id;
      return {
        x: h.attach_rate, y: h.health_score, arr,
        client: clientMap.get(h.client_id) || h.client_id,
        client_id: h.client_id, quadrant, isSelected,
        color: isSelected ? '#1d4ed8'
          : quadrant === 'Strategic' ? '#22c55e'
          : quadrant === 'Expansion' ? '#3b82f6'
          : quadrant === 'Stabilize' ? '#f59e0b' : '#ef4444',
      };
    });

    const segments = {
      Strategic: scatterData.filter(d => d.quadrant === 'Strategic'),
      Expansion: scatterData.filter(d => d.quadrant === 'Expansion'),
      Stabilize: scatterData.filter(d => d.quadrant === 'Stabilize'),
      Recovery: scatterData.filter(d => d.quadrant === 'Recovery'),
    };

    const trendData = monthsInRange.map(month => {
      const snaps = healthSnapshots.filter(h => h.month === month && ids.has(h.client_id));
      const avg = (field: keyof typeof snaps[0]) =>
        snaps.length ? parseFloat((snaps.reduce((s, h) => s + (h[field] as number), 0) / snaps.length).toFixed(1)) : 0;
      return { month: month.slice(5), health: avg('health_score'), attach: avg('attach_rate') };
    });

    const clientTable = latestHealth.map(h => {
      const contract = contractMap.get(h.client_id);
      const q = scatterData.find(s => s.client_id === h.client_id);
      return {
        client_id: h.client_id,
        client: clientMap.get(h.client_id) || h.client_id,
        health: h.health_score, attach: h.attach_rate,
        arr: contract?.arr || 0,
        quadrant: q?.quadrant || 'Recovery',
        days_to_renewal: contract?.days_to_renewal || 0,
      };
    });

    return { scatterData, segments, trendData, clientTable };
  }, [filters, user, latestMonth, monthsInRange, selectedClientId]);

  // ── Client-specific trend data ─────────────────────────────────────────
  const clientData = useMemo(() => {
    if (!selectedClientId) return null;

    const clientName = allClients.find(c => c.client_id === selectedClientId)?.client_name || selectedClientId;
    const latest = healthSnapshots.find(h => h.client_id === selectedClientId && h.month === latestMonth);
    const prior = healthSnapshots.find(h => h.client_id === selectedClientId && h.month === priorMonth);

    // MoM: all 13 months
    const momTrend = ALL_MONTHS.map(m => {
      const h = healthSnapshots.find(s => s.client_id === selectedClientId && s.month === m);
      return {
        month: m.slice(5),
        health: h?.health_score ?? null,
        attach: h?.attach_rate ?? null,
        active_pct: h?.active_pct ?? null,
        feature_adoption: h?.feature_adoption_pct ?? null,
        engagement: h?.engagement_score ?? null,
        support: h?.support_score ?? null,
        billing: h?.billing_score ?? null,
      };
    });

    // QoQ: quarterly averages
    const qoqTrend = QUARTERS.map(q => {
      const snaps = q.months
        .map(m => healthSnapshots.find(h => h.client_id === selectedClientId && h.month === m))
        .filter(Boolean) as typeof healthSnapshots;
      const avg = (field: keyof typeof snaps[0]) =>
        snaps.length ? parseFloat((snaps.reduce((s, h) => s + (h[field] as number), 0) / snaps.length).toFixed(1)) : 0;
      return {
        month: q.label,
        health: avg('health_score'),
        attach: avg('attach_rate'),
        active_pct: avg('active_pct'),
        feature_adoption: avg('feature_adoption_pct'),
        engagement: avg('engagement_score'),
        support: avg('support_score'),
        billing: avg('billing_score'),
      };
    });

    // Range: each month within the date range
    const rangeTrend = monthsInRange.map(m => {
      const h = healthSnapshots.find(s => s.client_id === selectedClientId && s.month === m);
      return {
        month: m.slice(5),
        health: h?.health_score ?? null,
        attach: h?.attach_rate ?? null,
        active_pct: h?.active_pct ?? null,
        feature_adoption: h?.feature_adoption_pct ?? null,
        engagement: h?.engagement_score ?? null,
        support: h?.support_score ?? null,
        billing: h?.billing_score ?? null,
      };
    });

    // Component radar for current snapshot
    const radarData = COMPONENTS.map(c => ({
      subject: c.label,
      value: (() => {
        if (!latest) return 0;
        if (c.key === 'active_pct') return latest.active_pct;
        if (c.key === 'feature_adoption_pct') return latest.feature_adoption_pct;
        if (c.key === 'attach_rate') return latest.attach_rate;
        return (latest as unknown as Record<string, number>)[c.key] ?? 0;
      })(),
      fullMark: 100,
    }));

    // Current vs prior comparison bars
    const comparison = COMPONENTS.map(c => ({
      label: c.label,
      key: c.key,
      color: c.color,
      current: (() => {
        if (!latest) return 0;
        if (c.key === 'active_pct') return latest.active_pct;
        if (c.key === 'feature_adoption_pct') return latest.feature_adoption_pct;
        if (c.key === 'attach_rate') return latest.attach_rate;
        return (latest as unknown as Record<string, number>)[c.key] ?? 0;
      })(),
      prior: (() => {
        if (!prior) return 0;
        if (c.key === 'active_pct') return prior.active_pct;
        if (c.key === 'feature_adoption_pct') return prior.feature_adoption_pct;
        if (c.key === 'attach_rate') return prior.attach_rate;
        return (prior as unknown as Record<string, number>)[c.key] ?? 0;
      })(),
    }));

    return {
      clientName,
      latest, prior,
      healthDelta: latest && prior ? parseFloat((latest.health_score - prior.health_score).toFixed(1)) : 0,
      attachDelta: latest && prior ? parseFloat((latest.attach_rate - prior.attach_rate).toFixed(1)) : 0,
      momTrend, qoqTrend, rangeTrend,
      radarData, comparison,
    };
  }, [selectedClientId, latestMonth, priorMonth, monthsInRange]);

  const activeTrend = compareMode === 'mom' ? clientData?.momTrend
    : compareMode === 'qoq' ? clientData?.qoqTrend
    : clientData?.rangeTrend;

  // ── Portfolio table sorting / filtering ───────────────────────────────
  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filteredSorted = useMemo(() => {
    let rows = data.clientTable.filter(r =>
      r.client.toLowerCase().includes(search.toLowerCase())
    );
    return [...rows].sort((a, b) => {
      const av = a[sortCol] as number;
      const bv = b[sortCol] as number;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [data.clientTable, search, sortCol, sortDir]);

  const handleExport = () => {
    const cols = ['client', 'health', 'attach', 'arr', 'quadrant', 'days_to_renewal'];
    const csv = buildCSV(cols, filteredSorted as unknown as Record<string, unknown>[], filters, 'Health & Risk');
    downloadCSV(csv, `health_risk_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded shadow p-2 text-xs">
        <div className="font-semibold">{d.client}</div>
        <div>Health: <span className="font-medium">{d.y}</span></div>
        <div>Attach: <span className="font-medium">{d.x}%</span></div>
        <div>ARR: <span className="font-medium">{fmtCurrency(d.arr, true)}</span></div>
        <div>Quadrant: <span className="font-medium">{d.quadrant}</span></div>
        {d.isSelected && <div className="text-blue-600 font-medium mt-1">★ Selected</div>}
      </div>
    );
  };

  const SortTh = ({ col, label }: { col: SortCol; label: string }) => (
    <th
      onClick={() => handleSort(col)}
      className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800"
    >
      {label}{sortCol === col && <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );

  const deltaEl = (val: number, higherIsBetter = true) => {
    const good = higherIsBetter ? val >= 0 : val <= 0;
    return (
      <span className={`text-xs font-medium ${good ? 'text-green-600' : 'text-red-500'}`}>
        {val >= 0 ? '▲' : '▼'} {Math.abs(val)} vs prior
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">

      {/* ── CLIENT-SPECIFIC HEALTH DETAIL ─────────────────────────────── */}
      {selectedClientId && clientData && (
        <div className="space-y-4">
          {/* Header + toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{clientData.clientName} — Health Deep-Dive</h2>
              <p className="text-xs text-gray-400 mt-0.5">Current period: {latestMonth} · Prior: {priorMonth}</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['mom', 'qoq', 'range'] as CompareMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setCompareMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${compareMode === m ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {m === 'mom' ? 'MoM' : m === 'qoq' ? 'QoQ' : 'Range'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Health Score</p>
              <p className={`text-3xl font-bold ${!clientData.latest ? 'text-gray-400' : clientData.latest.health_score >= 75 ? 'text-green-600' : clientData.latest.health_score >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                {clientData.latest?.health_score ?? '—'}
              </p>
              <div className="mt-1">{deltaEl(clientData.healthDelta)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Attach Rate</p>
              <p className="text-3xl font-bold text-gray-900">{clientData.latest?.attach_rate ?? '—'}%</p>
              <div className="mt-1">{deltaEl(clientData.attachDelta)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Engagement Score</p>
              <p className="text-3xl font-bold text-gray-900">{clientData.latest?.engagement_score?.toFixed(0) ?? '—'}</p>
              {clientData.latest && clientData.prior && (
                <div className="mt-1">{deltaEl(parseFloat((clientData.latest.engagement_score - clientData.prior.engagement_score).toFixed(1)))}</div>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Support Score</p>
              <p className={`text-3xl font-bold ${!clientData.latest ? 'text-gray-400' : clientData.latest.support_score >= 75 ? 'text-green-600' : clientData.latest.support_score >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                {clientData.latest?.support_score?.toFixed(0) ?? '—'}
              </p>
              {clientData.latest && clientData.prior && (
                <div className="mt-1">{deltaEl(parseFloat((clientData.latest.support_score - clientData.prior.support_score).toFixed(1)))}</div>
              )}
            </div>
          </div>

          {/* Trend charts */}
          {activeTrend && activeTrend.some(d => d.health !== null) ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title={`Health & Attach Trend (${compareMode === 'mom' ? 'Month-over-Month' : compareMode === 'qoq' ? 'Quarter-over-Quarter' : 'Selected Range'})`}>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={activeTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="health" stroke="#3b82f6" name="Health Score" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                      <Line type="monotone" dataKey="attach" stroke="#22c55e" name="Attach Rate" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="4 2" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>

                <SectionCard title="Health Score Components — Current vs Prior">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={clientData.comparison} layout="vertical" margin={{ top: 5, right: 20, left: 90, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={85} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="prior" name="Prior" fill="#e2e8f0" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="current" name="Current" radius={[0, 2, 2, 0]}>
                        {clientData.comparison.map((entry, i) => (
                          <Cell key={i} fill={COMPONENTS.find(c => c.label === entry.label)?.color || '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>

              {/* Component trends over time + radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="All Health Components Over Time">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={activeTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="active_pct" stroke="#3b82f6" name="Active %" strokeWidth={1.5} dot={false} connectNulls />
                      <Line type="monotone" dataKey="feature_adoption" stroke="#8b5cf6" name="Feature Adoption" strokeWidth={1.5} dot={false} connectNulls />
                      <Line type="monotone" dataKey="engagement" stroke="#22c55e" name="Engagement" strokeWidth={1.5} dot={false} connectNulls />
                      <Line type="monotone" dataKey="support" stroke="#f59e0b" name="Support" strokeWidth={1.5} dot={false} connectNulls />
                      <Line type="monotone" dataKey="billing" stroke="#ec4899" name="Billing" strokeWidth={1.5} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>

                <SectionCard title={`Health Score Radar — ${latestMonth}`}>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={clientData.radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <Radar name="Current" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip formatter={(v) => [`${v}`, '']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500">No health data available for this client in the selected period.</p>
              <p className="text-xs text-gray-400 mt-1">Try expanding the date range or switch to MoM view.</p>
            </div>
          )}

          <div className="border-t border-gray-200" />
        </div>
      )}

      {/* ── PORTFOLIO VIEW ─────────────────────────────────────────────── */}
      <div>
        {selectedClientId && (
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Portfolio Overview</p>
        )}

        {/* Segment Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'Strategic', color: 'green', label: 'Strategic', desc: 'Healthy + High Attach' },
            { key: 'Expansion', color: 'amber', label: 'Expansion Target', desc: 'Healthy + Low Attach' },
            { key: 'Stabilize', color: 'amber', label: 'Stabilize', desc: 'At Risk + High Attach' },
            { key: 'Recovery', color: 'red', label: 'Recovery', desc: 'At Risk + Low Attach' },
          ].map(seg => {
            const s = data.segments[seg.key as keyof typeof data.segments];
            return (
              <div key={seg.key} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <StatusPill status={seg.color as 'green' | 'amber' | 'red'} label={seg.label} />
                <p className="mt-2 text-2xl font-bold text-gray-900">{s.length}</p>
                <p className="text-xs text-gray-500">accounts</p>
                <p className="text-xs text-gray-400 mt-1">{seg.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SectionCard title={`Portfolio Risk Matrix — ${latestMonth} (bubble = ARR)`}>
            <div className="relative">
              <div className="absolute top-0 left-[12%] text-[10px] text-blue-400 pointer-events-none font-medium">Expansion Target</div>
              <div className="absolute top-0 right-4 text-[10px] text-green-500 pointer-events-none font-medium">Strategic</div>
              <div className="absolute bottom-6 left-[12%] text-[10px] text-red-400 pointer-events-none font-medium">Recovery</div>
              <div className="absolute bottom-6 right-4 text-[10px] text-amber-500 pointer-events-none font-medium">Stabilize</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="x" name="Attach Rate" unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Attach Rate', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Health Score" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Health Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis dataKey="arr" range={[40, 500]} name="ARR" />
                  <ReferenceLine x={50} stroke="#94a3b8" strokeDasharray="4 2" />
                  <ReferenceLine y={75} stroke="#94a3b8" strokeDasharray="4 2" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={data.scatterData} name="Accounts">
                    {data.scatterData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        fillOpacity={entry.isSelected ? 1 : 0.7}
                        stroke={entry.isSelected ? '#1e3a8a' : 'none'}
                        strokeWidth={entry.isSelected ? 2 : 0}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-center text-[10px] text-gray-400 mt-1">Dot size = ARR · Blue = selected client</p>
            </div>
          </SectionCard>

          <SectionCard title="Portfolio Health & Attach Rate Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="health" stroke="#3b82f6" name="Avg Health Score" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="attach" stroke="#22c55e" name="Avg Attach Rate" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        <SectionCard title={`Account Health Summary (${filteredSorted.length} accounts) — Click row to inspect`}>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Search client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 max-w-xs border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                  <SortTh col="health" label="Health Score" />
                  <SortTh col="attach" label="Attach Rate" />
                  <SortTh col="arr" label="ARR" />
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Segment</th>
                  <SortTh col="days_to_renewal" label="Days to Renewal" />
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((row, i) => {
                  const healthColor = row.health >= 75 ? 'text-green-600' : row.health >= 50 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors ${filters.selectedClientId === row.client_id ? 'bg-blue-50 border-l-2 border-l-blue-400' : ''}`}
                      onClick={() => setDrawerClientId(row.client_id)}
                    >
                      <td className="py-2 px-3 font-medium text-gray-900 truncate max-w-[160px]">{row.client}</td>
                      <td className={`py-2 px-3 font-semibold ${healthColor}`}>{row.health}</td>
                      <td className="py-2 px-3 text-gray-700">{row.attach}%</td>
                      <td className="py-2 px-3 text-gray-700">{fmtCurrency(row.arr, true)}</td>
                      <td className="py-2 px-3">
                        <StatusPill
                          status={row.quadrant === 'Strategic' ? 'green' : row.quadrant === 'Recovery' ? 'red' : 'amber'}
                          label={row.quadrant}
                        />
                      </td>
                      <td className={`py-2 px-3 ${row.days_to_renewal <= 30 ? 'text-red-500 font-medium' : row.days_to_renewal <= 90 ? 'text-amber-500' : 'text-gray-700'}`}>
                        {row.days_to_renewal < 0 ? `Expired ${Math.abs(row.days_to_renewal)}d ago` : `${row.days_to_renewal}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSorted.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No accounts match your search.</div>
            )}
          </div>
        </SectionCard>
      </div>

      {drawerClientId && <AccountDrawer clientId={drawerClientId} onClose={() => setDrawerClientId(null)} />}
    </div>
  );
}
