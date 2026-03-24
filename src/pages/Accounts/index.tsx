import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Search, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, daysFromNow, daysAgo } from '../../utils/helpers';
import { HealthBadge, SegmentBadge, SolutionTag, UrgencyBadge } from '../../components/common/Badge';
import AccountModal from '../../components/modals/AccountModal';
import EmptyState from '../../components/common/EmptyState';
import { Building2 } from 'lucide-react';
import type { Segment, Health, Solution } from '../../types';

const SEGMENTS: Segment[] = ['Enterprise', 'Mid-Market', 'Growth', 'SMB'];
const HEALTH_OPTIONS: Health[] = ['Healthy', 'At Risk', 'Critical', 'Unknown'];
const ALL_SOLUTIONS: Solution[] = ['App', 'Forklift', 'Vehicle Tracking', 'Shuttle Bus', 'AI Dashboard', 'Process Safety'];

export default function Accounts() {
  const { accounts, activities } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<'card' | 'table'>('card');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState<Segment | ''>('');
  const [filterSolution, setFilterSolution] = useState<Solution | ''>('');
  const [filterHealth, setFilterHealth] = useState<Health | ''>('');

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
      const matchesSegment = !filterSegment || a.segment === filterSegment;
      const matchesSolution = !filterSolution || a.solutions.includes(filterSolution);
      const matchesHealth = !filterHealth || a.health === filterHealth;
      return matchesSearch && matchesSegment && matchesSolution && matchesHealth;
    });
  }, [accounts, search, filterSegment, filterSolution, filterHealth]);

  function lastActivity(accountId: string) {
    const acts = activities.filter((a) => a.accountId === accountId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return acts[0]?.date ?? null;
  }

  function goToAccount(id: string) {
    navigate(`/accounts/${id}`);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">{accounts.length} accounts</p>
        </div>
        <button onClick={() => setShowAddAccount(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value as Segment | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Segments</option>
          {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select value={filterSolution} onChange={(e) => setFilterSolution(e.target.value as Solution | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Solutions</option>
          {ALL_SOLUTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select value={filterHealth} onChange={(e) => setFilterHealth(e.target.value as Health | '')} className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Health</option>
          {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 ml-auto">
          <button onClick={() => setView('card')} className={`p-1.5 rounded ${view === 'card' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}><LayoutGrid size={16} className="text-slate-600" /></button>
          <button onClick={() => setView('table')} className={`p-1.5 rounded ${view === 'table' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}><List size={16} className="text-slate-600" /></button>
        </div>
      </div>

      {(filterSegment || filterSolution || filterHealth || search) && (
        <p className="text-xs text-slate-500">{filtered.length} of {accounts.length} accounts</p>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No accounts found" description="Try adjusting your filters." />
      ) : view === 'card' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((a) => {
            const la = lastActivity(a.id);
            return (
              <div key={a.id} onClick={() => goToAccount(a.id)} className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2">{a.name}</h3>
                  <HealthBadge health={a.health} />
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  <SegmentBadge segment={a.segment} />
                  {a.solutions.map((s) => <SolutionTag key={s} solution={s} />)}
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  {a.location && <p>{a.location}</p>}
                  {a.devices && <p>{a.devices.toLocaleString()} devices</p>}
                  {a.renewalDate && (
                    <div className="flex items-center gap-2 mt-2">
                      <span>Renewal:</span>
                      <UrgencyBadge days={daysFromNow(a.renewalDate)} />
                    </div>
                  )}
                  <p className="text-slate-400">
                    {la ? `Last activity ${daysAgo(la)}d ago` : 'No activity logged'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Account', 'Segment', 'Solutions', 'Location', 'Health', 'Renewal', 'Last Activity'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => {
                const la = lastActivity(a.id);
                return (
                  <tr key={a.id} onClick={() => goToAccount(a.id)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 hover:text-indigo-700">{a.name}</p>
                      {a.primaryContact && <p className="text-xs text-slate-500">{a.primaryContact}</p>}
                    </td>
                    <td className="px-4 py-3"><SegmentBadge segment={a.segment} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.solutions.map((s) => <SolutionTag key={s} solution={s} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.location}</td>
                    <td className="px-4 py-3"><HealthBadge health={a.health} /></td>
                    <td className="px-4 py-3">
                      {a.renewalDate ? <UrgencyBadge days={daysFromNow(a.renewalDate)} /> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {la ? `${daysAgo(la)}d ago` : <span className="text-slate-400">None</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddAccount && <AccountModal isOpen onClose={() => setShowAddAccount(false)} />}
    </div>
  );
}
