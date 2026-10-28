const require = (condition, name) => { if (!condition) throw new Error(name); };
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function waitFor(condition, name) {
  for (let i = 0; i < 200; i += 1) { if (condition()) return; await pause(); }
  throw new Error(name);
}

/** Run on a fresh ready document with no projection fragment. Uses the actual local Chart.js. */
export async function runChartResultsChecks() {
  const checks = [];
  const check = (name, condition) => { require(condition, name); checks.push(name); };
  const form = document.querySelector('[data-calculator-form]');
  const projection = document.querySelector('[data-projection]');
  const host = projection.querySelector('[data-projection-charts]');
  const canvas = () => host.querySelector('canvas');
  const chart = () => globalThis.Chart?.getChart(canvas());
  const change = (name, value) => { const field = form.elements.namedItem(name); field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })); };
  const { calculateInvestment } = await import('/src/features/calculator/engine.js');
  const { readInputValues } = await import('/src/features/calculator/utils/input-values.js');
  const model = () => calculateInvestment(readInputValues(new FormData(form).entries()));
  const matches = metric => { const expected = model(); const raw = chart()?.data.datasets[0].rawValues; return raw?.length === 30 && raw.every((value, i) => value === expected.years[i][metric]); };
  const allPointsFinite = () => chart()?.getDatasetMeta(0).data.length === 30 && chart().getDatasetMeta(0).data.every(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  check('the large chart dependency is not loaded before results are requested', projection.hidden && !globalThis.Chart && !performance.getEntriesByType('resource').some(entry => entry.name.includes('/assets/vendor/chartjs/')));
  change('monthlyRent', '2500');
  check('editing the deal before reveal does not load the chart library', !globalThis.Chart);
  form.querySelector('[data-view-results]').click();
  await waitFor(() => host.dataset.chartState === 'ready', 'Chart.js did not reach ready after reveal');
  check('a real pinned Chart.js instance renders after reveal', globalThis.Chart.version === '4.6.1' && Boolean(chart()));
  check('all thirty cash-flow points use the latest edited deal', matches('annualCashFlow'));
  check('the graph has finite rendered geometry', allPointsFinite());
  check('canvas has an accessible alternative and the complete table remains available', Boolean(canvas().getAttribute('aria-label') || canvas().getAttribute('aria-labelledby')) && projection.querySelectorAll('[data-projection-cell]').length === 1530);
  const instance = chart();
  host.querySelector('[data-chart-metric="equity"]').click();
  check('metric control switches to equity without creating a second chart', matches('equity') && chart() === instance);
  const year = host.querySelector('[data-chart-year]');
  year.value = '30'; year.dispatchEvent(new Event('change', { bubbles: true }));
  const expected = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(model().years[29].equity);
  check('year inspection exposes the exact formatted selected amount outside the canvas', host.querySelector('[data-chart-selected-value]').textContent.includes(expected));
  check('the real chart year select has at least 16px text', parseFloat(getComputedStyle(year).fontSize) >= 16);
  change('afterRepairValue', '300000');
  check('ordinary input edits update the active metric without resetting the selected year', matches('equity') && chart() === instance && year.value === '30');
  change('afterRepairValue', '');
  check('invalid input destroys the old chart rather than leaving stale graphics', !chart() && projection.querySelector('[data-projection-valid]').hidden);
  change('afterRepairValue', '270000');
  await waitFor(() => host.dataset.chartState === 'ready', 'Chart did not recover after correcting the input');
  check('recovery uses the current model and preserves metric/year controls', matches('equity') && year.value === '30');
  form.reset();
  host.querySelector('[data-chart-metric="annualCashFlow"]').click();
  change('monthlyRent', '0');
  check('negative cash-flow values remain numeric and plotted', matches('annualCashFlow') && chart().data.datasets[0].rawValues.every(value => value < 0) && allPointsFinite());
  form.reset();
  for (const field of ['purchasePrice', 'afterRepairValue', 'monthlyRent', 'monthlyPropertyTaxes', 'monthlyInsurance']) change(field, '0');
  check('zero-valued valid models still have a complete finite chart', matches('annualCashFlow') && chart().data.datasets[0].rawValues.every(value => value === 0) && allPointsFinite());
  form.reset(); change('monthlyRent', '1e100');
  check('large finite inputs retain raw precision without overflowing chart geometry', matches('annualCashFlow') && allPointsFinite());
  form.reset();
  check('reset updates the graph and both result summaries together', matches('annualCashFlow') && document.querySelector('[data-headline="monthlyCashFlow"] [data-result-value]').textContent === '$319' && projection.querySelector('[data-overview="monthlyCashFlow"] [data-result-value]').textContent === '$319');
  return { passed: checks.length, checks };
}


export function runChartControlContrastChecks() {
  const luminance = color => {
    const channels = color.startsWith('#') ? color.slice(1).match(/../g).map(value => parseInt(value, 16)) : color.match(/[0-9.]+/g).slice(0, 3).map(Number);
    const c = channels.map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  };
  const ratio = (a, b) => { a = luminance(a); b = luminance(b); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
  const root = document.querySelector('[data-projection-charts]');
  const active = getComputedStyle(root.querySelector('[data-chart-metric][aria-pressed="true"]'));
  const inactive = getComputedStyle(root.querySelector('[data-chart-metric][aria-pressed="false"]'));
  const select = getComputedStyle(root.querySelector('[data-chart-year]'));
  const white = 'rgb(255,255,255)';
  const pairs = [
    ['selected metric text', active.color, active.backgroundColor, 4.5],
    ['unselected metric text', inactive.color, inactive.backgroundColor, 4.5],
    ['selected metric boundary', active.borderTopColor, white, 3],
    ['unselected metric boundary', inactive.borderTopColor, white, 3],
    ['year select text', select.color, select.backgroundColor, 4.5],
    ['year select boundary', select.borderTopColor, white, 3],
    ['chart line', globalThis.Chart.getChart(root.querySelector('canvas')).data.datasets[0].borderColor, white, 3],
  ].map(([name, foreground, background, minimum]) => ({ name, ratio: ratio(foreground, background), minimum }));
  for (const pair of pairs) require(pair.ratio >= pair.minimum, `chart contrast: ${pair.name}`);
  require(active.boxShadow.includes('inset'), 'selected metric has a visible shape cue beyond its lime fill');
  return { passed: pairs.length + 1, pairs };
}
