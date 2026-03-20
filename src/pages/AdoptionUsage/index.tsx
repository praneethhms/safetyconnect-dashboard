import React, { useMemo, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend, LabelList,
} from 'recharts';
import { Download, FileDown, Image } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { clients as allClients, userActivity, hierarchyNodes } from '../../data/mock';
import { fmtPct, fmtNum } from '../../utils/formatters';
import { buildCSV, downloadCSV, downloadChartAsPNG } from '../../utils/exportHelpers';
import { driverReports } from '../../data/driverReport';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB');
}

function DateRangeBanner() {
  const { filters } = useFilters();
  return (
    <div className="inline-flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-3 py-2">
      <span className="font-medium">Showing:</span>
      <span>{formatDate(filters.dateRange.start)} – {formatDate(filters.dateRange.end)}</span>
    </div>
  );
}

function ClientRequired() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-600">Please select a client to view this data</p>
      <p className="text-sm text-gray-400 mt-1">Use the Client dropdown in the top bar</p>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  chartRef: React.RefObject<HTMLDivElement>;
  csvData: Record<string, unknown>[];
  csvColumns: string[];
  csvFilename: string;
  children: React.ReactNode;
}

function ChartCard({ title, chartRef, csvData, csvColumns, csvFilename, children }: ChartCardProps) {
  const { filters } = useFilters();

  const handleCSV = () => {
    const csv = buildCSV(csvColumns, csvData, filters, title);
    downloadCSV(csv, `${csvFilename}.csv`);
  };

  const handlePNG = () => downloadChartAsPNG(chartRef, csvFilename);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCSV}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
            title="Download CSV"
          >
            <FileDown size={11} /> CSV
          </button>
          <button
            onClick={handlePNG}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
            title="Download PNG"
          >
            <Image size={11} /> PNG
          </button>
        </div>
      </div>
      <div className="p-4" ref={chartRef}>
        {children}
      </div>
    </div>
  );
}

