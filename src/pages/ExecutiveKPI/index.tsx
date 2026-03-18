import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { KPICard } from '../../components/common/KPICard';
import { SectionCard } from '../../components/common/SectionCard';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { getFilteredClients } from '../../utils/filterEngine';
import { contracts, userActivity, healthSnapshots, supportMetrics } from '../../data/mock';
import { fmtCurrency, fmtPct, fmtNum, colorBand } from '../../utils/formatters';
import { getLatestMonth, getPriorMonth } from '../../utils/dateHelpers';
import { buildCSV, downloadCSV } from '../../utils/exportHelpers';

export function ExecutiveKPI() {
  const { filters } = useFilters();
  const { user } = useAuth();

  const data = useMemo(() => {
    const filteredClients = getFilteredClients(filters, user);
    const ids = new Set(filteredClients.map(c => c.client_id));
    const currentMonth = getLatestMonth(filters.dateRange);
    const priorMonth = getPriorMonth(filters.dateRange);

    const curActivity = userActivity.filter(u => u.month === currentMonth && ids.has(u.client_id));
    const prevActivity = userActivity.filter(u => u.month === priorMonth && ids.has(u.client_id));
    const curHealth = healthSnapshots.filter(h => h.month === currentMonth && ids.has(h.client_id));
    const myContracts = contracts.filter(c => ids.has(c.client_id));
    const mySupport = supportMetrics.filter(s => ids.has(s.client_id));

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
    const delta = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;

    // Portfolio Scale
    const totalClients = filteredClients.length;
    const prevClients = totalClients; // static
    const licensed = sum(curActivity.map(a => a.licensed_users));
    const prevLicensed = sum(prevActivity.map(a => a.licensed_users));
    const active = sum(curActivity.map(a => a.active_users));
    const prevActive = sum(prevActivity.map(a => a.active_users));
    const inactive = licensed - active;
    const prevInactive = prevLicensed - sum(prevActivity.map(a => a.active_users));
    const adoptionRate = licensed ? (active / licensed) * 100 : 0;
    const prevAdoption = prevLicensed ? (sum(prevActivity.map(a => a.active_users)) / prevLicensed) * 100 : 0;

    // Revenue
    const totalARR = sum(myContracts.map(c => c.arr));
    const totalMRR = sum(myContracts.map(c => c.mrr));
    const churnARR = myContracts.filter((_, i) => i % 20 === 0).reduce((s, c) => s + c.arr * 0.1, 0);
    const expansionARR = myContracts.filter((_, i) => i % 15 === 0).reduce((s, c) => s + c.arr * 0.05, 0);
    const openingARR = totalARR - expansionARR + churnARR;
    const nrr = openingARR ? ((openingARR - churnARR + expansionARR) / openingARR) * 100 : 100;
    const grr = openingARR ? ((openingARR - churnARR) / openingARR) * 100 : 100;
    const overdueAccounts = myContracts.filter(c => c.invoice_status === 'Overdue').length;
    const renewals90 = myContracts.filter(c => c.days_to_renewal >= 0 && c.days_to_renewal <= 90).length;

    // Adoption
    const activated = sum(curActivity.map(a => a.activated_users));
    const activationRate = licensed ? (activated / licensed) * 100 : 0;
    const noDataPct = licensed ? (sum(curActivity.map(a => a.no_data_users)) / licensed) * 100 : 0;
    const staleDevicePct = licensed ? (sum(curActivity.map(a => a.stale_device_users)) / licensed) * 100 : 0;
    const permOffPct = licensed ? (sum(curActivity.map(a => a.permission_off_users)) / licensed) * 100 : 0;

    // Engagement
    const avgSessions = avg(curActivity.map(a => a.sessions_per_active_user));
    const prevSessions = avg(prevActivity.map(a => a.sessions_per_active_user));
    const featureBreadth = avg(curActivity.map(a => a.feature_adoption_pct * 100));
    const dau = sum(curActivity.map(a => a.dau));
    const dauMau = active ? (dau / active) * 100 : 0;
    const avgHealth = avg(curHealth.map(h => h.health_score));
    const prevHealth = avg(healthSnapshots.filter(h => h.month === priorMonth && ids.has(h.client_id)).map(h => h.health_score));

    // Risk
    const recoveryAccounts = curHealth.filter(h => h.health_score < 50).length;
    const recoveryPct = totalClients ? (recoveryAccounts / totalClients) * 100 : 0;
    const churnRiskARR = myContracts.filter(c => {
      const health = curHealth.find(h => h.client_id === c.client_id);
      return health && health.health_score < 50;
    }).reduce((s, c) => s + c.arr, 0);
    const avgResolution = avg(mySupport.map(s => s.avg_resolution_hours));
    const totalTickets = mySupport.reduce((s, m) => s + m.tickets_open + m.tickets_resolved, 0);
    const totalEscalations = mySupport.reduce((s, m) => s + m.escalation_count, 0);
    const escalationRate = totalTickets ? (totalEscalations / totalTickets) * 100 : 0;

    return {
      // Portfolio Scale
      totalClients, licensed, active, inactive, adoptionRate,
      d_clients: delta(totalClients, prevClients),
      d_licensed: delta(licensed, prevLicensed),
      d_active: delta(active, prevActive),
      d_inactive: delta(inactive, prevInactive),
      d_adoption: delta(adoptionRate, prevAdoption),
      // Revenue
      totalARR, totalMRR, nrr, grr, expansionARR, churnARR, overdueAccounts, renewals90,
      // Adoption
      activationRate, noDataPct, staleDevicePct, permOffPct,
      // Engagement
      avgSessions, featureBreadth, dauMau, avgHealth,
      d_sessions: delta(avgSessions, prevSessions),
      d_health: delta(avgHealth, prevHealth),
      // Risk
      recoveryPct, churnRiskARR, avgResolution, escalationRate,
      isLeadership: user.role !== 'csm',
      // For export
      kpiRows: [
        { metric: 'Total Clients', value: totalClients },
        { metric: 'Licensed Users', value: licensed },
        { metric: 'Active Users', value: active },
        { metric: 'Inactive Users', value: inactive },
        { metric: 'Adoption Rate %', value: adoptionRate.toFixed(1) },
        { metric: 'Total ARR', value: totalARR },
        { metric: 'Total MRR', value: totalMRR },
        { metric: 'NRR %', value: nrr.toFixed(1) },
        { metric: 'GRR %', value: grr.toFixed(1) },
        { metric: 'Overdue Accounts', value: overdueAccounts },
        { metric: 'Renewals in 90 Days', value: renewals90 },
        { metric: 'Avg Health Score', value: avgHealth.toFixed(1) },
        { metric: 'Recovery Portfolio %', value: recoveryPct.toFixed(1) },
        { metric: 'Churn Risk ARR', value: churnRiskARR },
        { metric: 'Avg Resolution Hours', value: avgResolution.toFixed(0) },
        { metric: 'Escalation Rate %', value: escalationRate.toFixed(1) },
      ],
    };
  }, [filters, user]);

  const handleExport = () => {
    const csv = buildCSV(['metric', 'value'], data.kpiRows as unknown as Record<string, unknown>[], filters, 'Executive KPIs');
    downloadCSV(csv, `executive_kpi_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>
      {/* Portfolio Scale */}
      <SectionCard title="Portfolio Scale">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard label="Total Clients" value={fmtNum(data.totalClients)} delta={data.d_clients} />
          <KPICard label="Licensed Users" value={fmtNum(data.licensed)} delta={data.d_licensed} />
          <KPICard label="Active Users" value={fmtNum(data.active)} delta={data.d_active} />
          <KPICard label="Inactive Users" value={fmtNum(data.inactive)} delta={data.d_inactive} />
          <KPICard
            label="Adoption Rate"
            value={fmtPct(data.adoptionRate)}
            delta={data.d_adoption}
            colorBand={colorBand(data.adoptionRate, { red: 50, amber: 70, higherIsBetter: true })}
          />
        </div>
      </SectionCard>

      {/* Revenue & Commercial Health */}
      <SectionCard title="Revenue & Commercial Health">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KPICard label="Total ARR" value={fmtCurrency(data.totalARR, true)} subtitle={`MRR: ${fmtCurrency(data.totalMRR, true)}`} />
          <KPICard
            label="Net Revenue Retention"
            value={fmtPct(data.nrr)}
            colorBand={colorBand(data.nrr, { red: 100, amber: 110, higherIsBetter: true })}
          />
          <KPICard
            label="Gross Revenue Retention"
            value={fmtPct(data.grr)}
            colorBand={colorBand(data.grr, { red: 85, amber: 90, higherIsBetter: true })}
          />
          <KPICard label="Expansion ARR" value={fmtCurrency(data.expansionARR, true)} />
          <KPICard
            label="Churn ARR"
            value={fmtCurrency(data.churnARR, true)}
            colorBand={data.churnARR > 0 ? 'red' : 'neutral'}
          />
          <KPICard
            label="Overdue Accounts"
            value={fmtNum(data.overdueAccounts)}
            colorBand={data.overdueAccounts > 0 ? 'red' : 'neutral'}
          />
          <KPICard
            label="Renewals in 90 Days"
            value={fmtNum(data.renewals90)}
            colorBand={data.renewals90 > 0 ? 'amber' : 'neutral'}
          />
        </div>
      </SectionCard>

      {/* Adoption & Onboarding */}
      <SectionCard title="Adoption & Onboarding">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard
            label="Activation Rate"
            value={fmtPct(data.activationRate)}
            colorBand={colorBand(data.activationRate, { red: 70, amber: 85, higherIsBetter: true })}
          />
          <KPICard
            label="No Data Users %"
            value={fmtPct(data.noDataPct)}
            colorBand={colorBand(data.noDataPct, { red: 10, amber: 5, higherIsBetter: false })}
          />
          <KPICard
            label="Stale Device %"
            value={fmtPct(data.staleDevicePct)}
            colorBand={colorBand(data.staleDevicePct, { red: 15, amber: 10, higherIsBetter: false })}
          />
          <KPICard
            label="Permission Off %"
            value={fmtPct(data.permOffPct)}
            colorBand={colorBand(data.permOffPct, { red: 10, amber: 5, higherIsBetter: false })}
          />
        </div>
      </SectionCard>

      {/* Engagement Quality */}
      <SectionCard title="Engagement Quality">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KPICard
            label="Avg Sessions / Active User"
            value={data.avgSessions.toFixed(1)}
            delta={data.d_sessions}
            colorBand={colorBand(data.avgSessions, { red: 2, amber: 3, higherIsBetter: true })}
          />
          <KPICard
            label="Feature Adoption Breadth %"
            value={fmtPct(data.featureBreadth)}
            colorBand={colorBand(data.featureBreadth, { red: 40, amber: 60, higherIsBetter: true })}
          />
          <KPICard
            label="DAU / MAU Ratio"
            value={fmtPct(data.dauMau)}
            colorBand={colorBand(data.dauMau, { red: 20, amber: 30, higherIsBetter: true })}
          />
          <KPICard
            label="Composite Health Score"
            value={data.avgHealth.toFixed(0)}
            delta={data.d_health}
            colorBand={colorBand(data.avgHealth, { red: 65, amber: 75, higherIsBetter: true })}
          />
        </div>
      </SectionCard>

      {/* Portfolio Risk & CSM Operations - Leadership only */}
      {data.isLeadership && (
        <SectionCard title="Portfolio Risk & CSM Operations">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <KPICard
              label="% Portfolio in Recovery"
              value={fmtPct(data.recoveryPct)}
              colorBand={colorBand(data.recoveryPct, { red: 15, amber: 10, higherIsBetter: false })}
            />
            <KPICard label="Churn Risk ARR" value={fmtCurrency(data.churnRiskARR, true)} colorBand={data.churnRiskARR > 0 ? 'amber' : 'neutral'} />
            <KPICard
              label="Avg Resolution Time (hrs)"
              value={data.avgResolution.toFixed(0)}
              colorBand={colorBand(data.avgResolution, { red: 48, amber: 36, higherIsBetter: false })}
            />
            <KPICard
              label="Escalation Rate %"
              value={fmtPct(data.escalationRate)}
              colorBand={colorBand(data.escalationRate, { red: 5, amber: 3, higherIsBetter: false })}
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
