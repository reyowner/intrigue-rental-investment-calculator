import { assertReportSnapshot } from './investment-report.js';
import { INPUT_GROUPS } from '../constants/input-fields.js';
import { buildResultView } from '../utils/result-view.js';
import { buildProjectionView } from '../utils/projection-view.js';
import { CHART_METRICS, chartDollars } from '../utils/projection-chart-view.js';

const C = { ink: '#123A48', teal: '#1B5063', lime: '#9DC31B', pale: '#CCE5ED', surface: '#F3F7F8', muted: '#51656D' };
const units = { currency: 'USD', monthly: 'USD / month', annual: 'USD / year', percent: '%', years: 'years' };
const at = (object, path) => path.split('.').reduce((value, key) => value[key], object);

export function reportFilename(date = new Date()) {
  if (!Number.isFinite(date?.getTime?.())) throw new TypeError('A valid export date is required.');
  const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  return `intrigue-rental-investment-report-${day}.pdf`;
}

/** Native PDF text, tables and vector graphs; financial values come only from the snapshot. */
export function buildPdfDocument(snapshot, assets, { date = new Date() } = {}) {
  assertReportSnapshot(snapshot);
  const filename = reportFilename(date);
  const doc = new assets.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('Raleway-Regular.ttf', assets.regularFont);
  doc.addFont('Raleway-Regular.ttf', 'Raleway', 'normal');
  doc.addFileToVFS('Raleway-Bold.ttf', assets.boldFont);
  doc.addFont('Raleway-Bold.ttf', 'Raleway', 'bold');
  doc.setProperties({ title: 'Intrigue Rental Property Investment Report', author: 'Intrigue Real Estate & Property Management', subject: 'Complete 30-year rental investment projection' });
  doc.setCreationDate(date);
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 36, BOTTOM = H - 54, WIDTH = W - M * 2;
  const dateLabel = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  const headed = new Set();
  let y = 108, section = 'Investment summary';
  const textStyle = (size = 10, bold = false, color = C.ink) => { doc.setFont('Raleway', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(color); };
  function header() {
    const page = doc.internal.getCurrentPageInfo().pageNumber;
    if (headed.has(page)) return;
    headed.add(page);
    if (assets.logo) {
      const image = doc.getImageProperties(assets.logo);
      doc.addImage(assets.logo, 'PNG', M, 25, 118, 118 * image.height / image.width, 'intrigue-wordmark');
    } else { textStyle(21, true); doc.text('Intrigue', M, 49); }
    textStyle(9, true); doc.text('Rental property investment report', W - M, 38, { align: 'right' });
    textStyle(8.5, false, C.muted); doc.text(dateLabel, W - M, 53, { align: 'right' });
    doc.setDrawColor(C.lime); doc.setLineWidth(2); doc.line(M, 70, W - M, 70);
    textStyle(8.5, false, C.muted); doc.text(section, M, 83);
  }
  function newPage(title) { section = title; doc.addPage(); y = 108; header(); }
  function space(height) { if (y + height > BOTTOM) newPage(section); }
  function title(value) { space(32); textStyle(16, true); doc.text(value, M, y); y += 25; }
  function paragraph(value, size = 9, color = C.muted) {
    textStyle(size, false, color); const lines = doc.splitTextToSize(value, WIDTH);
    for (const line of lines) { space(size * 1.4); textStyle(size, false, color); doc.text(line, M, y); y += size * 1.4; }
    y += 6;
  }
  function table(head, body, options = {}) {
    doc.autoTable({
      startY: y, head: [head], body, theme: 'grid',
      margin: { top: 98, bottom: 54, left: M, right: M },
      styles: { font: 'Raleway', fontStyle: 'normal', fontSize: 8.5, textColor: C.ink, lineColor: C.pale, lineWidth: .35, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: C.teal, textColor: '#FFFFFF', fontStyle: 'bold', cellPadding: 6 },
      alternateRowStyles: { fillColor: '#F8FAFB' },
      showHead: 'everyPage', rowPageBreak: 'avoid', willDrawPage: header,
      ...options,
    });
    y = doc.lastAutoTable.finalY + 15;
  }
  function metricCards(metrics, columns, valueSize) {
    const gap = 9, padding = 11, width = (WIDTH - gap * (columns - 1)) / columns;
    for (let start = 0; start < metrics.length; start += columns) {
      const row = metrics.slice(start, start + columns).map(metric => {
        textStyle(9.5, true); const label = doc.splitTextToSize(metric.label, width - padding * 2);
        textStyle(valueSize, true); const value = doc.splitTextToSize(metric.value, width - padding * 2);
        textStyle(8.5); const help = doc.splitTextToSize(metric.help + (metric.unavailable ? ` ${metric.unavailable}` : ''), width - padding * 2);
        return { label, value, help, height: padding * 2 + label.length * 12 + value.length * valueSize * 1.18 + help.length * 11 + 9 };
      });
      const height = Math.max(...row.map(cell => cell.height)); space(height + gap);
      row.forEach((cell, index) => {
        const x = M + index * (width + gap);
        doc.setFillColor(C.surface); doc.setDrawColor(C.pale); doc.setLineWidth(.6);
        doc.roundedRect(x, y, width, height, 8, 8, 'FD');
        let top = y + padding + 9;
        textStyle(9.5, true); doc.text(cell.label, x + padding, top, { lineHeightFactor: 12 / 9.5 }); top += cell.label.length * 12 + 5;
        textStyle(valueSize, true); doc.text(cell.value, x + padding, top, { lineHeightFactor: 1.18 }); top += cell.value.length * valueSize * 1.18 + 5;
        textStyle(8.5, false, C.muted); doc.text(cell.help, x + padding, top, { lineHeightFactor: 11 / 8.5 });
      });
      y += height + gap;
    }
  }
  function graph(metric) {
    space(274); textStyle(12, true); doc.text(`${CHART_METRICS[metric]}: Years 1-30`, M, y);
    const raw = snapshot.model.years.map(row => row[metric]);
    const magnitude = Math.max(...raw.map(Math.abs)) || 1;
    const values = raw.map(value => value / magnitude);
    const zero = raw.every(value => value === 0);
    const low = zero ? -1 : Math.min(0, ...values), high = zero ? 1 : Math.max(0, ...values);
    const left = M + 72, right = W - M - 8, top = y + 19, height = 175;
    const px = index => left + index * (right - left) / 29;
    const py = value => top + (high - value) / (high - low) * height;
    for (let i = 0; i <= 4; i++) {
      const v = low + (high - low) * i / 4;
      doc.setDrawColor(C.pale); doc.setLineWidth(.5); doc.line(left, py(v), right, py(v));
      textStyle(8); doc.text(chartDollars(v * magnitude, true), left - 8, py(v) + 3, { align: 'right' });
    }
    doc.setDrawColor(C.teal); doc.setLineWidth(1); doc.line(left, py(0), right, py(0));
    doc.setLineWidth(1.6);
    for (let i = 1; i < values.length; i++) doc.line(px(i - 1), py(values[i - 1]), px(i), py(values[i]));
    doc.setFillColor(C.lime); doc.setDrawColor(C.teal); doc.setLineWidth(.6);
    values.forEach((value, i) => doc.circle(px(i), py(value), 2.2, 'FD'));
    textStyle(8);
    [0, 4, 9, 14, 19, 24, 29].forEach(i => doc.text(String(i + 1), px(i), top + height + 15, { align: 'center' }));
    doc.text('Year', (left + right) / 2, top + height + 29, { align: 'center' });
    y = top + height + 46;
    paragraph(metric === 'equity' ? 'USD. End-of-year equity before selling costs, not net sale proceeds. Independent axis scale.' : 'USD. Annual operating cash flow after actual mortgage payments, excluding sale proceeds. Independent axis scale.', 8.5);
    y += 7;
  }

  header(); title('Investment at a glance');
  const summary = buildResultView(snapshot.model);
  metricCards(summary.headline, 3, 21);
  y += 9; title('Purchase and financing totals'); metricCards(summary.derived, 4, 17);
  y += 8;
  paragraph('A snapshot of the inputs entered in the calculator. Estimates are not guaranteed outcomes. Amounts are USD rounded for display; scheduled monthly principal and interest retains cents. Both graphs and the complete 30-year projection follow.');

  newPage('Cash flow and equity'); title('Your property over 30 years'); graph('annualCashFlow'); graph('equity');
  newPage('All 40 inputs and assumptions'); title('All inputs and assumptions');
  for (const group of INPUT_GROUPS) {
    space(80); textStyle(11, true); doc.text(group.title, M, y); y += 16;
    if (group.help) paragraph(group.help, 8.5);
    table(['Assumption', 'Entered value', 'Explanation'], group.fields.map(field => [field.label, `${at(snapshot.inputs, field.name)} ${units[field.unit]}`, field.help]), {
      columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 112 } },
    });
  }

  const projection = buildProjectionView(snapshot.model);
  for (let start = 0; start < 30; start += 5) {
    newPage(`Full projection: Years ${start + 1}-${start + 5}`); title(`Projection: Years ${start + 1}-${start + 5}`);
    paragraph('Annual USD, except monthly cash flow and percentage returns. Each column is a separate year-end sale what-if. R identifies the source worksheet row; + identifies a clarification. N/A notes follow the tables.', 8.5);
    const rows = projection.groups.flatMap(group => [[{ content: group.label, colSpan: 6, styles: { fillColor: C.pale, fontStyle: 'bold' } }], ...group.rows.map(row => [
      `${row.label} ${row.sourceRow === null ? '+' : `R${row.sourceRow}`}`,
      ...row.cells.slice(start, start + 5).map(cell => cell.value + (cell.note ? ` [${cell.note}]` : '')),
    ])]);
    table(['Financial measure / source', ...projection.years.slice(start, start + 5).map(year => `Year ${year}`)], rows, {
      styles: { font: 'Raleway', fontStyle: 'normal', fontSize: 8, textColor: C.ink, lineColor: C.pale, lineWidth: .3, cellPadding: 4, overflow: 'linebreak', halign: 'right' },
      columnStyles: { 0: { cellWidth: 173, halign: 'left' } },
    });
  }
  newPage('Explanations and source glossary'); title('Unavailable result explanations');
  if (projection.notes.length) for (const note of projection.notes) paragraph(`[${note.number}] ${note.reason}`);
  else paragraph('No unavailable results in this projection.');
  paragraph('Sale proceeds are not recurring operating income. Equity is before selling costs. Depreciation and mortgage interest are informational, not additional operating costs to subtract again. Effective gains include noncash amounts. Annualized ending wealth and total ROI are not cash-flow-timed IRR.');
  title('Source row glossary');
  table(['Measure', 'Meaning'], projection.groups.flatMap(group => group.rows.map(row => [row.label, row.help])), { columnStyles: { 0: { cellWidth: 160 } } });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setDrawColor(C.pale); doc.setLineWidth(.6); doc.line(M, H - 40, W - M, H - 40);
    textStyle(7.5, false, C.muted);
    doc.text('Intrigue | Estimates only. Not financial, tax or legal advice.', M, H - 25);
    doc.text(`Page ${page} of ${pages}`, W - M, H - 25, { align: 'right' });
  }
  return { document: doc, filename };
}
