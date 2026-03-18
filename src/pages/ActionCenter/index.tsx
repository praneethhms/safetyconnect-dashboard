import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { SectionCard } from '../../components/common/SectionCard';
import { useFilters } from '../../context/FilterContext';
import { deviceStatusRows } from '../../data/mock';
import { buildCSV, downloadCSV } from '../../utils/exportHelpers';

type TableKey = 'active' | 'inactive' | 'nodata' | 'permission' | 'stale' | 'intervention';

const TABLE_LABELS: Record<TableKey, string> = {
  active: 'Active Users',
  inactive: 'Inactive Users',
  nodata: 'No Data Users',
  permission: 'Permission Off',
  stale: 'Stale Devices',
  intervention: 'Intervention Targets',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB');
}

function ClientRequired() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-600">Please select a client to view this data</p>
      <p className="text-sm text-gray-400 mt-1">Use the Client dropdown in the top bar</p>
    </div>
  );
}

export function ActionCenter() {
  const { filters } = useFilters();
  const [activeTable, setActiveTable] = useState<TableKey>('inactive');
  const [inactiveDays, setInactiveDays] = useState(30);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string>('days_inactive');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const selectedClientId = filters.selectedClientId;

  const filteredUsers = useMemo(() => {
    if (!selectedClientId) return [];
    return deviceStatusRows.filter(d => d.client_id === selectedClientId);
  }, [selectedClientId]);

  const tables: Record<TableKey, typeof filteredUsers> = useMemo(() => ({
    active: filteredUsers.filter(u => u.total_events > 0 && (u.days_inactive == null || u.days_inactive < 30)),
    inactive: filteredUsers.filter(u => u.days_inactive != null && u.days_inactive >= inactiveDays),
    nodata: filteredUsers.filter(u => u.total_events === 0),
    permission: filteredUsers.filter(u => !u.permissions_ok),
    stale: filteredUsers.filter(u => u.days_since_sync >= 14),
    // Fixed intervention logic: users who have had some activity but are sliding
    intervention: filteredUsers.filter(u =>
      u.total_events > 0 && // had activity before
      u.days_inactive != null &&
      u.days_inactive >= 7 && // inactive at least 7 days
      u.days_inactive < 60   // but not completely gone (those are in inactive)
    ),
  }), [filteredUsers, inactiveDays]);

  const colConfigs: Record<TableKey, string[]> = {
    active: ['user_id', 'user_name', 'region', 'hierarchy_level', 'last_activity_date', 'total_events'],
    inactive: ['user_id', 'user_name', 'region', 'hierarchy_level', 'last_activity_date', 'days_inactive'],
    nodata: ['user_id', 'user_name', 'region', 'activated_date', 'device_model'],
    permission: ['user_id', 'user_name', 'region', 'permission_type_disabled', 'permission_disabled_date'],
    stale: ['user_id', 'user_name', 'region', 'device_model', 'app_version', 'last_sync_date', 'days_since_sync'],
    intervention: ['user_id', 'user_name', 'region', 'total_events', 'days_inactive', 'hierarchy_level'],
  };

  const NUMERIC_COLS = new Set(['days_inactive', 'days_since_sync', 'total_events']);

  const currentRows = tables[activeTable];
  const cols = colConfigs[activeTable];

  const displayRows = useMemo(() => {
    let rows = currentRows.filter(r =>
      (r.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.user_id || '').toLowerCase().includes(search.toLowerCase())
    );
    if (NUMERIC_COLS.has(sortCol)) {
      rows = [...rows].sort((a, b) => {
        const av = ((a as unknown as Record<string, unknown>)[sortCol] as number) ?? -1;
        const bv = ((b as unknown as Record<string, unknown>)[sortCol] as number) ?? -1;
        return sortDir === 'desc' ? bv - av : av - bv;
      });
    }
    return rows;
  }, [currentRows, search, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (!NUMERIC_COLS.has(col)) return;
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const handleExport = () => {
    const csv = buildCSV(cols, displayRows as unknown as Record<string, unknown>[], filters, `${TABLE_LABELS[activeTable]} Export`);
    downloadCSV(csv, `${activeTable}_users_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Date range indicator */}
      <div className="inline-flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-3 py-2">
        <span className="font-medium">Showing:</span>
        <span>{formatDate(filters.dateRange.start)} – {formatDate(filters.dateRange.end)}</span>
      </div>

      {!selectedClientId ? (
        <ClientRequired />
      ) : (
        <>
          {/* Tab switcher */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TABLE_LABELS) as TableKey[]).map(key => (
              <button
                key={key}
                onClick={() => { setActiveTable(key); setSearch(''); setSortCol(key === 'intervention' ? 'days_inactive' : key === 'stale' ? 'days_since_sync' : 'total_events'); setSortDir('desc'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeTable === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {TABLE_LABELS[key]}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeTable === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {tables[key].length}
                </span>
              </button>
            ))}
          </div>

          <SectionCard title={`${TABLE_LABELS[activeTable]} — Showing ${displayRows.length} of ${currentRows.length} users`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 w-52"
                />
                {activeTable === 'inactive' && (
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-gray-500 text-xs whitespace-nowrap">Inactive ≥</label>
                    <input
                      type="range" min={7} max={90} value={inactiveDays} step={7}
                      onChange={e => setInactiveDays(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-xs font-medium text-gray-700 w-12">{inactiveDays} days</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50"
              >
                <Download size={12} />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {cols.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className={`text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap ${NUMERIC_COLS.has(col) ? 'cursor-pointer hover:text-gray-800 select-none' : ''}`}
                      >
                        {col.replace(/_/g, ' ')}
                        {NUMERIC_COLS.has(col) && sortCol === col && (
                          <span className="ml-1 text-blue-500">{sortDir === 'desc' ? '▼' : '▲'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      {cols.map(col => {
                        const val = (row as unknown as Record<string, unknown>)[col];
                        const display = val == null ? '—' : String(val);
                        const isRisk =
                          (col === 'days_inactive' && Number(val) >= 60) ||
                          (col === 'days_since_sync' && Number(val) >= 30);
                        return (
                          <td key={col} className={`py-2 px-3 ${isRisk ? 'text-red-600 font-medium' : 'text-gray-700'} truncate max-w-[200px]`}>
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayRows.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No users match the current criteria.</div>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
