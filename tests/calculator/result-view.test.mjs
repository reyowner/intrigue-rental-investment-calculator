import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature } from './helpers.mjs';
import { calculateInvestment } from '../../src/features/calculator/engine.js';

const view = () => loadFeature('utils/result-view.js', 'buildResultView');

test('result presentation formats the actual default engine outputs without changing the financial model', async () => {
  const build = await view();
  const model = calculateInvestment();
  const before = JSON.stringify(model);
  const result = build(model);
  assert.equal(result.valid, true);
  assert.deepEqual(result.headline.map(item => [item.key, item.value]), [
    ['capRate', '7.11%'], ['cashOnCashReturn', '5.45%'], ['monthlyCashFlow', '$319'],
    ['totalCashRequired', '$70,200'], ['equityAtYear5', '$123,442'],
  ]);
  assert.deepEqual(result.derived.map(item => item.value), ['$202,500', '$1,279.94', '$2,700', '$70,200']);
  assert.ok(result.headline.every(item => item.help && !item.unavailable));
  assert.equal(JSON.stringify(model), before);
});


test('undefined returns display N/A with the reason instead of a false zero percent', async () => {
  const build = await view();
  const model = calculateInvestment({ purchasePrice: 0, afterRepairValue: 0, renovationCost: 0 });
  const result = build(model);
  for (const key of ['capRate', 'cashOnCashReturn']) {
    const metric = result.headline.find(item => item.key === key);
    assert.equal(metric.value, 'N/A');
    assert.match(metric.unavailable, /zero/i);
  }
  assert.equal(result.headline.find(item => item.key === 'totalCashRequired').value, '$0');
});


test('invalid models clear every derived and headline value, not just the field that failed', async () => {
  const build = await view();
  for (const model of [calculateInvestment({ monthlyRent: '' }), calculateInvestment({ monthlyRent: 1e308 })]) {
    const result = build(model);
    assert.equal(result.valid, false);
    assert.ok([...result.headline, ...result.derived].every(item => item.value === 'N/A' && /correct|supported/i.test(item.unavailable)));
  }
});

test('genuine zero and negative returns remain numeric, not unavailable', async () => {
  const build = await view();
  const zero = build(calculateInvestment({ monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0, downPaymentPercent: 100 }));
  assert.equal(zero.headline.find(item => item.key === 'cashOnCashReturn').value, '0.00%');
  const negative = build(calculateInvestment({ monthlyRent: 0 }));
  assert.match(negative.headline.find(item => item.key === 'monthlyCashFlow').value, /^-\$/);
  assert.equal(negative.headline.find(item => item.key === 'monthlyCashFlow').unavailable, '');
});
