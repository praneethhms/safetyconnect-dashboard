import React, { createContext, useContext, useState, useCallback } from 'react';
import type { GlobalFilters } from '../types';

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

const DEFAULT_FILTERS: GlobalFilters = {
  dateRange: getDefaultDateRange(),
  clients: [],
  regions: [],
  countries: [],
  csmOwner: '',
  businessUnits: [],
  selectedClientId: '',
};

interface FilterContextType {
  filters: GlobalFilters;
  setFilters: (f: Partial<GlobalFilters>) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(() => {
    try {
      const saved = localStorage.getItem('sc_filters');
      if (saved) {
        const parsed = JSON.parse(saved) as GlobalFilters;
        // Ensure new field exists for existing saved state
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch { /* ignore */ }
    return DEFAULT_FILTERS;
  });

  const setFilters = useCallback((updates: Partial<GlobalFilters>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('sc_filters', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    const fresh = { ...DEFAULT_FILTERS, dateRange: getDefaultDateRange() };
    localStorage.setItem('sc_filters', JSON.stringify(fresh));
    setFiltersState(fresh);
  }, []);

  return <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
