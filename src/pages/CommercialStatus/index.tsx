import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { Download } from 'lucide-react';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusPill } from '../../components/common/StatusPill';
import { AccountDrawer } from '../../components/AccountDrawer/index';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { getFilteredClients } from '../../utils/filterEngine';
import { clients as allClients, contracts } from '../../data/mock';
import { fmtCurrency, fmtNum } from '../../utils/formatters';
import { buildCSV, downloadCSV } from '../../utils/exportHelpers';

type SortCol = 'client' | 'arr' | 'billing_cycle' | 'invoice_status' | 'days_to_renewal' | 'risk';
type SortDir = 'asc' | 'desc';

export function CommercialStatus() {
  const { filters } = useFilters();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('days_to_renewal');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);

  const data = useMemo(() => {
    const filtered = getFilteredClients(filters, user);
    const ids = new Set(filtered.map(c => c.client_id));
    const myContracts = contracts.filter(c => ids.has(c.client_id));
    const clientMap = new Map(allClients.map(c => [c.client_id, { name: c.client_name, id: c.client_id }]));

    const paid = myContracts.filter(c => c.invoice_status === 'Paid').length;
    const pending = myContracts.filter(c => c.invoice_status === 'Pending').length;
    const overdue = myContracts.filter(c => c.invoice_status === 'Overdue').length;

    // Renewals by month (next 12 months), ARR-weighted
    const renewalsByMonth: Record<string, { count: number; arr: number }> = {};
    for (let m = 0; m < 12; m++) {
      const d = new Date(2026, 3 + m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      renewalsByMonth[key] = { count: 0, arr: 0 };
    }
    myContracts.forEach(c => {
      const k = c.renewal_date.slice(0, 7);
      if (renewalsByMonth[k]) {
        renewalsByMonth[k].count++;
        renewalsByMonth[k].arr += c.arr;
      }
    });
    const renewalData = Object.entries(renewalsByMonth).map(([month, v]) => ({
      month: month.slice(5),
      count: v.count,
      arr: Math.round(v.arr / 1000), // in $K
    }));

    const tableData = myContracts.map(c => ({
      client_id: c.client_id,
      client: clientMap.get(c.client_id)?.name || c.client_id,
      arr: c.arr,
      billing_cycle: c.billing_cycle,
      invoice_status: c.invoice_status,
      renewal_date: c.renewal_date,
      days_to_renewal: c.days_to_renewal,
      risk: c.payment_risk_flag,
    }));

    return { paid, pending, overdue, renewalData, tableData, total: myContracts.length };
  }, [filters, user]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filteredSorted = useMemo(() => {
    let rows = data.tableData.filter(r =>
      r.client.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      let av: string | number = a[sortCol] as string | number;
      let bv: string | number = b[sortCol] as string | number;
      if (sortCol === 'risk') { av = a.risk ? 1 : 0; bv = b.risk ? 1 : 0; }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [data.tableData, search, sortCol, sortDir]);

  const urgentRows = filteredSorted.filter(r => r.days_to_renewal < 0 || r.invoice_status === 'Overdue');
  const normalRows = filteredSorted.filter(r => r.days_to_renewal >= 0 && r.invoice_status !== 'Overdue');

  const pieData = [
    { name: 'Paid', value: data.paid, color: '#22c55e' },
    { name: 'Pending', value: data.pending, color: '#f59e0b' },
    { name: 'Overdue', value: data.overdue, color: '#ef4444' },
  ];

  const SortTh = ({ col, label }: { col: SortCol; label: string }) => (
    <th
      onClick={() => handleSort(col)}
      className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
    >
      {label}{sortCol === col && <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );

  const handleExport = () => {
    const cols = ['client', 'arr', 'billing_cycle', 'invoice_status', 'renewal_date', 'days_to_renewal', 'risk'];
    const csv = buildCSV(cols, filteredSorted as unknown as Record<string, unknown>[], filters, 'Commercial Status');
    downloadCSV(csv, `commercial_status_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const RowEl = ({ row }: { row: typeof filteredSorted[0] }) => {
    const dtr = row.days_to_renewal;
    const renewalColor = dtr < 0 ? 'text-red-600 font-semibold' : dtr <= 30 ? 'text-red-500 font-medium' : dtr <= 90 ? 'text-amber-500' : 'text-gray-700';
    return (
      <tr
        className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
        onClick={() => setDrawerClientId(row.client_id)}
      >
        <td className="py-2 px-3 font-medium text-gray-900 truncate max-w-[160px]">{row.client}</td>
        <td className="py-2 px-3 text-gray-700">{fmtCurrency(row.arr, true)}</td>
        <td className="py-2 px-3 text-gray-500">{row.billing_cycle}</td>
        <td className="py-2 px-3">
          <StatusPill status={row.invoice_status === 'Paid' ? 'green' : row.invoice_status === 'Pending' ? 'amber' : 'red'} label={row.invoice_status} />
        </td>
        <td className="py-2 px-3 text-gray-700">{row.renewal_date}</td>
        <td className={`py-2 px-3 ${renewalColor}`}>{dtr < 0 ? `Expired ${Math.abs(dtr)}d ago` : `${dtr}d`}</td>
        <td className="py-2 px-3">{row.risk && <StatusPill status="red" label="At Risk" />}</td>
      </tr>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Invoice Status Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around mt-2 text-sm">
            <span className="text-green-600 font-medium">{data.paid} Paid</span>
            <span className="text-amber-600 font-medium">{data.pending} Pending</span>
            <span className="text-red-600 font-medium">{data.overdue} Overdue</span>
          </div>
        </SectionCard>

        <SectionCard title="Renewals by Month — Count & ARR at Risk ($K)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.renewalData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}K`} />
              <Tooltip formatter={(v, name) => name === 'arr' ? [`$${v}K`, 'ARR at Risk'] : [v, 'Renewals']} />
              <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Renewals" radius={[2, 2, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#374151' }} />
              </Bar>
              <Bar yAxisId="right" dataKey="arr" fill="#8b5cf680" name="ARR $K" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Urgent section */}
      {urgentRows.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-semibold text-red-800">Urgent — {urgentRows.length} account{urgentRows.length > 1 ? 's' : ''} require immediate attention</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-200">
                  {['Client', 'ARR', 'Invoice', 'Renewal', 'Issue'].map(h => (
                    <th key={h} className="text-left py-1.5 px-3 text-xs font-medium text-red-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {urgentRows.map((row, i) => (
                  <tr key={i} className="border-b border-red-100 hover:bg-red-100 cursor-pointer" onClick={() => setDrawerClientId(row.client_id)}>
                    <td className="py-1.5 px-3 font-medium text-red-900">{row.client}</td>
                    <td className="py-1.5 px-3 text-red-800">{fmtCurrency(row.arr, true)}</td>
                    <td className="py-1.5 px-3">
                      <StatusPill status={row.invoice_status === 'Paid' ? 'green' : row.invoice_status === 'Pending' ? 'amber' : 'red'} label={row.invoice_status} />
                    </td>
                    <td className="py-1.5 px-3 text-red-700 font-medium">
                      {row.days_to_renewal < 0 ? `Expired ${Math.abs(row.days_to_renewal)}d ago` : `${row.days_to_renewal}d`}
                    </td>
                    <td className="py-1.5 px-3 text-xs text-red-600 font-medium">
                      {row.days_to_renewal < 0 ? 'Contract expired' : row.invoice_status === 'Overdue' ? 'Invoice overdue' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SectionCard title={`All Accounts (${fmtNum(filteredSorted.length)} of ${fmtNum(data.total)})`}>
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
                <SortTh col="client" label="Client" />
                <SortTh col="arr" label="ARR" />
                <SortTh col="billing_cycle" label="Billing" />
                <SortTh col="invoice_status" label="Invoice" />
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Renewal Date</th>
                <SortTh col="days_to_renewal" label="Days to Renewal" />
                <SortTh col="risk" label="Risk" />
              </tr>
            </thead>
            <tbody>
              {normalRows.map((row, i) => <RowEl key={i} row={row} />)}
            </tbody>
          </table>
          {filteredSorted.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No accounts match your search.</div>
          )}
        </div>
      </SectionCard>

      {drawerClientId && <AccountDrawer clientId={drawerClientId} onClose={() => setDrawerClientId(null)} />}
    </div>
  );
}
