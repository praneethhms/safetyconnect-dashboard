import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertBadge } from '../common/AlertBadge';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { getFilteredClients } from '../../utils/filterEngine';
import { contracts, healthSnapshots, supportMetrics } from '../../data/mock';

export function TabNav() {
  const { user } = useAuth();
  const { filters } = useFilters();

  const alertCounts = useMemo(() => {
    const filtered = getFilteredClients(filters, user);
    const ids = new Set(filtered.map(c => c.client_id));
    const myContracts = contracts.filter(c => ids.has(c.client_id));
    const latestHealth = healthSnapshots.filter(h => h.month === '2026-03' && ids.has(h.client_id));
    const mySupport = supportMetrics.filter(s => ids.has(s.client_id));

    return {
      executive: 0,
      commercial: myContracts.filter(c => c.invoice_status === 'Overdue' || c.days_to_renewal <= 30).length,
      health: latestHealth.filter(h => h.health_score < 50).length,
      adoption: latestHealth.filter(h => h.active_pct < 50).length,
      actions: mySupport.reduce((s, m) => s + m.escalation_count, 0),
      trends: 0,
    };
  }, [filters, user]);

  const tabs = [
    { path: '/executive', label: 'Executive KPIs', key: 'executive' as const },
    { path: '/commercial', label: 'Commercial', key: 'commercial' as const },
    { path: '/health', label: 'Health & Risk', key: 'health' as const },
    { path: '/adoption', label: 'Adoption & Usage', key: 'adoption' as const },
    { path: '/actions', label: 'Action Centre', key: 'actions' as const },
    { path: '/trends', label: 'Trends & Analytics', key: 'trends' as const },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6">
      <nav className="flex gap-0">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `relative px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            {tab.label}
            <AlertBadge count={alertCounts[tab.key]} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
