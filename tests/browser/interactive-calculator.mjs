// Run over HTTP in the actual application document, not a mocked DOM.
// await (await import('/tests/browser/interactive-calculator.mjs')).runCalculatorChecks()
const require = (condition, message) => { if (!condition) throw new Error(message); };
// Allow the current browser event call stack to finish before the next assertion.
const tick = () => Promise.resolve();

export async function runCalculatorChecks() {
  const checks = [];
  const check = (name, condition) => { require(condition, name); checks.push(name); };
  const form = document.querySelector('[data-calculator-form]');
  check('interactive calculator form is mounted', Boolean(form));
  const value = (group, key) => document.querySelector(`[data-${group}="${key}"] [data-result-value]`).textContent;
  check('default cap rate comes from the engine', value('headline', 'capRate') === '7.11%');
  check('default monthly cash flow comes from the engine', value('headline', 'monthlyCashFlow') === '$319');
  check('default mortgage payment retains cents', value('derived', 'monthlyPayment') === '$1,279.94');
  const price = form.elements.namedItem('purchasePrice');
  price.value = '300000';
  price.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
  check('editing purchase price updates the actual loan amount without submitting', value('derived', 'loanAmount') === '$225,000');
  form.reset();
  await tick();
  check('reset restores the example calculation', value('headline', 'monthlyCashFlow') === '$319');
  price.value = '300000';
  price.dispatchEvent(new Event('input', { bubbles: true }));
  const resetEvent = new Event('reset', { bubbles: true, cancelable: true });
  form.dispatchEvent(resetEvent);
  // Reproduce the trusted-event checkpoint before the browser's default reset.
  if (!resetEvent.defaultPrevented) {
    await tick();
    for (const input of form.querySelectorAll('input')) input.value = input.defaultValue;
  }
  await tick();
  check('reset-event ordering cannot leave stale results', value('derived', 'loanAmount') === '$202,500');
  const { DEFAULT_INPUTS, calculateInvestment } = await import('/src/features/calculator/engine.js');
  const { INPUT_GROUPS, UTILITY_GUIDANCE } = await import('/src/features/calculator/constants/input-fields.js');
  const { buildResultView } = await import('/src/features/calculator/utils/result-view.js');
  const workspace = document.querySelector('[data-calculator]');
  const advanced = workspace.querySelector('[data-advanced-assumptions]');
  const fields = INPUT_GROUPS.flatMap(group => group.fields);
  const change = (name, raw) => {
    const input = form.elements.namedItem(name);
    input.value = raw;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return input;
  };
  const reset = async () => { form.reset(); await tick(); };
  check('all forty source inputs are present', form.querySelectorAll('input[name]').length === 40);
  check('ten primary inputs precede advanced assumptions', [...form.querySelectorAll('input[name]')].slice(0, 10).every(input => !input.closest('details')));
  check('thirty advanced inputs are present', advanced.querySelectorAll('input[name]').length === 30);
  check('seven utility expense lines are present', advanced.querySelectorAll('[name^="monthlyUtilities."]').length === 7);
  check('ten miscellaneous expense lines are present', advanced.querySelectorAll('[name^="annualMiscellaneous."]').length === 10);
  check('owner-paid utility explanation is exact', advanced.textContent.includes(UTILITY_GUIDANCE));
  for (const field of fields) {
    const input = form.elements.namedItem(field.name);
    check(`source default and helper: ${field.name}`, input.value === String(field.value) && input.labels.length === 1
      && input.getAttribute('aria-describedby').split(' ').every(id => document.getElementById(id))
      && document.getElementById(`${input.id}-help`).textContent === field.help);
  }
  check('default cash-on-cash return matches', value('headline', 'cashOnCashReturn') === '5.45%');
  check('default total cash required matches', value('headline', 'totalCashRequired') === '$70,200');
  check('default year-five equity matches', value('headline', 'equityAtYear5') === '$123,442');
  check('derived figures are not editable inputs', form.querySelectorAll('[data-derived] input').length === 0);
  const spokenUnits = { currency: 'US dollars', monthly: 'per month', annual: 'per year', percent: 'percentage', years: 'years' };
  check('every accessible input label includes its unit', fields.every(field => form.elements.namedItem(field.name).labels[0].textContent.includes(spokenUnits[field.unit])));
  advanced.open = true;
  for (const field of fields) {
    // Yield between scenarios so large real-table runs do not monopolize the browser task.
    await new Promise(resolve => setTimeout(resolve, 0));
    await reset();
    const input = change(field.name, '');
    check(`blank field clears all results: ${field.name}`, input.getAttribute('aria-invalid') === 'true'
      && [...workspace.querySelectorAll('[data-result-value]')].every(node => node.textContent === 'N/A')
      && !document.getElementById(`${input.id}-error`).hidden);
    change(field.name, String(Number(field.value) + 1));
    check(`field correction restores valid results: ${field.name}`, input.getAttribute('aria-invalid') === 'false' && workspace.dataset.calculationState === 'valid');
  }
  await reset();
  for (const raw of ['-1', 'not a number', 'Infinity', '1e308', '1,000']) {
    change('monthlyRent', raw);
    check(`bad input clears previous values: ${raw}`, workspace.dataset.calculationState === 'invalid'
      && [...workspace.querySelectorAll('[data-result-value]')].every(node => node.textContent === 'N/A'));
  }
  await reset();
  const rent = change('monthlyRent', '2500');
  rent.focus(); rent.setSelectionRange(2, 2);
  rent.dispatchEvent(new Event('input', { bubbles: true }));
  check('typing preserves focus and caret', document.activeElement === rent && rent.selectionStart === 2);
  change('monthlyUtilities.water', '35'); change('annualMiscellaneous.legal', '240');
  const expected = buildResultView(calculateInvestment({ monthlyRent: 2500, monthlyUtilities: { water: 35 }, annualMiscellaneous: { legal: 240 } }));
  check('monthly utilities and annual miscellaneous expenses feed results once', expected.headline.every(metric => value('headline', metric.key) === metric.value));
  change('monthlyRent', '0');
  check('negative cash flow stays numeric', value('headline', 'monthlyCashFlow').startsWith('-$'));
  await reset(); change('interestRatePercent', '0'); change('loanTermYears', '1.5');
  const short = buildResultView(calculateInvestment({ interestRatePercent: 0, loanTermYears: 1.5 }));
  check('zero-interest fractional-year loan updates payment', value('derived', 'monthlyPayment') === short.derived.find(metric => metric.key === 'monthlyPayment').value);
  check('short-loan equity reflects payoff', value('headline', 'equityAtYear5') === short.headline.find(metric => metric.key === 'equityAtYear5').value);
  await reset(); change('purchasePrice', '0'); change('afterRepairValue', '0');
  for (const key of ['capRate', 'cashOnCashReturn']) {
    const reason = workspace.querySelector(`[data-headline="${key}"] [data-result-reason]`);
    check(`zero-denominator N/A has visible explanation: ${key}`, value('headline', key) === 'N/A' && !reason.hidden && /zero/.test(reason.textContent));
  }
  check('defined zero cash is shown as money', value('headline', 'totalCashRequired') === '$0');
  await reset(); change('downPaymentPercent', '100'); change('monthlyRent', '0'); change('monthlyPropertyTaxes', '0'); change('monthlyInsurance', '0');
  check('defined zero return remains 0.00 percent', value('headline', 'cashOnCashReturn') === '0.00%');
  await reset(); change('insuranceGrowthPercent', '-1');
  check('negative growth is valid', workspace.dataset.calculationState === 'valid');
  change('insuranceGrowthPercent', '-101');
  check('growth below total loss is invalid', workspace.dataset.calculationState === 'invalid');
  change('insuranceGrowthPercent', '3'); change('monthlyUtilities.water', '-1'); advanced.open = false;
  workspace.querySelector('[data-calculator-error-list] a').click();
  check('error link opens advanced section and focuses field', advanced.open && document.activeElement.name === 'monthlyUtilities.water');
  advanced.open = false; form.requestSubmit();
  check('explicit submit focuses first invalid advanced field', advanced.open && document.activeElement.name === 'monthlyUtilities.water');
  await reset();
  check('reset clears errors and unavailable explanations', workspace.dataset.calculationState === 'valid'
    && workspace.querySelector('[data-calculator-errors]').hidden
    && [...workspace.querySelectorAll('[data-result-reason]')].every(node => node.hidden));
  check('reset retains disclosure openness', advanced.open);
  advanced.open = false;
  check('detailed results are available through the explicit results action', workspace.querySelector('[data-view-results]').getAttribute('aria-controls') === 'projection' && workspace.querySelector('[data-projection-table]') && workspace.querySelector('[data-projection-charts]'));
  check('results have a polite live status', workspace.querySelector('[data-calculator-announcement]').getAttribute('aria-live') === 'polite');
  check('source defaults are unchanged', DEFAULT_INPUTS.monthlyUtilities.water === 0 && DEFAULT_INPUTS.monthlyRent === 2400);
  return { checks, total: checks.length };
}