export function AdoptionUsage() {
  const { filters } = useFilters();
  const selectedClientId = filters.selectedClientId;

  const funnelRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const activeUsersRef = useRef<HTMLDivElement>(null);

  const clientName = useMemo(
    () => allClients.find(c => c.client_id === selectedClientId)?.client_name || '',
    [selectedClientId]
  );

  const data = useMemo(() => {
    if (!selectedClientId) return null;

    const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
    const trendData = months.map(month => {
      const acts = userActivity.filter(u => u.month === month && u.client_id === selectedClientId);
      const licensed = acts.reduce((s, a) => s + a.licensed_users, 0);
      const active = acts.reduce((s, a) => s + a.active_users, 0);
      const activated = acts.reduce((s, a) => s + a.activated_users, 0);
      return {
        month: month.slice(5),
        licensed,
        activated,
        active,
        adoptionRate: licensed ? parseFloat(((active / licensed) * 100).toFixed(1)) : 0,
        activationRate: licensed ? parseFloat(((activated / licensed) * 100).toFixed(1)) : 0,
      };
    });

    const latest = trendData[trendData.length - 1];
    const prior = trendData[trendData.length - 2];
    const adoptionDelta = parseFloat((latest.adoptionRate - prior.adoptionRate).toFixed(1));
    const activationDelta = parseFloat((latest.activationRate - prior.activationRate).toFixed(1));

    const funnelData = [
      { stage: 'Licensed', value: latest.licensed },
      { stage: 'Activated', value: latest.activated },
      { stage: 'Active', value: latest.active },
    ];

    const myNodes = hierarchyNodes.filter(n => n.client_id === selectedClientId);

    const byRegion: Record<string, { licensed: number; active: number }> = {};
    myNodes.forEach(n => {
      if (!byRegion[n.region]) byRegion[n.region] = { licensed: 0, active: 0 };
      byRegion[n.region].licensed += n.licensed_users;
      byRegion[n.region].active += n.active_users;
    });
    const regionData = Object.entries(byRegion).map(([region, v]) => ({
      region,
      adoptionRate: v.licensed ? parseFloat(((v.active / v.licensed) * 100).toFixed(1)) : 0,
    }));

    const byLevel: Record<string, { licensed: number; active: number }> = {};
    myNodes.forEach(n => {
      if (!byLevel[n.hierarchy_level]) byLevel[n.hierarchy_level] = { licensed: 0, active: 0 };
      byLevel[n.hierarchy_level].licensed += n.licensed_users;
      byLevel[n.hierarchy_level].active += n.active_users;
    });
    const levelData = Object.entries(byLevel).map(([level, v]) => ({
      level,
      active: v.active,
      inactive: v.licensed - v.active,
      adoptionRate: v.licensed ? parseFloat(((v.active / v.licensed) * 100).toFixed(1)) : 0,
    }));

    return { trendData, funnelData, regionData, levelData, latest, adoptionDelta, activationDelta };
  }, [selectedClientId]);

  const safetyData = useMemo(() => {
    if (!selectedClientId) return null;
    const reports = driverReports.filter(d => d.client_id === selectedClientId && d.month === '2026-03');
    if (!reports.length) return null;

    const avgScore = reports.reduce((s, d) => s + d.driving_score, 0) / reports.length;
    const green = reports.filter(d => d.driving_score >= 80).length;
    const amber = reports.filter(d => d.driving_score >= 60 && d.driving_score < 80).length;
    const red = reports.filter(d => d.driving_score < 60).length;

    const behaviors = [
      { label: 'Phone Usage', value: reports.reduce((s, d) => s + d.ph, 0) },
      { label: 'Harsh Accel.', value: reports.reduce((s, d) => s + d.ha, 0) },
      { label: 'Harsh Braking', value: reports.reduce((s, d) => s + d.hb, 0) },
      { label: 'Harsh Cornering', value: reports.reduce((s, d) => s + d.hc, 0) },
      { label: 'Over Speeding', value: reports.reduce((s, d) => s + d.os, 0) },
    ];
    const topRisk = behaviors.sort((a, b) => b.value - a.value)[0];

    return { avgScore: parseFloat(avgScore.toFixed(1)), green, amber, red, topRisk, total: reports.length };
  }, [selectedClientId]);

  const handleExportAll = useCallback(() => {
    if (!data) return;
    const exportSets = [
      { cols: ['month', 'licensed', 'activated', 'active', 'adoptionRate', 'activationRate'], rows: data.trendData, name: 'adoption_trend' },
      { cols: ['stage', 'value'], rows: data.funnelData, name: 'adoption_funnel' },
      { cols: ['region', 'adoptionRate'], rows: data.regionData, name: 'adoption_by_region' },
      { cols: ['level', 'active', 'inactive', 'adoptionRate'], rows: data.levelData, name: 'adoption_by_level' },
    ];
    exportSets.forEach((d, i) => {
      setTimeout(() => {
        const csv = buildCSV(d.cols, d.rows as Record<string, unknown>[], filters, d.name);
        downloadCSV(csv, `${clientName}_${d.name}.csv`);
      }, i * 350);
    });
  }, [data, filters, clientName]);

  return (
    <div className="p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <DateRangeBanner />
        {data && (
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-2 transition-colors shadow-sm"
          >
            <Download size={12} />
            Export All
          </button>
        )}
      </div>

      {!selectedClientId ? (
        <ClientRequired />
      ) : (
        <>
          {/* Summary banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Adoption Rate</p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-bold text-gray-900">{fmtPct(data!.latest.adoptionRate)}</span>
                <span className={`text-sm font-semibold ${data!.adoptionDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data!.adoptionDelta >= 0 ? '+' : ''}{data!.adoptionDelta}% vs prior period
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Activation Rate</p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-bold text-gray-900">{fmtPct(data!.latest.activationRate)}</span>
                <span className={`text-sm font-semibold ${data!.activationDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data!.activationDelta >= 0 ? '+' : ''}{data!.activationDelta}% vs prior period
                </span>
              </div>
            </div>
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Adoption Funnel (Current Period)"
              chartRef={funnelRef}
              csvData={data!.funnelData as unknown as Record<string, unknown>[]}
              csvColumns={['stage', 'value']}
              csvFilename={`${clientName}_adoption_funnel`}
            >
              <div className="space-y-3 py-4">
                {[
                  {
                    label: 'Licensed',
                    value: data!.funnelData[0].value,
                    pct: 100,
                    color: 'bg-blue-500',
                    drop: null,
                  },
                  {
                    label: 'Activated',
                    value: data!.funnelData[1].value,
                    pct: data!.funnelData[0].value ? Math.round((data!.funnelData[1].value / data!.funnelData[0].value) * 100) : 0,
                    color: 'bg-purple-500',
                    drop: data!.funnelData[0].value ? Math.round(((data!.funnelData[0].value - data!.funnelData[1].value) / data!.funnelData[0].value) * 100) : 0,
                  },
                  {
                    label: 'Active',
                    value: data!.funnelData[2].value,
                    pct: data!.funnelData[0].value ? Math.round((data!.funnelData[2].value / data!.funnelData[0].value) * 100) : 0,
                    color: 'bg-green-500',
                    drop: data!.funnelData[1].value ? Math.round(((data!.funnelData[1].value - data!.funnelData[2].value) / data!.funnelData[1].value) * 100) : 0,
                  },
                ].map((stage) => (
                  <div key={stage.label}>
                    {stage.drop !== null && stage.drop > 0 && (
                      <div className="flex items-center gap-2 ml-4 mb-1">
                        <div className="w-px h-3 bg-gray-200 ml-3" />
                        <span className="text-xs text-red-500 font-medium">▼ {stage.drop}% drop-off</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-16 text-right">{stage.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                        <div
                          className={`${stage.color} h-full rounded-full flex items-center justify-end pr-3 transition-all`}
                          style={{ width: `${stage.pct}%`, minWidth: '2rem' }}
                        >
                          <span className="text-white text-xs font-bold">{stage.pct}%</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-800 w-14">{stage.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Activation Rate: <span className="font-semibold text-purple-600">{fmtPct(data!.latest.activationRate)}</span>
                &nbsp;| Adoption Rate: <span className="font-semibold text-green-600">{fmtPct(data!.latest.adoptionRate)}</span>
              </div>
            </ChartCard>

            <ChartCard
              title="Adoption & Activation Rate Trend"
              chartRef={trendRef}
              csvData={data!.trendData as unknown as Record<string, unknown>[]}
              csvColumns={['month', 'adoptionRate', 'activationRate']}
              csvFilename={`${clientName}_rate_trend`}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data!.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Legend />
                  <Line type="monotone" dataKey="adoptionRate" stroke="#22c55e" name="Adoption Rate" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="activationRate" stroke="#8b5cf6" name="Activation Rate" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Adoption by Region"
              chartRef={regionRef}
              csvData={data!.regionData as unknown as Record<string, unknown>[]}
              csvColumns={['region', 'adoptionRate']}
              csvFilename={`${clientName}_adoption_by_region`}
            >
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={data!.regionData} margin={{ top: 22, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 110]} hide />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Adoption Rate']} />
                  <Bar dataKey="adoptionRate" fill="#3b82f6" name="Adoption Rate %" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="adoptionRate"
                      position="top"
                      formatter={(v: number) => `${v}%`}
                      style={{ fontSize: 12, fill: '#1d4ed8', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Adoption by Hierarchy Level"
              chartRef={levelRef}
              csvData={data!.levelData as unknown as Record<string, unknown>[]}
              csvColumns={['level', 'active', 'inactive', 'adoptionRate']}
              csvFilename={`${clientName}_adoption_by_level`}
            >
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={data!.levelData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name: string) => [fmtNum(v), name]} />
                  <Legend />
                  <Bar dataKey="active" fill="#22c55e" name="Active" stackId="a" />
                  <Bar dataKey="inactive" fill="#fca5a5" name="Inactive" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Active Users Trend */}
          <ChartCard
            title="Active Users Trend (Monthly)"
            chartRef={activeUsersRef}
            csvData={data!.trendData as unknown as Record<string, unknown>[]}
            csvColumns={['month', 'licensed', 'activated', 'active']}
            csvFilename={`${clientName}_active_users_trend`}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data!.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) => [fmtNum(v), name]} />
                <Legend />
                <Line type="monotone" dataKey="licensed" stroke="#94a3b8" name="Licensed" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="active" stroke="#22c55e" name="Active" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="activated" stroke="#8b5cf6" name="Activated" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Driver Safety Overview */}
          {safetyData && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Driver Safety Overview</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Avg Driving Score</p>
                    <p className={`text-3xl font-bold ${safetyData.avgScore >= 80 ? 'text-green-600' : safetyData.avgScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {safetyData.avgScore}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">out of 100</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Score Zones</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between px-2"><span className="text-green-600 font-medium">Green (80+)</span><span className="font-bold">{safetyData.green} ({Math.round(safetyData.green / safetyData.total * 100)}%)</span></div>
                      <div className="flex justify-between px-2"><span className="text-amber-600 font-medium">Amber (60-79)</span><span className="font-bold">{safetyData.amber} ({Math.round(safetyData.amber / safetyData.total * 100)}%)</span></div>
                      <div className="flex justify-between px-2"><span className="text-red-600 font-medium">Red (&lt;60)</span><span className="font-bold">{safetyData.red} ({Math.round(safetyData.red / safetyData.total * 100)}%)</span></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Top Risk Behaviour</p>
                    <p className="text-lg font-bold text-red-600">{safetyData.topRisk.label}</p>
                    <p className="text-xs text-gray-500">{safetyData.topRisk.value} incidents</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Total Drivers</p>
                    <p className="text-3xl font-bold text-gray-800">{safetyData.total}</p>
                    <p className="text-xs text-gray-400 mt-1">this period</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
