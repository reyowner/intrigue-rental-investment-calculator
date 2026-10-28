import { INPUT_GROUPS } from '../constants/input-fields.js';
import { buildResultView } from '../utils/result-view.js';
import { buildProjectionView } from '../utils/projection-view.js';
import { REPORT_STYLES } from './report-styles.js';
import { validateInputs } from '../utils/validate-inputs.js';
import { PROJECTION_GROUPS } from '../constants/projection-rows.js';
import { isProjectionChartModel, CHART_METRICS, chartDollars } from '../utils/projection-chart-view.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const at = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const units = { currency: 'USD', monthly: 'USD / month', annual: 'USD / year', percent: '%', years: 'years' };

// Coordinates and axis scaling are presentation only; no investment values are derived here.
function graph(model, metric) {
  const raw = model.years.map(year => year[metric]);
  const magnitude = Math.max(...raw.map(Math.abs)) || 1;
  const normalized = raw.map(value => value / magnitude);
  const zero = raw.every(value => value === 0);
  const low = zero ? -1 : Math.min(0, ...normalized);
  const high = zero ? 1 : Math.max(0, ...normalized);
  const x = index => 112 + index * (640 / 29);
  const y = value => 24 + (high - value) / (high - low) * 200;
  const grid = Array.from({ length: 5 }, (_, i) => {
    const value = low + (high - low) * (i / 4);
    return `<line x1="112" x2="752" y1="${y(value)}" y2="${y(value)}" stroke="#cce5ed"/><text x="104" y="${y(value) + 4}" text-anchor="end">${escape(chartDollars(value * magnitude, true))}</text>`;
  }).join('');
  return `<figure data-report-chart="${metric}"><h3>${escape(CHART_METRICS[metric])} · Years 1–30</h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 270" role="img" aria-labelledby="graph-title-${metric} graph-desc-${metric}"><title id="graph-title-${metric}">${escape(CHART_METRICS[metric])}, all 30 years</title><desc id="graph-desc-${metric}">Dollar amounts from the unchanged engine model. The annual amounts, rounded for display, are included in the projection tables.</desc><g font-size="12" fill="#123a48">${grid}<line x1="112" x2="752" y1="${y(0)}" y2="${y(0)}" stroke="#1b5063"/><polyline fill="none" stroke="#1b5063" stroke-width="2.5" points="${normalized.map((value, index) => `${x(index)},${y(value)}`).join(' ')}"/>${raw.map((value, index) => `<circle data-chart-point="${metric}:${index + 1}" data-raw="${value}" cx="${x(index)}" cy="${y(normalized[index])}" r="2.8" fill="#9dc31b" stroke="#1b5063"><title>Year ${index + 1}: ${escape(chartDollars(value))}</title></circle>`).join('')}${[0, 4, 9, 14, 19, 24, 29].map(index => `<text x="${x(index)}" y="246" text-anchor="middle">${index + 1}</text>`).join('')}<text x="432" y="265" text-anchor="middle">Year</text></g></svg><figcaption>USD · ${metric === 'equity' ? 'End-of-year equity before selling costs; not net sale proceeds.' : 'Annual operating cash flow after actual mortgage payments; excludes sale proceeds.'} Independent axis scale. All 30 years shown.</figcaption></figure>`;
}

export function assertReportSnapshot(snapshot) {
  const invalid = () => { throw new TypeError('Invalid report snapshot: provide all 40 current inputs and their complete successful engine model.'); };
  if (!snapshot?.inputs || !isProjectionChartModel(snapshot.model)) invalid();
  const validation = validateInputs(snapshot.inputs);
  if (!validation.ok) invalid();
  for (const group of INPUT_GROUPS) for (const field of group.fields) {
    if (typeof at(snapshot.inputs, field.name) !== 'string' || at(validation.value, field.name) !== at(snapshot.model.inputs, field.name)) invalid();
  }
  for (const year of snapshot.model.years) {
    if (!year.unavailable || typeof year.unavailable !== 'object') invalid();
    for (const group of PROJECTION_GROUPS) for (const row of group.rows) {
      const value = at(year, row.key);
      if (!Number.isFinite(value) && !(value === null && typeof year.unavailable[row.key] === 'string')) invalid();
    }
  }
  for (const key of ['initial.loanAmount', 'initial.buyingClosingCosts', 'initial.totalCashRequired', 'mortgage.monthlyPayment']) {
    if (!Number.isFinite(at(snapshot.model, key))) invalid();
  }
  if (!snapshot.model.headline || ['monthlyCashFlow', 'totalCashRequired', 'equityAtYear5'].some(key => !Number.isFinite(snapshot.model.headline[key]))) invalid();
  for (const key of ['capRate', 'cashOnCashReturn']) {
    if (!Number.isFinite(snapshot.model.headline[key]) && !(snapshot.model.headline[key] === null && snapshot.model.years[0].unavailable[key])) invalid();
  }
}

/** Pure presentation: retains raw entered assumptions and existing presenter results.
 * Throws TypeError for an invalid/incomplete/stale snapshot. No financial recomputation.
 */
