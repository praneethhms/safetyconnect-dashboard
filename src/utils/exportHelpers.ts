import type { GlobalFilters } from '../types';
import type { RefObject } from 'react';

export function buildCSV(columns: string[], rows: Record<string, unknown>[], filters: GlobalFilters, title: string): string {
  const filterLines = [
    `# ${title}`,
    `# Generated: ${new Date().toLocaleString()}`,
    `# Filters: Date ${filters.dateRange.start} to ${filters.dateRange.end}`,
    filters.selectedClientId ? `# Client: ${filters.selectedClientId}` : '',
    '',
    columns.join(','),
  ].filter(Boolean);

  const dataRows = rows.map(r => columns.map(c => {
    const v = r[c];
    const s = v == null ? '' : String(v);
    return s.includes(',') ? `"${s}"` : s;
  }).join(','));

  return [...filterLines, ...dataRows].join('\n');
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadChartAsPNG(chartRef: RefObject<HTMLDivElement>, filename: string) {
  const container = chartRef.current;
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;

  const rect = svg.getBoundingClientRect();
  const w = rect.width || 600;
  const h = rect.height || 300;

  // Clone so we can inline styles for proper rendering
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const canvas = document.createElement('canvas');
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) { URL.revokeObjectURL(url); return; }
  ctx.scale(2, 2);

  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const a = document.createElement('a');
    a.download = `${filename}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
