import React, { useState, useMemo } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { clients, healthSnapshots, userActivity, contracts } from '../../data/mock';
import { driverReports } from '../../data/driverReport';
import { buildCSV, downloadCSV } from '../../utils/exportHelpers';
import type { GlobalFilters } from '../../types';

interface ReportModalProps {
  onClose: () => void;
}

const SECTIONS = [
  { id: 'executive', label: 'Executive KPIs Summary' },
  { id: 'adoption', label: 'Adoption & Usage Stats' },
  { id: 'behaviours', label: 'At-Risk Behaviour Summary' },
  { id: 'top10', label: 'Top 10 At-Risk Drivers Table' },
  { id: 'scores', label: 'Driving Score Distribution' },
  { id: 'health', label: 'Health & Risk Summary' },
  { id: 'commercial', label: 'Commercial Overview' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export function ReportModal({ onClose }: ReportModalProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedSections, setSelectedSections] = useState<Set<SectionId>>(
    new Set(['executive', 'adoption', 'behaviours', 'top10', 'scores'])
  );
  const [generating, setGenerating] = useState(false);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.client_name.localeCompare(b.client_name)),
    []
  );

  const toggleSection = (id: SectionId) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clientName = clients.find(c => c.client_id === selectedClient)?.client_name || 'All Clients';

  const handleExportCSV = () => {
    if (!selectedClient) return;

    const mockFilters: GlobalFilters = {
      dateRange: { start: `${selectedMonth}-01`, end: `${selectedMonth}-28` },
      clients: [selectedClient],
      regions: [],
      countries: [],
      csmOwner: '',
      businessUnits: [],
      selectedClientId: selectedClient,
    };

    // 1. Driver report CSV
    const driverRows = driverReports
      .filter(d => d.client_id === selectedClient && d.month === selectedMonth)
      .map(d => ({
        employee_name: d.employee_name,
        hierarchy: d.hierarchy,
        distance: d.distance,
        avg_speed: d.avg_speed,
        max_speed: d.max_speed,
        trips: d.trips,
        ph_call: d.ph_call,
        ph_screen: d.ph_screen,
        ph: d.ph,
        ha: d.ha,
        hb: d.hb,
        hc: d.hc,
        os: d.os,
        driving_score: d.driving_score,
      }));
    const driverCols = ['employee_name', 'hierarchy', 'distance', 'avg_speed', 'max_speed', 'trips', 'ph_call', 'ph_screen', 'ph', 'ha', 'hb', 'hc', 'os', 'driving_score'];
    const csv1 = buildCSV(driverCols, driverRows as Record<string, unknown>[], mockFilters, `Driver Report - ${clientName} - ${selectedMonth}`);
    downloadCSV(csv1, `driver_report_${selectedClient}_${selectedMonth}.csv`);

    // 2. Health snapshot CSV
    const healthRows = healthSnapshots
      .filter(h => h.client_id === selectedClient && h.month === selectedMonth)
      .map(h => ({ month: h.month, health_score: h.health_score, attach_rate: h.attach_rate }));
    if (healthRows.length > 0) {
      const healthCols = ['month', 'health_score', 'attach_rate'];
      const csv2 = buildCSV(healthCols, healthRows as Record<string, unknown>[], mockFilters, `Health Snapshot - ${clientName} - ${selectedMonth}`);
      setTimeout(() => downloadCSV(csv2, `health_snapshot_${selectedClient}_${selectedMonth}.csv`), 300);
    }

    // 3. Activity/adoption CSV
    const activityRows = userActivity
      .filter(u => u.client_id === selectedClient && u.month === selectedMonth)
      .map(u => ({
        month: u.month,
        licensed_users: u.licensed_users,
        active_users: u.active_users,
        activated_users: u.activated_users,
        no_data_users: u.no_data_users,
        stale_device_users: u.stale_device_users,
        permission_off_users: u.permission_off_users,
        sessions_per_active_user: u.sessions_per_active_user,
        feature_adoption_pct: u.feature_adoption_pct,
        dau: u.dau,
      }));
    if (activityRows.length > 0) {
      const actCols = ['month', 'licensed_users', 'active_users', 'activated_users', 'no_data_users', 'stale_device_users', 'permission_off_users', 'sessions_per_active_user', 'feature_adoption_pct', 'dau'];
      const csv3 = buildCSV(actCols, activityRows as Record<string, unknown>[], mockFilters, `Adoption Stats - ${clientName} - ${selectedMonth}`);
      setTimeout(() => downloadCSV(csv3, `adoption_stats_${selectedClient}_${selectedMonth}.csv`), 600);
    }

    // 4. Commercial CSV
    const commercialRows = contracts
      .filter(c => c.client_id === selectedClient)
      .map(c => ({
        arr: c.arr,
        mrr: c.mrr,
        billing_cycle: c.billing_cycle,
        invoice_status: c.invoice_status,
        renewal_date: c.renewal_date,
        days_to_renewal: c.days_to_renewal,
        payment_risk_flag: c.payment_risk_flag,
      }));
    if (commercialRows.length > 0) {
      const commCols = ['arr', 'mrr', 'billing_cycle', 'invoice_status', 'renewal_date', 'days_to_renewal', 'payment_risk_flag'];
      const csv4 = buildCSV(commCols, commercialRows as Record<string, unknown>[], mockFilters, `Commercial Overview - ${clientName}`);
      setTimeout(() => downloadCSV(csv4, `commercial_${selectedClient}_${selectedMonth}.csv`), 900);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedClient) {
      alert('Please select a client first.');
      return;
    }
    setGenerating(true);
    try {
      const { generatePDF } = await import('../../utils/pdfGenerator');
      await generatePDF({
        clientId: selectedClient,
        clientName,
        month: selectedMonth,
        sections: selectedSections,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Generate Monthly Report</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Select Client *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
            >
              <option value="">— Choose a client —</option>
              {sortedClients.map(c => (
                <option key={c.client_id} value={c.client_id}>{c.client_name}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Select Month</label>
            <input
              type="month"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            />
          </div>

          {/* Sections */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Sections to Include</label>
            <div className="space-y-2">
              {SECTIONS.map(section => (
                <label key={section.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSections.has(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{section.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!selectedClient}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={!selectedClient || generating}
              className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors"
            >
              <FileText size={14} />
              {generating ? 'Generating...' : 'Generate PDF Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