export function buildInvestmentReport(snapshot, { baseUrl = globalThis.document?.baseURI ?? 'http://localhost/' } = {}) {
  assertReportSnapshot(snapshot);
  const result = buildResultView(snapshot.model);
  const cards = kind => result[kind].map(item => `<article data-report-${kind}="${escape(item.key)}"><h3>${escape(item.label)}</h3><strong>${escape(item.value)}</strong><p>${escape(item.help)}</p>${item.unavailable ? `<p>${escape(item.unavailable)}</p>` : ''}</article>`).join('');
  const assumptions = INPUT_GROUPS.map(group => `<section><h3>${escape(group.title)}</h3><p>${escape(group.help)}</p><dl>${group.fields.map(field => `<div data-report-input="${escape(field.name)}"><dt>${escape(field.label)}</dt><dd>${escape(at(snapshot.inputs, field.name))} ${escape(units[field.unit])}</dd><p>${escape(field.help)}</p></div>`).join('')}</dl></section>`).join('');
  const projection = buildProjectionView(snapshot.model);
  const bands = Array.from({ length: 6 }, (_, band) => {
    const start = band * 5;
    return `<section class="page-section" data-report-band="${band + 1}"><h2>Projection · Years ${start + 1}–${start + 5}</h2><p class="muted">Intrigue · USD unless shown as %. Source row references: R = original worksheet row; + = presentation clarifier. N/A explanations follow the tables.</p><table><thead><tr><th scope="col">Financial line / source</th>${projection.years.slice(start, start + 5).map(year => `<th scope="col">Year ${year}</th>`).join('')}</tr></thead>${projection.groups.map(group => `<tbody><tr class="group"><th colspan="6" scope="rowgroup">${escape(group.label)}</th></tr>${group.rows.map(row => `<tr class="${row.emphasis ? 'emphasis' : ''}"><th scope="row">${escape(row.label)} <small>${row.sourceRow === null ? '+' : `R${row.sourceRow}`}</small></th>${row.cells.slice(start, start + 5).map(cell => `<td data-report-cell="${escape(row.key)}:${cell.year}">${escape(cell.value)}${cell.note ? `<sup> [${cell.note}]</sup>` : ''}</td>`).join('')}</tr>`).join('')}</tbody>`).join('')}</table></section>`;
  }).join('');
  const notes = `<section class="page-section"><h2>Unavailable result explanations</h2>${projection.notes.length ? `<ol>${projection.notes.map(note => `<li value="${note.number}">${escape(note.reason)}</li>`).join('')}</ol>` : '<p>No unavailable results in this projection.</p>'}<h2>Source row glossary</h2><p>Each year-end sale is a separate hypothetical sale, not a sequence of sales. Selling costs reduce net sale proceeds; that year’s operating cash flow is included once in the final IRR payment. Equity is before selling costs. Depreciation is informational; no income tax benefit is modeled.</p><ul class="glossary">${projection.groups.flatMap(group => group.rows).map(row => `<li><b>${escape(row.label)} (${row.sourceRow === null ? '+ additional clarifier' : `R${row.sourceRow}`})</b>: ${escape(row.help)}</li>`).join('')}</ul></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Intrigue | Rental investment report</title><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&amp;display=swap" rel="stylesheet"><style>${REPORT_STYLES}</style></head><body><header><img width="180" alt="Intrigue" src="${escape(new URL('assets/images/intrigue-wordmark-teal.png', baseUrl).href)}"><h1>Rental investment report</h1><p>30-year investment outlook · USD</p></header><div class="toolbar"><button type="button" data-print-report>Print / Save as PDF</button><p>This report includes all assumptions, both graphs, and every projection year. Choose Save as PDF in your browser. The report is a snapshot of the deal when you opened it.</p></div><main><h2>Investment at a glance</h2><div class="cards">${cards('headline')}</div><h2>Financing details</h2><div class="cards cards--financing">${cards('derived')}</div><section class="page-section"><h2>Cash flow and equity over 30 years</h2>${graph(snapshot.model, 'annualCashFlow')}${graph(snapshot.model, 'equity')}</section><section class="page-section"><h2>All assumptions</h2>${assumptions}</section>${bands}${notes}</main><footer>Intrigue · Estimates, not guarantees. For educational use; not financial, tax, or legal advice. Actual rents, expenses, financing and sale outcomes may differ.</footer></body></html>`;
}


/** Opens synchronously while the initiating click still owns user activation.
 * The report is a fixed snapshot; subsequent edits never rewrite an opened report.
 */
export function openInvestmentReport(snapshot, { openWindow = () => window.open('', '_blank'), autoPrint = true, ...options } = {}) {
  const html = buildInvestmentReport(snapshot, options);
  const target = openWindow();
  if (!target) return { ok: false, message: 'Allow pop-ups for this site to open the printable report, then try again.' };
  try {
    target.document.open(); target.document.write(html); target.document.close();
    target.opener = null;
    const print = () => target.print();
    target.document.querySelector('[data-print-report]').addEventListener('click', print);
    const wait = (promise, limit) => new Promise(resolve => {
      const timer = setTimeout(resolve, limit);
      Promise.resolve(promise).catch(() => {}).then(() => { clearTimeout(timer); resolve(); });
    });
    const loaded = target.document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => target.addEventListener('load', resolve, { once: true }));
    const ready = (async () => {
      await wait(loaded, 8000);
      if (target.closed) return null;
      await wait(target.document.fonts?.ready, 5000);
      if (autoPrint && !target.closed) {
        try { print(); } catch { /* The visible print button remains available. */ }
      }
      return target;
    })();
    return { ok: true, window: target, ready };
  } catch {
    target.close?.();
    return { ok: false, message: 'The printable report could not open. Please try again in a new tab.' };
  }
}
