import React from 'react';
import { X } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { clients } from '../../data/mock';

export function GlobalFilterBar() {
  const { filters, setFilters } = useFilters();
  const { selectedClientId } = filters;

  if (!selectedClientId) return null;

  const client = clients.find(c => c.client_id === selectedClientId);
  if (!client) return null;

  const tierColors: Record<string, string> = {
    Enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
    'Mid-Market': 'bg-blue-100 text-blue-700 border-blue-200',
    SMB: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 text-sm">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="font-semibold text-blue-900">{client.client_name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tierColors[client.tier] || 'bg-gray-100 text-gray-600'}`}>
          {client.tier}
        </span>
        <span className="text-blue-600 text-xs">{client.region} · {client.country}</span>
        <span className="text-blue-400 text-xs">CSM: {client.csm_owner}</span>
        <span className="text-blue-400 text-xs">BU: {client.business_unit}</span>
      </div>
      <button
        onClick={() => setFilters({ selectedClientId: '' })}
        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
}
