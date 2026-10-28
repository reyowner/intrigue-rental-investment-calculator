const require = (condition, name) => { if (!condition) throw new Error(name); };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

/** Run first in a fresh disposable document; detailed results must initially be closed. */
export async function runResultsFlowChecks() {
  const checks = [];
  const check = (name, condition) => { require(condition, name); checks.push(name); };
  const form = document.querySelector('[data-calculator-form]');
  const workspace = document.querySelector('[data-calculator]');
  const projection = workspace.querySelector('[data-projection]');
  const button = form.querySelector('[data-view-results]');
  const heading = projection.querySelector('#projection-heading');
  const advanced = form.querySelector('[data-advanced-assumptions]');
  const rent = form.elements.namedItem('monthlyRent');
  const cell = projection.querySelector('[data-projection-row="grossRent"] [data-projection-cell="1"]');
  const change = (name, value) => { const input = form.elements.namedItem(name); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); return input; };
  check('detailed results start closed while all five headlines remain available', projection.hidden && workspace.querySelectorAll('[data-headline]').length === 5);
  check('one explicit results action follows the financial inputs', form.querySelectorAll('[data-view-results]').length === 1 && button.type === 'submit');
  check('edit and projection links are not concatenated in the live preview', !workspace.querySelector('.calculator-results .calculator-edit-link') && !workspace.querySelector('.calculator-results .calculator-projection-link'));
  change('monthlyRent', '2500');
  check('headlines update before results are opened', workspace.querySelector('[data-headline="monthlyCashFlow"] [data-result-value]').textContent !== '$319' && projection.hidden);
  check('the hidden detailed table already reflects the latest inputs', cell.querySelector('[data-projection-value]').textContent === '$30,000');
  change('monthlyRent', ''); button.click(); await tick();
  check('invalid primary input blocks reveal and receives focus', projection.hidden && document.activeElement === rent && rent.getAttribute('aria-invalid') === 'true');
  change('monthlyRent', '2500');
  const water = change('monthlyUtilities.water', ''); advanced.open = false; button.click(); await tick();
  check('invalid advanced input is revealed and focused instead of showing stale results', projection.hidden && advanced.open && document.activeElement === water);
  change('monthlyUtilities.water', '0'); advanced.open = false;
  const href = location.href;
  button.click(); await tick();
  check('View results reveals the complete results in place', !projection.hidden && !projection.querySelector('[data-projection-valid]').hidden);
  check('reveal moves keyboard focus to the results heading', document.activeElement === heading);
  check('the detailed destination includes all five synchronized headline figures', [...projection.querySelectorAll('[data-overview]')].length === 5 && [...projection.querySelectorAll('[data-overview]')].every(node => node.querySelector('[data-result-value]').textContent === workspace.querySelector(`[data-headline="${node.dataset.overview}"] [data-result-value]`).textContent));
  check('results action exposes its expanded state', button.getAttribute('aria-expanded') === 'true');
  check('revealing results neither navigates away nor sends values to the URL', location.href === href);
  check('reveal preserves the table and every form control', projection.querySelector('[data-projection-row="grossRent"] [data-projection-cell="1"]') === cell && form.elements.namedItem('monthlyRent') === rent);
  projection.querySelector('[data-edit-property]').click(); await tick();
  check('Edit property numbers returns to the form without losing the deal', location.hash === '#deal-inputs-heading' && document.activeElement.id === 'deal-inputs-heading' && rent.value === '2500');
  change('monthlyRent', '2600');
  check('opened details remain live without another results click', !projection.hidden && cell.querySelector('[data-projection-value]').textContent === '$31,200');
  change('monthlyRent', '');
  check('invalid input after reveal shows a correction state rather than old results', !projection.hidden && projection.querySelector('[data-projection-valid]').hidden && !projection.querySelector('[data-projection-invalid]').hidden);
  change('monthlyRent', '2400');
  check('correcting an opened deal restores results without resubmission', !projection.hidden && !projection.querySelector('[data-projection-valid]').hidden && cell.querySelector('[data-projection-value]').textContent === '$28,800');
  form.reset();
  check('reset restores every input and the example while keeping results available', [...form.querySelectorAll('input[name]')].every(input => input.value === input.defaultValue) && !projection.hidden && workspace.querySelector('[data-headline="monthlyCashFlow"] [data-result-value]').textContent === '$319');
  return { passed: checks.length, checks };
}


export function runResultsActionLayoutChecks() {
  const form = document.querySelector('[data-calculator-form]');
  const button = form.querySelector('[data-view-results]');
  form.scrollIntoView({ block: 'start', behavior: 'instant' });
  const rect = button.getBoundingClientRect();
  const style = getComputedStyle(button);
  const checks = {
    resultActionHasTouchTarget: rect.height >= 44,
    resultActionUsesBrandCorners: style.borderRadius === '8px',
    noPageOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
    onePrimaryResultsAction: form.querySelectorAll('[data-view-results]').length === 1,
  };
  if (innerWidth < 1024) checks.mobileResultsActionIsReachableWhileEditing = rect.top >= 0 && rect.bottom <= innerHeight;
  for (const [name, value] of Object.entries(checks)) require(value, name);
  return { passed: Object.keys(checks).length, checks };
}


export async function runStickyResultsFocusChecks() {
  const form = document.querySelector('[data-calculator-form]');
  const advanced = form.querySelector('[data-advanced-assumptions]');
  const wasOpen = advanced.open;
  advanced.open = true;
  const checks = [];
  try {
    for (const name of ['purchasePrice', 'renovationCost', 'monthlyRent', 'monthlyHoa', 'vacancyPercent', 'monthlyUtilities.water', 'annualMiscellaneous.trashRemoval', 'insuranceGrowthPercent', 'sellingClosingPercent']) {
      form.elements.namedItem(name).focus();
      let field, bar, header;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
        field = form.elements.namedItem(name).getBoundingClientRect();
        bar = form.querySelector('.calculator-submit-row').getBoundingClientRect();
        header = document.querySelector('.site-header').getBoundingClientRect();
        if (field.top >= header.bottom && field.bottom <= bar.top) break;
      }
      const label = `focused ${name} is not covered by the floating header or results action`;
      require(field.top >= header.bottom && field.bottom <= bar.top, label);
      checks.push(label);
    }
  } finally { advanced.open = wasOpen; }
  return { passed: checks.length, checks };
}
