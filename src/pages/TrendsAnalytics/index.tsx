import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SectionCard } from '../../components/common/SectionCard';
import { useFilters } from '../../context/FilterContext';
import { userActivity, healthSnapshots, supportMetrics, contracts } from '../../data/mock';
import { driverReports } from '../../data/driverReport';
import { fmtCurrency } from '../../utils/formatters';
import { getMonthsInRange } from '../../utils/dateHelpers';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB');
}

function ClientRequired() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-600">Please select a client to view this data</p>
      <p className="text-sm text-gray-400 mt-1">Use the Client dropdown in the top bar</p>
    </div>
  );
}

type CompareMode = 'mom' | 'qoq' | 'range';

const BEHAVIOUR_COLORS: Record<string, string> = {
  ha: '#ef4444',
  hb: '#f97316',
  hc: '#eab308',
  os: '#ec4899',
  ph: '#8b5cf6',
};

const BEHAVIOUR_LABELS: Record<string, string> = {
  ha: 'Harsh Accel',
  hb: 'Harsh Brake',
  hc: 'Harsh Corner',
  os: 'Overspeeding',
  ph: 'Phone Use',
};

export function TrendsAnalytics() {
  const { filters } = useFilters();
  const selectedClientId = filters.selectedClientId;
  const [compareMode, setCompareMode] = useState<CompareMode>('mom');
  const [sortCol, setSortCol] = useState<string>('totalRisk');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const data = useMemo(() => {
    if (!selectedClientId) return null;

    const months = getMonthsInRange(filters.dateRange);

    const trend = months.map(month => {
      const acts = userActivity.filter(u => u.month === month && u.client_id === selectedClientId);
      const snaps = healthSnapshots.filter(h => h.month === month && h.client_id === selectedClientId);
      const mySupport = supportMetrics.filter(s => s.client_id === selectedClientId);
      const licensed = acts.reduce((s, a) => s + a.licensed_users, 0);
      const active = acts.reduce((s, a) => s + a.active_users, 0);
      const avgHealth = snaps.length ? snaps.reduce((s, h) => s + h.health_score, 0) / snaps.length : 0;
      const avgAttach = snaps.length ? snaps.reduce((s, h) => s + h.attach_rate, 0) / snaps.length : 0;
      return {
        month: month.slice(5),
        adoptionRate: licensed ? parseFloat(((active / licensed) * 100).toFixed(1)) : 0,
        activeUsers: active,
        healthScore: parseFloat(avgHealth.toFixed(1)),
        attachRate: parseFloat(avgAttach.toFixed(1)),
        openTickets: mySupport.reduce((s, m) => s + m.tickets_open, 0),
      };
    });

    const q1 = trend.slice(0, 3);
    const q2 = trend.slice(3, 6);
    const q3 = trend.slice(6, 9);
    const q4 = trend.slice(9, 12);
    const qAvg = (arr: typeof trend, key: keyof typeof trend[0]) =>
      arr.reduce((s, r) => s + (r[key] as number), 0) / arr.length;

    const qoqData = [
      { quarter: 'Q1 2025', adoption: parseFloat(qAvg(q1, 'adoptionRate').toFixed(1)), health: parseFloat(qAvg(q1, 'healthScore').toFixed(1)) },
      { quarter: 'Q2 2025', adoption: parseFloat(qAvg(q2, 'adoptionRate').toFixed(1)), health: parseFloat(qAvg(q2, 'healthScore').toFixed(1)) },
      { quarter: 'Q3 2025', adoption: parseFloat(qAvg(q3, 'adoptionRate').toFixed(1)), health: parseFloat(qAvg(q3, 'healthScore').toFixed(1)) },
      { quarter: 'Q4/Q1', adoption: parseFloat(qAvg(q4, 'adoptionRate').toFixed(1)), health: parseFloat(qAvg(q4, 'healthScore').toFixed(1)) },
    ];

    const myContracts = contracts.filter(c => c.client_id === selectedClientId);
    const arrTrend = months.map((month, i) => {
      const total = myContracts.reduce((s, c) => s + c.arr, 0);
      const factor = 1 + i * 0.008;
      return { month: month.slice(5), arr: Math.round(total * factor * 0.083) };
    });

    return { trend, qoqData, arrTrend };
  }, [selectedClientId, filters.dateRange]);

  // Driver / At-Risk data
  const driverData = useMemo(() => {
    if (!selectedClientId) return null;

    const currentMonth = '2026-03';
    const priorMonth = '2026-02';

    const current = driverReports.filter(d => d.client_id === selectedClientId && d.month === currentMonth);
    const prior = driverReports.filter(d => d.client_id === selectedClientId && d.month === priorMonth);

    const sumField = (rows: typeof current, field: keyof typeof current[0]) =>
      rows.reduce((s, r) => s + (r[field] as number), 0);

    const behaviours = ['ph', 'ha', 'hb', 'hc', 'os'] as const;

    // KPI cards: current vs prior totals
    const kpis = behaviours.map(b => {
      const cur = sumField(current, b);
      const prv = sumField(prior, b);
      const delta = prv > 0 ? Math.round(((cur - prv) / prv) * 100) : 0;
      return { key: b, label: BEHAVIOUR_LABELS[b], current: cur, prior: prv, delta };
    });

    // Avg driving score
    const avgScore = current.length ? parseFloat((current.reduce((s, d) => s + d.driving_score, 0) / current.length).toFixed(1)) : 0;
    const priorAvgScore = prior.length ? parseFloat((prior.reduce((s, d) => s + d.driving_score, 0) / prior.length).toFixed(1)) : 0;
    const scoreDelta = parseFloat((avgScore - priorAvgScore).toFixed(1));

    // Hierarchy breakdown (stacked bar)
    const hierarchies = [...new Set(current.map(d => d.hierarchy))].sort();
    const hierarchyBreakdown = hierarchies.map(h => {
      const rows = current.filter(d => d.hierarchy === h);
      const obj: Record<string, number | string> = { hierarchy: h };
      behaviours.forEach(b => { obj[b] = rows.length ? Math.round(sumField(rows, b) / rows.length) : 0; });
      return obj;
    });

    // Score distribution
    const bands = [
      { label: '≥80 (Green)', min: 80, max: 101, color: '#22c55e' },
      { label: '60–79 (Amber)', min: 60, max: 80, color: '#f59e0b' },
      { label: '<60 (Red)', min: 0, max: 60, color: '#ef4444' },
    ];
    const scoreDistribution = bands.map(b => ({
      label: b.label,
      count: current.filter(d => d.driving_score >= b.min && d.driving_score < b.max).length,
      color: b.color,
    }));

    // MoM trend (last 2 months available)
    const momTrend = [priorMonth, currentMonth].map(m => {
      const rows = driverReports.filter(d => d.client_id === selectedClientId && d.month === m);
      const obj: Record<string, number | string> = { period: m.slice(5) };
      behaviours.forEach(b => { obj[b] = rows.length ? Math.round(sumField(rows, b) / rows.length) : 0; });
      return obj;
    });

    // QoQ trend — quarterly averages from actual data
    const allMonths = ['2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'];
    const quarters = [
      { label: 'Q1', months: allMonths.slice(0, 3) },
      { label: 'Q2', months: allMonths.slice(3, 6) },
      { label: 'Q3', months: allMonths.slice(6, 9) },
      { label: 'Q4', months: allMonths.slice(9, 12) },
    ];
    const qoqTrend = quarters.map(q => {
      const qRows = q.months.flatMap(m => driverReports.filter(d => d.client_id === selectedClientId && d.month === m));
      const obj: Record<string, number | string> = { period: q.label };
      behaviours.forEach(b => { obj[b] = qRows.length ? Math.round(sumField(qRows, b) / qRows.length) : 0; });
      return obj;
    });

    // Range trend — same as MoM but labels from filter range
    const rangeTrend = momTrend.map((r, i) => ({
      ...r,
      period: i === 0 ? 'Prior' : 'Current',
    }));

    // Full driver table (all drivers, current month)
    const allDrivers = current.map(d => ({
      ...d,
      totalRisk: d.ph + d.ha + d.hb + d.hc + d.os,
    }));

    // Period comparison grouped bar
    const periodComparison = behaviours.map(b => ({
      behaviour: BEHAVIOUR_LABELS[b],
      key: b,
      current: current.length ? Math.round(sumField(current, b) / current.length) : 0,
      prior: prior.length ? Math.round(sumField(prior, b) / prior.length) : 0,
    }));

    return { kpis, avgScore, scoreDelta, hierarchyBreakdown, scoreDistribution, momTrend, qoqTrend, rangeTrend, allDrivers, periodComparison };
  }, [selectedClientId]);

  const trendData = compareMode === 'mom' ? driverData?.momTrend
    : compareMode === 'qoq' ? driverData?.qoqTrend
    : driverData?.rangeTrend;

  const sortedDrivers = useMemo(() => {
    if (!driverData) return [];
    return [...driverData.allDrivers].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortCol] as number;
      const bv = (b as Record<string, unknown>)[sortCol] as number;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [driverData, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const DRIVER_COLS = [
    { key: 'employee_name', label: 'Driver', numeric: false },
    { key: 'hierarchy', label: 'Hierarchy', numeric: false },
    { key: 'trips', label: 'Trips', numeric: true },
    { key: 'distance', label: 'Dist (km)', numeric: true },
    { key: 'ph', label: 'Phone', numeric: true },
    { key: 'ha', label: 'H.Accel', numeric: true },
    { key: 'hb', label: 'H.Brake', numeric: true },
    { key: 'hc', label: 'H.Corner', numeric: true },
    { key: 'os', label: 'Overspeed', numeric: true },
    { key: 'totalRisk', label: 'Total Risk', numeric: true },
    { key: 'driving_score', label: 'Score', numeric: true },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Date range indicator */}
      <div className="inline-flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-3 py-2">
        <span className="font-medium">Showing:</span>
        <span>{formatDate(filters.dateRange.start)} – {formatDate(filters.dateRange.end)}</span>
      </div>

      {!selectedClientId ? (
        <ClientRequired />
      ) : (
        <>
          <SectionCard title="Active Users & Adoption Rate Trend (12 Months)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data!.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="activeUsers" stroke="#3b82f6" name="Active Users" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="adoptionRate" stroke="#22c55e" name="Adoption Rate %" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Health & Attach Rate Trend">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data!.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="healthScore" stroke="#3b82f6" name="Health Score" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="attachRate" stroke="#22c55e" name="Attach Rate" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Quarter-over-Quarter Comparison">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data!.qoqData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="adoption" fill="#3b82f6" name="Adoption Rate %" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="health" fill="#22c55e" name="Health Score" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          <SectionCard title="MRR Trend (12 Months)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data!.arrTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${((v as number)/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => fmtCurrency(v as number)} />
                <Bar dataKey="arr" fill="#8b5cf6" name="MRR" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* ── At-Risk Behaviours ── */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">At-Risk Behaviour Analysis</h2>
              {/* Compare mode toggle */}
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

            {/* Avg score + KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
              <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Avg Driving Score</p>
                <p className={`text-2xl font-bold ${driverData!.avgScore >= 80 ? 'text-green-600' : driverData!.avgScore >= 60 ? 'text-amber-500' : 'text-red-600'}`}>
                  {driverData!.avgScore}
                </p>
                <p className={`text-xs mt-0.5 ${driverData!.scoreDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {driverData!.scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(driverData!.scoreDelta)} vs prior
                </p>
              </div>
              {driverData!.kpis.map(k => (
                <div key={k.key} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
                  <p className="text-xl font-bold text-gray-900">{k.current.toLocaleString()}</p>
                  <p className={`text-xs mt-0.5 ${k.delta <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {k.delta > 0 ? '▲' : '▼'} {Math.abs(k.delta)}% vs prior
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Behaviour Trend */}
              <SectionCard title={`Behaviour Trends (${compareMode === 'mom' ? 'Month-over-Month' : compareMode === 'qoq' ? 'Quarter-over-Quarter' : 'Selected Range'})`}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    {(['ph', 'ha', 'hb', 'hc', 'os'] as const).map(b => (
                      <Line key={b} type="monotone" dataKey={b} stroke={BEHAVIOUR_COLORS[b]} name={BEHAVIOUR_LABELS[b]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Period Comparison */}
              <SectionCard title="Current vs Prior Period (Avg per Driver)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={driverData!.periodComparison} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="behaviour" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="prior" name="Prior Period" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="current" name="Current Period" radius={[2, 2, 0, 0]}>
                      {driverData!.periodComparison.map((entry, i) => (
                        <Cell key={i} fill={BEHAVIOUR_COLORS[entry.key]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Hierarchy Breakdown */}
              <SectionCard title="Behaviour by Hierarchy (Avg per Driver)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={driverData!.hierarchyBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="hierarchy" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip />
                    <Legend />
                    {(['ph', 'ha', 'hb', 'hc', 'os'] as const).map(b => (
                      <Bar key={b} dataKey={b} stackId="a" fill={BEHAVIOUR_COLORS[b]} name={BEHAVIOUR_LABELS[b]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Score Distribution */}
              <SectionCard title="Driving Score Distribution">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={driverData!.scoreDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Drivers" radius={[4, 4, 0, 0]}>
                      {driverData!.scoreDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* Full Driver Table */}
            <SectionCard title={`All Drivers — At-Risk Detail (${sortedDrivers.length} drivers, Mar 2026)`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {DRIVER_COLS.map(col => (
                        <th
                          key={col.key}
                          onClick={() => col.numeric && handleSort(col.key)}
                          className={`text-left py-2 px-2 font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.numeric ? 'cursor-pointer select-none hover:text-gray-800' : ''}`}
                        >
                          {col.label}
                          {sortCol === col.key && (
                            <span className="ml-1 text-blue-500">{sortDir === 'desc' ? '▼' : '▲'}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDrivers.map((row, i) => {
                      const scoreColor = row.driving_score >= 80 ? 'text-green-600' : row.driving_score >= 60 ? 'text-amber-500' : 'text-red-600';
                      const riskColor = row.totalRisk >= 20 ? 'text-red-600 font-semibold' : row.totalRisk >= 10 ? 'text-amber-600' : 'text-gray-700';
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 px-2 font-medium text-gray-900 truncate max-w-[130px]">{row.employee_name}</td>
                          <td className="py-1.5 px-2 text-gray-600 whitespace-nowrap">{row.hierarchy}</td>
                          <td className="py-1.5 px-2 text-gray-700">{row.trips}</td>
                          <td className="py-1.5 px-2 text-gray-700">{row.distance}</td>
                          <td className="py-1.5 px-2" style={{ color: BEHAVIOUR_COLORS.ph }}>{row.ph}</td>
                          <td className="py-1.5 px-2" style={{ color: BEHAVIOUR_COLORS.ha }}>{row.ha}</td>
                          <td className="py-1.5 px-2" style={{ color: BEHAVIOUR_COLORS.hb }}>{row.hb}</td>
                          <td className="py-1.5 px-2" style={{ color: BEHAVIOUR_COLORS.hc }}>{row.hc}</td>
                          <td className="py-1.5 px-2" style={{ color: BEHAVIOUR_COLORS.os }}>{row.os}</td>
                          <td className={`py-1.5 px-2 ${riskColor}`}>{row.totalRisk}</td>
                          <td className={`py-1.5 px-2 font-semibold ${scoreColor}`}>{row.driving_score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