/** Repeat at each viewport/touch configuration through the real browser driver. */
export function runCalculatorLayoutChecks() {
  const checks = [];
  const check = (name, condition) => { require(condition, name); checks.push(name); };
  const advanced = document.querySelector('[data-advanced-assumptions]');
  const viewport = document.documentElement.clientWidth;
  for (const open of [false, true]) {
    advanced.open = open;
    check(`no whole-page horizontal overflow with advanced ${open ? 'open' : 'closed'}`, document.documentElement.scrollWidth <= viewport);
  }
  for (const selector of ['html', 'body', '#app', 'main', '.calculator-section', '.calculator-workspace']) {
    const node = document.querySelector(selector);
    check(`page surface has no fixed maximum width: ${selector}`, getComputedStyle(node).maxWidth === 'none');
  }
  check('calculator section spans available page width', Math.abs(document.querySelector('.calculator-section').getBoundingClientRect().width - viewport) < 1);
  for (const node of document.querySelectorAll('input, select, textarea')) {
    check(`at least 16px text: ${node.name || node.id}`, parseFloat(getComputedStyle(node).fontSize) >= 16);
  }
  for (const node of document.querySelectorAll('[data-calculator-form] input')) {
    check(`touch-height control: ${node.name}`, node.getBoundingClientRect().height >= 44);
  }
  // The current deal uses numeric text inputs, not selects. Verify the native
  // select styling explicitly without inventing an unnecessary production field.
  const wrapper = document.createElement('div');
  wrapper.className = 'calculator-field';
  const select = document.createElement('select');
  const option = document.createElement('option');
  option.textContent = 'Native select style verification';
  select.append(option); wrapper.append(select);
  document.querySelector('[data-calculator-form]').append(wrapper);
  check('native calculator select style probe has at least 16px text', parseFloat(getComputedStyle(select).fontSize) >= 16);
  wrapper.remove();
  const plain = document.createElement('select');
  document.body.append(plain);
  check('global native select style probe has at least 16px text', parseFloat(getComputedStyle(plain).fontSize) >= 16);
  plain.remove();
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  check('document IDs remain unique', new Set(ids).size === ids.length);
  check('one main and one H1 are retained', document.querySelectorAll('main').length === 1 && document.querySelectorAll('h1').length === 1);
  advanced.open = false;
  return { checks, total: checks.length, viewport, touch: matchMedia('(pointer: coarse)').matches };
}


