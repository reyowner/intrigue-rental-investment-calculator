import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature, closeTo } from './helpers.mjs';

const payment = () => loadFeature('utils/mortgage.js', 'monthlyMortgagePayment');
const schedule = () => loadFeature('utils/mortgage.js', 'buildMortgageSchedule');

test('monthly payment matches the source fixed-rate mortgage without cent rounding', async () => {
  const calculate = await payment();
  const result = calculate(202500, 0.065, 360);
  closeTo(result, 1279.937748, 1e-6);
  assert.equal(result.toFixed(2), '1279.94');
  assert.notEqual(result, 1279.94);
});

test('0% mortgage payment is principal divided by scheduled months', async () => {
  const calculate = await payment();
  assert.equal(calculate(120000, 0, 120), 120000 / 120);
  assert.equal(calculate(0, 0.065, 360), 0);
  closeTo(calculate(120000, 1e-14, 120), 120000 / 120, 1e-8);
});

test('monthly amortization reconciles source Year 1 and fully repays the default loan', async () => {
  const build = await schedule();
  const result = build(202500, 0.065, 360);
  assert.equal(result.months.length, 360);
  const firstYear = result.months.slice(0, 12);
  closeTo(firstYear.reduce((sum, m) => sum + m.principal, 0), 2263.394075, 1e-6);
  closeTo(firstYear.reduce((sum, m) => sum + m.interest, 0), 13095.8589, 1e-5);
  closeTo(result.months[59].endBalance, 189562.2293, 1e-4);
  assert.equal(result.months.at(-1).endBalance, 0);
  closeTo(result.months.reduce((sum, m) => sum + m.principal, 0), 202500, 1e-6);
  for (const month of result.months) {
    assert.ok(month.endBalance >= 0 && month.principal >= 0 && month.interest >= 0);
    closeTo(month.payment, month.principal + month.interest, 1e-8);
    closeTo(month.startBalance - month.principal, month.endBalance, 1e-8);
  }
});

test('short mortgages stop all payments and keep a zero balance after payoff', async () => {
  const build = await schedule();
  const result = build(120000, 0, 18);
  assert.equal(result.months[17].endBalance, 0);
  for (const month of result.months.slice(18)) {
    assert.deepEqual([month.payment, month.interest, month.principal, month.endBalance], [0, 0, 0, 0]);
  }
});

test('cash purchases have an all-zero mortgage schedule', async () => {
  const build = await schedule();
  const result = build(0, 0, 360);
  assert.equal(result.monthlyPayment, 0);
  assert.ok(result.months.every(m => m.payment === 0 && m.endBalance === 0));
});

for (const args of [[-1, 0.065, 360], [100, -1, 360], [100, 0, 0], [100, 0, 1.5], [Infinity, 0, 360]]) {
  test(`mortgage rejects invalid arguments ${JSON.stringify(args)}`, async () => {
    const calculate = await payment();
    assert.throws(() => calculate(...args), RangeError);
  });
}

test('nonzero loan principal cannot silently underflow to a zero monthly payment', async () => {
  const calculate = await payment();
  assert.throws(() => calculate(Number.MIN_VALUE, 0, 360), RangeError);
});

test('unsupported projection length and non-amortizing precision cases are rejected', async () => {
  const build = await schedule();
  assert.throws(() => build(100, 0, 12, 361), RangeError);
  assert.throws(() => build(100, 0, 12, -1), RangeError);
  assert.throws(() => build(202500, 1e100, 360), RangeError);
});
