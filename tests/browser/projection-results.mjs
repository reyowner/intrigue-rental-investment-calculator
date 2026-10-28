// Import in the real application document over HTTP. Returns named, repeatable checks.
const require = (condition, name) => { if (!condition) throw new Error(name); };
const tick = () => Promise.resolve();

export async function runProjectionChecks() {
  const checks = [];
  const check = (name, condition) => { require(condition, name); checks.push(name); };
  const { calculateInvestment } = await import('/src/features/calculator/engine.js');
  const { readInputValues } = await import('/src/features/calculator/utils/input-values.js');
  const { buildProjectionView } = await import('/src/features/calculator/utils/projection-view.js');
  const form = document.querySelector('[data-calculator-form]');
  form.reset();
  form.querySelector('[data-view-results]').click();
  const projection = document.querySelector('[data-projection]');
  check('the long-term projection is mounted', Boolean(projection));
  const value = (key, year) => projection.querySelector(`[data-projection-row="${key}"] [data-projection-cell="${year}"] [data-projection-value]`).textContent;
  const model = () => calculateInvestment(readInputValues(new FormData(form).entries()));
  const matches = () => buildProjectionView(model()).groups.every(group => group.rows.every(row => row.cells.every(cell => value(row.key, cell.year) === cell.value)));
  const chart = () => globalThis.Chart?.getChart(projection.querySelector('canvas'));
  for (let i = 0; i < 100 && !chart(); i += 1) await new Promise(resolve => setTimeout(resolve, 30));
  require(chart(), 'real Chart.js projection is ready');
  projection.querySelector('[data-chart-metric=annualCashFlow]').click();
  const chartsMatch = () => { const current = model(); const raw = chart()?.data.datasets[0].rawValues; const metric = chart()?.options.projectionMetric; return raw?.length === 30 && raw.every((value, i) => value === current.years[i][metric]); };
  const change = (name, raw) => { const input = form.elements.namedItem(name); input.value = raw; input.dispatchEvent(new Event('input', { bubbles: true })); return input; };
  check('51 financial rows include all 49 source rows and two sale clarifiers', projection.querySelectorAll('[data-projection-row]').length === 51
    && projection.querySelectorAll('[data-source-row]:not([data-source-row=""])').length === 49);
  check('every financial row contains 30 annual values', projection.querySelectorAll('[data-projection-cell]').length === 1530);
  check('year headings span Year 1 to Year 30', projection.querySelectorAll('[data-projection-year-heading]').length === 30 && projection.querySelector('#projection-year-30').textContent === 'Year 30');
  check('all default table values agree with the actual engine presenter', matches());
  check('table Year 1 cap rate agrees with headline', value('capRate', 1) === document.querySelector('[data-headline="capRate"] [data-result-value]').textContent);
  check('table Year 5 equity agrees with headline', value('equity', 5) === document.querySelector('[data-headline="equityAtYear5"] [data-result-value]').textContent);
  check('table Year 30 check figures are correct', value('irr', 30) === '14.04%' && value('cumulativeCashFlow', 30) === '$452,099' && value('expenses.insurance', 30) === '$4,242');
  const rent = change('monthlyRent', '2500');
  check('editing rent updates all 30 table years immediately', matches() && value('grossRent', 1) === '$30,000');
  check('editing rent updates the active chart series immediately', chartsMatch());
  rent.focus(); rent.setSelectionRange(2, 2); rent.dispatchEvent(new Event('input', { bubbles: true }));
  check('projection updates preserve the input focus and caret', document.activeElement === rent && rent.selectionStart === 2);
  change('monthlyUtilities.water', '35'); change('annualMiscellaneous.legal', '240');
  check('nested monthly and annual cost lines update the table exactly once', matches() && value('expenses.utilities.water', 1) === '$420' && value('expenses.miscellaneous.legal', 1) === '$240');
  const scroll = projection.querySelector('[data-projection-scroll]');
  const year = projection.querySelector('[data-projection-year]');
  year.value = '30'; year.dispatchEvent(new Event('change', { bubbles: true }));
  const visibleYear = projection.querySelector('[data-projection-year-heading="30"]').getBoundingClientRect();
  const viewport = scroll.getBoundingClientRect();
  check('year selector scrolls Year 30 into the table viewport', scroll.scrollLeft > 0 && visibleYear.left >= viewport.left && visibleYear.right <= viewport.right + 1);
  const previousLeft = scroll.scrollLeft;
  change('monthlyRent', '2600');
  check('ordinary edits preserve table horizontal position and year selection', Math.abs(scroll.scrollLeft - previousLeft) <= 1 && year.value === '30');
  change('monthlyRent', '');
  check('invalid input hides the projection and shows its correction message', projection.querySelector('[data-projection-valid]').hidden && !projection.querySelector('[data-projection-invalid]').hidden);
  check('invalid input clears stale table values and chart paths', [...projection.querySelectorAll('[data-projection-value]')].every(node => node.textContent === 'N/A') && !chart());
  change('monthlyRent', '2400');
  check('correcting invalid input restores the projection', !projection.querySelector('[data-projection-valid]').hidden && matches());
  check('recovery preserves the selected year and horizontal position', year.value === '30' && Math.abs(scroll.scrollLeft - previousLeft) <= 1);
  form.reset();
  change('interestRatePercent', '0'); change('loanTermYears', '1.5');
  check('short-loan annual payments stop at payoff', value('mortgagePayment', 3) === '$0' && value('loanBalance', 3) === '$0' && value('mortgageInterest', 30) === '$0' && matches());
  form.reset(); change('monthlyRent', '0');
  check('negative cash flows are numeric, not missing', value('annualCashFlow', 1).startsWith('-$') && matches());
  check('negative cash flow remains visible in the chart series', chartsMatch() && chart().data.datasets[0].rawValues.every(value => value < 0));
  form.reset();
  for (const name of ['purchasePrice', 'afterRepairValue', 'monthlyRent', 'monthlyPropertyTaxes', 'monthlyInsurance']) change(name, '0');
  check('zero cash and zero property values show unavailable ratios with a visible explanation', value('capRate', 1) === 'N/A' && value('cashOnCashReturn', 30) === 'N/A'
    && !projection.querySelector('[data-projection-notes]').hidden && projection.querySelector('[data-projection-note-list]').textContent.includes('cash required is zero'));
  const unavailableCells = [...projection.querySelectorAll('td[aria-describedby]')];
  check('every unavailable cell references a real explanation', unavailableCells.length > 0 && unavailableCells.every(cell => document.getElementById(cell.getAttribute('aria-describedby'))?.textContent.length > 10));
  check('genuine zero cash flow is still a number', value('annualCashFlow', 30) === '$0');
  check('zero-valued chart series remain present and finite', chartsMatch() && chart().data.datasets[0].rawValues.every(value => value === 0) && chart().getDatasetMeta(0).data.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  form.reset();
  check('reset restores every table value and clears old explanation notes', matches() && projection.querySelector('[data-projection-notes]').hidden);
  const raw = model();
  check('cash flow and equity have separate metric controls', ['annualCashFlow', 'equity'].every(key => projection.querySelector(`[data-chart-metric="${key}"]`)));
  for (const metric of ['annualCashFlow', 'equity']) {
    projection.querySelector(`[data-chart-metric="${metric}"]`).click();
    const values = chart().data.datasets[0].rawValues;
    check(`chart ${metric} contains all 30 raw engine values`, values.length === 30 && values.every((point, i) => point === raw.years[i][metric]));
  }
  projection.querySelector('[data-chart-metric=annualCashFlow]').click();
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  check('the completed page has no duplicate IDs', new Set(ids).size === ids.length);
  check('table is a named keyboard-focusable scrolling region', scroll.tabIndex === 0 && document.getElementById(scroll.getAttribute('aria-labelledby')).textContent.includes('30-year'));
  check('all table values have row and year header references', [...projection.querySelectorAll('[data-projection-cell]')].every(cell => cell.getAttribute('headers').split(' ').every(id => document.getElementById(id))));
  check('the actual year select has at least 16px text', parseFloat(getComputedStyle(year).fontSize) >= 16);
  year.value = '1'; year.dispatchEvent(new Event('change', { bubbles: true })); scroll.scrollTop = 0;
  return { passed: checks.length, checks };
}

export function runProjectionLayoutChecks() {
  const root = document.querySelector('[data-projection]');
  const scroll = root.querySelector('[data-projection-scroll]');
  const table = root.querySelector('table');
  const headings = [...table.querySelectorAll('thead th')];
  const checks = {
    noPageOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
    projectionFillsCalculator: Math.abs(root.getBoundingClientRect().width - root.closest('[data-calculator]').getBoundingClientRect().width) <= 1,
    tableScrollIsLocal: scroll.scrollWidth > scroll.clientWidth && scroll.getBoundingClientRect().right <= document.documentElement.clientWidth,
    tableIsVerticallyBounded: scroll.scrollHeight > scroll.clientHeight && scroll.clientHeight <= innerHeight * .71,
    cornerSticky: getComputedStyle(headings[0]).position === 'sticky' && getComputedStyle(headings[0]).left === '0px',
    yearsSticky: headings.slice(1).every(node => getComputedStyle(node).position === 'sticky' && getComputedStyle(node).top === '0px'),
    rowLabelsSticky: [...table.querySelectorAll('tbody th')].every(node => getComputedStyle(node).position === 'sticky' && getComputedStyle(node).left === '0px'),
    chartFits: [...root.querySelectorAll('canvas')].every(canvas => canvas.getBoundingClientRect().width <= root.clientWidth),
  };
  for (const [name, condition] of Object.entries(checks)) require(condition, name);
  return { width: document.documentElement.clientWidth, passed: Object.keys(checks).length, checks };
}


/** The selected number must fit beside the sticky label, not merely have a visible heading. */
export function runProjectionYearJumpChecks() {
  const root = document.querySelector('[data-projection]');
  const scroll = root.querySelector('[data-projection-scroll]');
  const select = root.querySelector('[data-projection-year]');
  const original = { value: select.value, left: scroll.scrollLeft, top: scroll.scrollTop };
  const checks = [];
  try {
    for (const year of [1, 15, 30]) {
      select.value = String(year);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const viewport = scroll.getBoundingClientRect();
      const stickyRight = root.querySelector('.projection-table-corner').getBoundingClientRect().right;
      const visibleRight = viewport.left + scroll.clientLeft + scroll.clientWidth;
      const visible = ['grossRent', 'equity'].every(key => {
        const range = document.createRange();
        range.selectNodeContents(root.querySelector(`[data-projection-row="${key}"] [data-projection-cell="${year}"] [data-projection-value]`));
        const text = range.getBoundingClientRect();
        return text.left >= stickyRight - 1 && text.right <= visibleRight + 1;
      });
      const name = `Year ${year} amounts are fully visible after a year jump`;
      require(visible, name);
      checks.push(name);
    }
  } finally {
    select.value = original.value;
    scroll.scrollTo({ left: original.left, top: original.top, behavior: 'auto' });
  }
  return { width: document.documentElement.clientWidth, passed: checks.length, checks };
}