export function runCalculatorContrastChecks() {
  const luminance = color => {
    const channel = color.match(/[0-9.]+/g).slice(0, 3).map(Number).map(value => {
      value /= 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channel[0] * 0.2126 + channel[1] * 0.7152 + channel[2] * 0.0722;
  };
  const ratio = (a, b) => { a = luminance(a); b = luminance(b); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const style = selector => getComputedStyle(document.querySelector(selector));
  const form = style('[data-calculator-form]').backgroundColor;
  const results = style('.calculator-results').backgroundColor;
  const input = style('[name=purchasePrice]');
  const pairs = [
    ['input text', input.color, input.backgroundColor, 4.5],
    ['field label', style('.calculator-field label').color, form, 4.5],
    ['field helper', style('.calculator-field-help').color, form, 4.5],
    ['result helper', style('.calculator-headlines .calculator-metric-help').color, results, 4.5],
    ['result value', style('.calculator-headlines [data-result-value]').color, results, 4.5],
    ['error text', style('.calculator-field-error').color, form, 4.5],
    ['input boundary', input.borderTopColor, input.backgroundColor, 3],
    ['reset button boundary', style('.calculator-reset').borderTopColor, form, 3],
  ];
  const measurements = pairs.map(([name, color, background, minimum]) => ({ name, ratio: ratio(color, background), minimum }));
  for (const measurement of measurements) require(measurement.ratio >= measurement.minimum, `contrast: ${measurement.name}`);
  return { checks: measurements.map(measurement => `contrast: ${measurement.name}`), measurements, total: measurements.length };
}


export function runCalculatorPrivacyChecks() {
  const form = document.querySelector('[data-calculator-form]');
  const rent = form.elements.namedItem('monthlyRent');
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSet = Storage.prototype.setItem;
  const href = location.href;
  const calls = { fetch: 0, xhr: 0, storage: 0 };
  window.fetch = function (...args) { calls.fetch += 1; return originalFetch.apply(this, args); };
  XMLHttpRequest.prototype.open = function (...args) { calls.xhr += 1; return originalOpen.apply(this, args); };
  Storage.prototype.setItem = function (...args) { calls.storage += 1; return originalSet.apply(this, args); };
  try {
    rent.value = '3000'; rent.dispatchEvent(new Event('input', { bubbles: true }));
    rent.value = '<img src=x onerror="window.calculatorInjected=true">';
    rent.dispatchEvent(new Event('input', { bubbles: true }));
    require(!window.calculatorInjected && !document.querySelector('[data-calculator] img'), 'untrusted values never become HTML');
    form.reset();
    require(!calls.fetch && !calls.xhr, 'calculator changes make no fetch or XHR requests');
    require(!calls.storage, 'calculator changes do not persist values to web storage');
    require(location.href === href, 'calculator values are not added to the URL');
    return { checks: ['untrusted values never become HTML', 'calculator changes make no fetch or XHR requests', 'calculator changes do not persist values to web storage', 'calculator values are not added to the URL'], calls, total: 4 };
  } finally {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    Storage.prototype.setItem = originalSet;
    form.reset();
  }
}


/** Follow-up copy/discovery checks and a simultaneous full-advanced reset. */
export async function runCalculatorRefinementChecks() {
  const { INPUT_GROUPS } = await import('/src/features/calculator/constants/input-fields.js');
  const checks = [];
  const check = (name, condition) => { require(condition, name); checks.push(name); };
  const form = document.querySelector('[data-calculator-form]');
  const advanced = form.querySelector('[data-advanced-assumptions]');
  const groups = INPUT_GROUPS.filter(group => group.advanced);
  const allFields = INPUT_GROUPS.flatMap(group => group.fields);
  form.reset();
  check('instructions distinguish entered amounts from formatted results', form.textContent.includes('Enter amounts in US dollars without commas. Results are formatted automatically.'));
  check('closed disclosure identifies thirty editable defaults', advanced.querySelector('summary').textContent.includes('30 pre-filled, editable assumptions'));
  advanced.open = true;
  const links = [...advanced.querySelectorAll('.calculator-group-navigation a')];
  check('every advanced group has a jump link and focusable heading', links.length === groups.length && links.every(link => {
    const target = document.getElementById(link.hash.slice(1));
    return target && target.tagName === 'LEGEND' && target.tabIndex === -1;
  }));
  for (const field of allFields) {
    await new Promise(resolve => setTimeout(resolve, 0));
    const input = form.elements.namedItem(field.name);
    input.value = String(Number(field.value) + 1);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  check('all thirty advanced values were changed together', groups.flatMap(group => group.fields).every(field => form.elements.namedItem(field.name).value !== String(field.value)));
  form.querySelector('button[type=reset]').click();
  check('reset button restores every primary and advanced default together', allFields.every(field => form.elements.namedItem(field.name).value === String(field.value)));
  check('reset also restores estimates and clears errors', document.querySelector('[data-headline=monthlyCashFlow] [data-result-value]').textContent === '$319' && form.querySelector('[data-calculator-errors]').hidden);
  check('formatted results retain thousands separators after reset', document.querySelector('[data-derived=loanAmount] [data-result-value]').textContent === '$202,500' && document.querySelector('[data-headline=totalCashRequired] [data-result-value]').textContent === '$70,200');
  check('reset preserves advanced disclosure openness', advanced.open);
  advanced.open = false;
  return { checks, total: checks.length };
}
