import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clients, userActivity, healthSnapshots, contracts } from '../data/mock';
import { driverReports } from '../data/driverReport';

interface GeneratePDFOptions {
  clientId: string;
  clientName: string;
  month: string; // "2026-03"
  sections: Set<string>;
}

function formatMonth(m: string): string {
  const [year, month] = m.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(14, y, doc.internal.pageSize.width - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 18, y + 5.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return y + 14;
}

function drawKPIBox(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number] = [248, 250, 252]
) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), x + 3, y + 5);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 3, y + 13);
  doc.setFont('helvetica', 'normal');
}

function drawSimpleBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; color: [number, number, number] }[]
) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = (w - (data.length - 1) * 4) / data.length;

  data.forEach((item, i) => {
    const bx = x + i * (barW + 4);
    const bh = (item.value / maxVal) * h;
    const by = y + h - bh;
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(bx, by, barW, bh, 'F');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    // value label above bar
    doc.text(String(item.value), bx + barW / 2, by - 1, { align: 'center' });
    // axis label below
    doc.setFontSize(6.5);
    const labelLines = item.label.length > 10 ? [item.label.slice(0, 10), item.label.slice(10)] : [item.label];
    labelLines.forEach((line, li) => {
      doc.text(line, bx + barW / 2, y + h + 4 + li * 3.5, { align: 'center' });
    });
  });
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, ph - 14, pw - 14, ph - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('SafetyConnect | Confidential', 14, ph - 8);
    doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 8, { align: 'right' });
  }
}

