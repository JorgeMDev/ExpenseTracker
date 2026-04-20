import { jsPDF } from 'jspdf';

const DARK = [15, 18, 25];
const CARD = [30, 36, 51];
const BRAND = [59, 130, 246];
const PURPLE = [167, 139, 250];
const GREEN = [16, 185, 129];
const AMBER = [245, 158, 11];
const LIGHT = [241, 245, 249];
const MUTED = [148, 163, 184];
const BORDER = [51, 65, 85];

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export function exportTaxReportPDF(taxData, reportData, year) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 0;
    drawBackground();
  };

  const drawBackground = () => {
    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, H, 'F');
  };

  const checkPage = (needed = 20) => {
    if (y + needed > H - 15) addPage();
  };

  // Background
  drawBackground();

  // Header bar
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ExpenseTracker', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tax Report — FY ${year}`, W - 14, 14, { align: 'right' });

  y = 32;

  // Title
  doc.setTextColor(...LIGHT);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${year} Tax Deduction Report`, 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, y);
  y += 12;

  // Divider
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y);
  y += 10;

  // KPI Cards (2x2 grid)
  const kpis = [
    { label: 'Total Expenses', value: fmt(taxData?.totalExpenses || 0), color: BRAND },
    { label: 'Total Deductible', value: fmt(taxData?.totalDeductible || 0), color: PURPLE },
    { label: 'Estimated Tax Savings', value: fmt(taxData?.estimatedTaxSavings || 0), color: GREEN },
    { label: 'Deduction Rate', value: taxData?.totalExpenses ? `${((taxData.totalDeductible / taxData.totalExpenses) * 100).toFixed(1)}%` : '0%', color: AMBER },
  ];

  const cardW = (W - 28 - 6) / 2;
  const cardH = 22;
  kpis.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 14 + col * (cardW + 6);
    const cy = y + row * (cardH + 4);

    doc.setFillColor(...CARD);
    doc.roundedRect(cx, cy, cardW, cardH, 3, 3, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, cardW, cardH, 3, 3, 'S');

    // Accent bar
    doc.setFillColor(...kpi.color);
    doc.roundedRect(cx, cy, 3, cardH, 1.5, 1.5, 'F');

    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, cx + 7, cy + 7);

    doc.setTextColor(...LIGHT);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, cx + 7, cy + 16);
  });

  y += 2 * (cardH + 4) + 10;

  // Section: Category Breakdown
  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Category Breakdown', 14, y);
  y += 8;

  const categories = (reportData?.byCategory || []).filter(c => c.category_type !== 'personal').slice(0, 10);
  const maxVal = categories[0]?.total || 1;
  const BAR_COLORS = [BRAND, PURPLE, GREEN, AMBER, [239, 68, 68], [236, 72, 153], [6, 182, 212], [132, 204, 22]];

  categories.forEach((cat, i) => {
    checkPage(14);
    const barMaxW = W - 28 - 50;
    const barW = Math.max(2, (cat.total / maxVal) * barMaxW);
    const color = BAR_COLORS[i % BAR_COLORS.length];

    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(cat.name || 'Uncategorized', 14, y + 4);

    doc.setFillColor(...BORDER);
    doc.roundedRect(14, y + 6, barMaxW, 4, 1, 1, 'F');

    doc.setFillColor(...color);
    doc.roundedRect(14, y + 6, barW, 4, 1, 1, 'F');

    doc.setTextColor(...LIGHT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(cat.total), W - 14, y + 9, { align: 'right' });

    y += 14;
  });

  y += 4;

  // Section: Applicable Deduction Rules
  checkPage(20);
  doc.setDrawColor(...BORDER);
  doc.line(14, y, W - 14, y);
  y += 10;

  doc.setTextColor(...LIGHT);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Applicable IRS Deduction Rules', 14, y);
  y += 8;

  (taxData?.applicableRules || []).forEach((rule, i) => {
    checkPage(18);
    doc.setFillColor(...CARD);
    doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');

    doc.setFillColor(...PURPLE);
    doc.roundedRect(14, y, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`${rule.percentage}%`, 21, y + 8, { align: 'center' });

    doc.setTextColor(...LIGHT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(rule.name, 32, y + 5);

    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const desc = doc.splitTextToSize(rule.description, W - 46);
    doc.text(desc[0], 32, y + 10);

    y += 18;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...CARD);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ExpenseTracker — Confidential Tax Report', 14, H - 4);
    doc.text(`Page ${p} of ${pages}`, W - 14, H - 4, { align: 'right' });
  }

  doc.save(`tax-report-${year}.pdf`);
}
