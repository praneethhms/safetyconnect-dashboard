import React from 'react';

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  colorBand?: 'green' | 'amber' | 'red' | 'neutral';
  sparkline?: number[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="mt-2">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KPICard({ label, value, subtitle, delta, deltaLabel, colorBand = 'neutral', sparkline }: KPICardProps) {
  const borderColor =
    colorBand === 'green' ? 'border-green-400' :
    colorBand === 'amber' ? 'border-amber-400' :
    colorBand === 'red' ? 'border-red-400' : 'border-gray-200';

  const sparkColor =
    colorBand === 'green' ? '#22c55e' :
    colorBand === 'amber' ? '#f59e0b' :
    colorBand === 'red' ? '#ef4444' : '#3b82f6';

  return (
    <div className={`bg-white rounded-lg border-l-4 ${borderColor} border border-gray-100 p-4 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      {delta !== undefined && (
        <p className={`text-xs mt-1 font-medium ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% {deltaLabel || 'vs prior period'}
        </p>
      )}
      {sparkline && sparkline.length >= 2 && (
        <Sparkline data={sparkline} color={sparkColor} />
      )}
    </div>
  );
}
