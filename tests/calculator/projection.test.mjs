import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature, closeTo } from './helpers.mjs';

export const engine = () => loadFeature('engine.js', 'calculateInvestment');
const percentDisplay = value => Math.round(value * 10000) / 100;

test('default investment matches every assessment check figure across 30 years', async () => {
  const calculate = await engine();
  const result = calculate();
  assert.equal(result.ok, true);
  assert.equal(result.years.length, 30);
  assert.equal(result.mortgage.months.length, 360);
  assert.equal(result.initial.loanAmount, 202500);
  assert.equal(result.mortgage.monthlyPayment.toFixed(2), '1279.94');
  assert.equal(result.initial.totalCashRequired, 70200);
  const one = result.years[0];
  for (const [key, expected] of Object.entries({ grossRent: 28800, vacancyLoss: 1440, operatingIncome: 27360, noi: 19188, mortgagePayment: 15359, annualCashFlow: 3829, monthlyCashFlow: 319, principalPaydown: 2263, appreciation: 8100, depreciation: 4909 })) {
    assert.equal(Math.round(one[key]), expected, key);
  }
  for (const [key, expected] of Object.entries({ propertyTaxes: 2196, insurance: 1800, maintenance: 1440, management: 2736, total: 8172 })) {
    assert.equal(Math.round(one.expenses[key]), expected, key);
  }
  assert.equal(percentDisplay(one.capRate), 7.11);
  assert.equal(percentDisplay(one.cashOnCashReturn), 5.45);
  assert.equal(percentDisplay(one.irr), -11.36);
  assert.equal(Math.round(result.years[4].annualCashFlow), 6237);
  assert.equal(Math.round(result.years[4].equity), 123442);
  assert.equal(Math.round(result.years[9].annualCashFlow), 9677);
  assert.equal(percentDisplay(result.years[9].irr), 15.10);
  assert.equal(Math.round(result.years[29].expenses.insurance), 4242);
  assert.equal(Math.round(result.years[29].cumulativeCashFlow), 452099);
  assert.equal(percentDisplay(result.years[29].irr), 14.04);
  assert.deepEqual(result.headline, {
    capRate: one.capRate,
    cashOnCashReturn: one.cashOnCashReturn,
    monthlyCashFlow: one.monthlyCashFlow,
    totalCashRequired: result.initial.totalCashRequired,
    equityAtYear5: result.years[4].equity,
  });
  closeTo(one.netSaleProceeds, one.equity - one.propertyValue * 0.07, 1e-8);
  closeTo(one.cashFlowWithSale, one.annualCashFlow + one.netSaleProceeds, 1e-8);
});
