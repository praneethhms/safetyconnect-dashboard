// All months available in mock data
const ALL_DATA_MONTHS = [
  '2025-03','2025-04','2025-05','2025-06','2025-07','2025-08',
  '2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03',
];

export function getMonthsInRange(dateRange: { start: string; end: string }): string[] {
  const start = dateRange.start.slice(0, 7);
  const end = dateRange.end.slice(0, 7);
  const result = ALL_DATA_MONTHS.filter(m => m >= start && m <= end);
  return result.length ? result : [ALL_DATA_MONTHS[ALL_DATA_MONTHS.length - 1]];
}

export function getLatestMonth(dateRange: { start: string; end: string }): string {
  const months = getMonthsInRange(dateRange);
  return months[months.length - 1];
}

export function getPriorMonth(dateRange: { start: string; end: string }): string {
  const latest = getLatestMonth(dateRange);
  const idx = ALL_DATA_MONTHS.indexOf(latest);
  return idx > 0 ? ALL_DATA_MONTHS[idx - 1] : ALL_DATA_MONTHS[0];
}

export function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
}
