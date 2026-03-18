import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  colorBand?: 'green' | 'amber' | 'red' | 'neutral';
  subtitle?: string;
}

export function KPICard({ label, value, delta, deltaLabel, colorBand = 'neutral', subtitle }: KPICardProps) {
  const borderColor = {
    green: 'border-l-green-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    neutral: 'border-l-gray-200',
  }[colorBand];

  const deltaColor = delta == null ? '' : delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500';
  const DeltaIcon = delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 border-l-4 ${borderColor} p-4 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {(delta != null || deltaLabel) && (
        <div className={`mt-1 flex items-center gap-1 text-xs ${deltaColor}`}>
          {DeltaIcon && <DeltaIcon size={12} />}
          <span>{delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%` : ''} {deltaLabel || 'vs prior period'}</span>
        </div>
      )}
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