export async function generatePDF(options: GeneratePDFOptions) {
  const { clientId, clientName, month, sections } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  let y = 14;

  // ── Cover / Header ──────────────────────────────────────────────────────────
  // Logo placeholder
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, y, 40, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SafetyConnect', 18, y + 9);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Success Report', pw / 2, y + 6, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${clientName}  ·  ${formatMonth(month)}`, pw / 2, y + 13, { align: 'center' });

  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pw - 14, y);
  y += 8;

  // ── Helper to check page space ──────────────────────────────────────────────
  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 14;
    }
  };

  // ── Section 1: Executive KPIs ───────────────────────────────────────────────
  if (sections.has('executive')) {
    ensureSpace(60);
    y = drawSectionHeader(doc, '1. Executive KPIs Summary', y);

    const clientContract = contracts.find(c => c.client_id === clientId);
    const latestActivity = userActivity.find(u => u.client_id === clientId && u.month === month);
    const priorActivity = userActivity.find(u => u.client_id === clientId && u.month === '2026-02');
    const latestHealth = healthSnapshots.find(h => h.client_id === clientId && h.month === month);

    const licensed = latestActivity?.licensed_users ?? 0;
    const active = latestActivity?.active_users ?? 0;
    const priorActive = priorActivity?.active_users ?? 0;
    const adoptionRate = licensed ? ((active / licensed) * 100).toFixed(1) : '0';
    const adoptionDelta = priorActive ? (((active - priorActive) / priorActive) * 100).toFixed(1) : '0';
    const healthScore = latestHealth?.health_score ?? 0;
    const arr = clientContract?.arr ?? 0;
    const arrStr = arr >= 1000000 ? `$${(arr / 1000000).toFixed(1)}M` : arr >= 1000 ? `$${(arr / 1000).toFixed(0)}K` : `$${arr}`;

    const kpiBoxW = (pw - 28 - 12) / 4;
    drawKPIBox(doc, 'ARR', arrStr, 14, y, kpiBoxW, 18);
    drawKPIBox(doc, 'Licensed Users', String(licensed), 14 + kpiBoxW + 4, y, kpiBoxW, 18);
    drawKPIBox(doc, 'Active Users', String(active), 14 + (kpiBoxW + 4) * 2, y, kpiBoxW, 18);
    drawKPIBox(doc, 'Adoption Rate', `${adoptionRate}%`, 14 + (kpiBoxW + 4) * 3, y, kpiBoxW, 18);
    y += 22;

    const kpiBoxW2 = (pw - 28 - 8) / 3;
    drawKPIBox(doc, 'Adoption Change', `${parseFloat(adoptionDelta) > 0 ? '+' : ''}${adoptionDelta}%`, 14, y, kpiBoxW2, 18, parseFloat(adoptionDelta) >= 0 ? [220, 252, 231] : [254, 226, 226]);
    drawKPIBox(doc, 'Health Score', String(healthScore), 14 + kpiBoxW2 + 4, y, kpiBoxW2, 18, healthScore >= 75 ? [220, 252, 231] : healthScore >= 50 ? [254, 243, 199] : [254, 226, 226]);
    drawKPIBox(doc, 'Invoice Status', clientContract?.invoice_status ?? 'N/A', 14 + (kpiBoxW2 + 4) * 2, y, kpiBoxW2, 18, clientContract?.invoice_status === 'Paid' ? [220, 252, 231] : [254, 226, 226]);
    y += 26;
  }

  // ── Section 2: Adoption & Usage ─────────────────────────────────────────────
  if (sections.has('adoption')) {
    ensureSpace(50);
    y = drawSectionHeader(doc, '2. Adoption & Usage Stats', y);

    const months6 = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
    const trendRows = months6.map(m => {
      const a = userActivity.find(u => u.client_id === clientId && u.month === m);
      const licensed = a?.licensed_users ?? 0;
      const active = a?.active_users ?? 0;
      return [
        m.slice(5),
        String(licensed),
        String(a?.activated_users ?? 0),
        String(active),
        licensed ? `${((active / licensed) * 100).toFixed(1)}%` : '0%',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Month', 'Licensed', 'Activated', 'Active', 'Adoption Rate']],
      body: trendRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Section 3: At-Risk Behaviour Summary ────────────────────────────────────
  if (sections.has('behaviours')) {
    ensureSpace(60);
    y = drawSectionHeader(doc, '3. At-Risk Behaviour Summary', y);

    const reports = driverReports.filter(d => d.client_id === clientId && d.month === month);
    const sum = (key: keyof (typeof reports)[0]) => reports.reduce((s, d) => s + (d[key] as number), 0);
    const priorReports = driverReports.filter(d => d.client_id === clientId && d.month === '2026-02');
    const priorSum = (key: keyof (typeof priorReports)[0]) => priorReports.reduce((s, d) => s + (d[key] as number), 0);

    const behaviors = [
      { label: 'Phone Usage', value: sum('ph'), prior: priorSum('ph'), color: [139, 92, 246] as [number, number, number] },
      { label: 'Harsh Accel.', value: sum('ha'), prior: priorSum('ha'), color: [239, 68, 68] as [number, number, number] },
      { label: 'Harsh Braking', value: sum('hb'), prior: priorSum('hb'), color: [249, 115, 22] as [number, number, number] },
      { label: 'Harsh Corner.', value: sum('hc'), prior: priorSum('hc'), color: [234, 179, 8] as [number, number, number] },
      { label: 'Over Speeding', value: sum('os'), prior: priorSum('os'), color: [236, 72, 153] as [number, number, number] },
    ];

    const boxW = (pw - 28 - 16) / 5;
    behaviors.forEach((b, i) => {
      const delta = b.prior ? ((b.value - b.prior) / b.prior * 100).toFixed(1) : '0';
      const improved = parseFloat(delta) <= 0;
      drawKPIBox(doc, b.label, String(b.value), 14 + i * (boxW + 4), y, boxW, 20);
      doc.setFontSize(7);
      doc.setTextColor(improved ? 22 : 185, improved ? 163 : 28, improved ? 74 : 26);
      doc.text(`${parseFloat(delta) > 0 ? '+' : ''}${delta}%`, 14 + i * (boxW + 4) + 3, y + 17);
    });
    y += 26;

    // Simple bar chart
    ensureSpace(45);
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Counts', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    drawSimpleBarChart(doc, 14, y, pw - 28, 28, behaviors.map(b => ({ label: b.label, value: b.value, color: b.color })));
    y += 42;
  }

  // ── Section 4: Top 10 At-Risk Drivers ───────────────────────────────────────
  if (sections.has('top10')) {
    ensureSpace(40);
    y = drawSectionHeader(doc, '4. Top 10 At-Risk Drivers', y);

    const reports = driverReports.filter(d => d.client_id === clientId && d.month === month);
    const top10 = [...reports]
      .map(d => ({ ...d, total: d.ph + d.ha + d.hb + d.hc + d.os }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    autoTable(doc, {
      startY: y,
      head: [['Driver', 'Hierarchy', 'PH', 'HA', 'HB', 'HC', 'OS', 'Total', 'Score']],
      body: top10.map(d => [
        d.employee_name, d.hierarchy, d.ph, d.ha, d.hb, d.hc, d.os,
        d.ph + d.ha + d.hb + d.hc + d.os, d.driving_score,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        8: {
          fontStyle: 'bold',
        },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const score = Number(data.cell.raw);
          data.cell.styles.textColor = score >= 80 ? [22, 163, 74] : score >= 60 ? [161, 98, 7] : [185, 28, 28];
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Section 5: Driving Score Distribution ───────────────────────────────────
  if (sections.has('scores')) {
    ensureSpace(50);
    y = drawSectionHeader(doc, '5. Driving Score Distribution', y);

    const reports = driverReports.filter(d => d.client_id === clientId && d.month === month);
    const green = reports.filter(d => d.driving_score >= 80).length;
    const amber = reports.filter(d => d.driving_score >= 60 && d.driving_score < 80).length;
    const red = reports.filter(d => d.driving_score < 60).length;
    const total = reports.length || 1;

    const scoreData = [
      { label: `Green\n(80-100)`, value: green, color: [34, 197, 94] as [number, number, number] },
      { label: `Amber\n(60-79)`, value: amber, color: [245, 158, 11] as [number, number, number] },
      { label: `Red\n(<60)`, value: red, color: [239, 68, 68] as [number, number, number] },
    ];

    drawSimpleBarChart(doc, 14, y, (pw - 28) / 2, 30, scoreData);

    // Stats on the right
    const rx = 14 + (pw - 28) / 2 + 10;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Summary', rx, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    [
      { label: 'Total Drivers', val: String(reports.length) },
      { label: 'Green Zone', val: `${green} (${Math.round(green / total * 100)}%)` },
      { label: 'Amber Zone', val: `${amber} (${Math.round(amber / total * 100)}%)` },
      { label: 'Red Zone', val: `${red} (${Math.round(red / total * 100)}%)` },
      { label: 'Avg Score', val: reports.length ? (reports.reduce((s, d) => s + d.driving_score, 0) / reports.length).toFixed(1) : 'N/A' },
    ].forEach((row, i) => {
      doc.setTextColor(100, 116, 139);
      doc.text(row.label + ':', rx, y + 12 + i * 6);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(row.val, rx + 30, y + 12 + i * 6);
      doc.setFont('helvetica', 'normal');
    });

    y += 48;
  }

  // ── Footer on all pages ─────────────────────────────────────────────────────
  addFooter(doc);

  // ── Save ────────────────────────────────────────────────────────────────────
  const filename = `SafetyConnect_Report_${clientName.replace(/\s+/g, '_')}_${month}.pdf`;
  doc.save(filename);
}
