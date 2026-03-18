export function fmtCurrency(val: number, compact = false): string {
  if (compact && val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (compact && val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

export function fmtPct(val: number, decimals = 1): string {
  return `${val.toFixed(decimals)}%`;
}

export function fmtNum(val: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(val));
}

export function colorBand(val: number, threshold: { red: number; amber: number; higherIsBetter: boolean }): 'green' | 'amber' | 'red' | 'neutral' {
  if (threshold.higherIsBetter) {
    if (val >= threshold.amber) return 'green';
    if (val >= threshold.red) return 'amber';
    return 'red';
  } else {
    if (val <= threshold.amber) return 'green';
    if (val <= threshold.red) return 'amber';
    return 'red';
  }
}
