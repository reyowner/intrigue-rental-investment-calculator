import { calculator } from '../../src/features/calculator/components/calculator.js';
import { initializeCalculator } from '../../src/features/calculator/calculator-controller.js';

function require(condition, message) { if (!condition) throw new Error(message); }

/** Run only in the disposable snapshot fixture; replaces its contents. */
export function runSnapshotChecks() {
  const root = document.getElementById('fixture');
  root.innerHTML = calculator();
  const api = initializeCalculator(root);
  const checks = [];
  const check = (value, text) => { require(value, text); checks.push(text); };
  check(typeof api?.getSnapshot === 'function' && typeof api.subscribe === 'function', 'calculator exposes a snapshot subscription without global deal storage');
  const initial = api.getSnapshot();
  check(initial.model.ok && initial.inputs.monthlyRent === '2400', 'snapshot contains raw inputs and the existing engine model');
  const seen = [];
  const unsubscribe = api.subscribe(snapshot => seen.push(snapshot));
  const rent = root.querySelector('[name="monthlyRent"]');
  rent.value = '3100.125'; rent.dispatchEvent(new Event('input', { bubbles: true }));
  check(seen.length === 1 && seen[0].inputs.monthlyRent === '3100.125' && seen[0].model.ok, 'one update publishes the current exact input strings and valid results');
  check(initial.inputs.monthlyRent === '2400', 'later edits do not mutate an earlier report snapshot');
  rent.value = ''; rent.dispatchEvent(new Event('input', { bubbles: true }));
  check(!api.getSnapshot().model.ok && seen.length === 2, 'invalid input publishes invalid state rather than cached financial results');
  rent.value = '2500'; api.refresh();
  check(api.getSnapshot().model.ok && api.getSnapshot().inputs.monthlyRent === '2500', 'explicit refresh validates and captures the current form');
  unsubscribe();
  rent.value = '2600'; rent.dispatchEvent(new Event('input', { bubbles: true }));
  check(seen.length === 3, 'unsubscribe stops subsequent notifications');
  api.revealResults({ focus: false });
  check(!root.querySelector('[data-projection]').hidden, 'shared valid deal can reveal existing results without a second engine');
  return { passed: checks.length, checks };
}
