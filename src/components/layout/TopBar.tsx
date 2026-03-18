import React, { useMemo, useState } from 'react';
import { Shield, FileText } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { clients } from '../../data/mock';
import { ReportModal } from '../ReportModal/index';

export function TopBar() {
  const { filters, setFilters } = useFilters();
  const [showReport, setShowReport] = useState(false);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.client_name.localeCompare(b.client_name)),
    []
  );

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          <span className="font-semibold text-gray-900">SafetyConnect</span>
          <span className="text-gray-400 text-sm">Customer Success Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Client dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Client</label>
            <select
              className="text-sm border border-gray-200 rounded px-3 py-1.5 min-w-[200px] bg-white focus:outline-none focus:border-blue-400"
              value={filters.selectedClientId}
              onChange={e => setFilters({ selectedClientId: e.target.value })}
            >
              <option value="">All Clients</option>
              {sortedClients.map(c => (
                <option key={c.client_id} value={c.client_id}>{c.client_name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Date Range</label>
            <input
              type="date"
              className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
              value={filters.dateRange.start}
              onChange={e => setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })}
            />
            <span className="text-xs text-gray-400">–</span>
            <input
              type="date"
              className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
              value={filters.dateRange.end}
              onChange={e => setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })}
            />
          </div>

          {/* Generate Report button */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <FileText size={13} />
            Generate Report
          </button>
        </div>
      </div>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </>
  );
}
