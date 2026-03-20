import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Shield, FileText, User, ChevronDown, X } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { clients } from '../../data/mock';
import { ReportModal } from '../ReportModal/index';

const PRESETS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '12M', months: 12 },
  { label: 'All', months: null },
];

export function TopBar() {
  const { filters, setFilters } = useFilters();
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const comboRef = useRef<HTMLDivElement>(null);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.client_name.localeCompare(b.client_name)),
    []
  );

  const filteredClients = useMemo(
    () => sortedClients.filter(c =>
      c.client_name.toLowerCase().includes(clientSearch.toLowerCase())
    ),
    [sortedClients, clientSearch]
  );

  const selectedClientName = useMemo(
    () => clients.find(c => c.client_id === filters.selectedClientId)?.client_name || 'All Clients',
    [filters.selectedClientId]
  );

  // Close combobox on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setClientOpen(false);
        setClientSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const applyPreset = (months: number | null) => {
    const end = new Date();
    const start = new Date();
    if (months === null) {
      start.setFullYear(2025);
      start.setMonth(2); // March 2025
      start.setDate(1);
    } else {
      start.setMonth(start.getMonth() - months);
    }
    setFilters({ dateRange: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] } });
  };

  const activePreset = useMemo(() => {
    const end = new Date(filters.dateRange.end);
    const start = new Date(filters.dateRange.start);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (diffMonths <= 1) return '1M';
    if (diffMonths <= 3) return '3M';
    if (diffMonths <= 6) return '6M';
    if (diffMonths <= 12) return '12M';
    return 'All';
  }, [filters.dateRange]);

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Shield size={18} className="text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">SafetyConnect</span>
          <span className="text-gray-400 text-xs hidden lg:block">Customer Success</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          {/* Client combobox */}
          <div ref={comboRef} className="relative">
            <button
              onClick={() => { setClientOpen(o => !o); setClientSearch(''); }}
              className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-blue-400 focus:outline-none min-w-[180px] max-w-[220px] justify-between"
            >
              <span className="truncate text-gray-800">{selectedClientName}</span>
              <div className="flex items-center gap-1 shrink-0">
                {filters.selectedClientId && (
                  <span
                    className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
                    onClick={e => { e.stopPropagation(); setFilters({ selectedClientId: '' }); }}
                  >
                    <X size={12} />
                  </span>
                )}
                <ChevronDown size={12} className="text-gray-400" />
              </div>
            </button>

            {clientOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 border-b border-gray-100">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${!filters.selectedClientId ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                    onClick={() => { setFilters({ selectedClientId: '' }); setClientOpen(false); setClientSearch(''); }}
                  >
                    All Clients
                  </button>
                  {filteredClients.map(c => (
                    <button
                      key={c.client_id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${filters.selectedClientId === c.client_id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                      onClick={() => { setFilters({ selectedClientId: c.client_id }); setClientOpen(false); setClientSearch(''); }}
                    >
                      {c.client_name}
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-3 py-3 text-xs text-gray-400 text-center">No clients found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date range presets + pickers */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.months)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activePreset === p.label ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-32"
              value={filters.dateRange.start}
              onChange={e => setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })}
            />
            <span className="text-xs text-gray-400">–</span>
            <input
              type="date"
              className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-32"
              value={filters.dateRange.end}
              onChange={e => setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })}
            />
          </div>

          {/* Logged-in user */}
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <User size={12} className="text-gray-400" />
            <span className="text-xs text-gray-700">{user.name}</span>
          </div>

          {/* Generate Report */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <FileText size={13} />
            Report
          </button>
        </div>
      </div>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </>
  );
}
