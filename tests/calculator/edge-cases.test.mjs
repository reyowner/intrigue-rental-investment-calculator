import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadFeature, closeTo } from './helpers.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/nonzero-expenses.json', import.meta.url), 'utf8'));
const engine = () => loadFeature('engine.js', 'calculateInvestment');

test('all seven utilities and ten annual miscellaneous lines match an independent Decimal fixture', async () => {
  const calculate = await engine();
  const result = calculate(fixture.inputs);
  assert.equal(result.ok, true);
  for (const expected of fixture.expectedYears) {
    const actual = result.years[expected.year - 1];
    closeTo(actual.grossRent, expected.grossRent);
    closeTo(actual.operatingIncome, expected.operatingIncome);
    closeTo(actual.noi, expected.noi);
    for (const [key, value] of Object.entries(expected.expenses)) {
      if (typeof value === 'object') {
        assert.deepEqual(Object.keys(actual.expenses[key]), Object.keys(value));
        for (const [name, amount] of Object.entries(value)) closeTo(actual.expenses[key][name], amount);
      } else closeTo(actual.expenses[key], value);
    }
  }
  closeTo(result.initial.totalCashRequired, 100000 + 10000 + 100000 * 0.02);
  assert.equal(result.initial.loanAmount, 0);
});

test('depreciation uses cost basis rather than ARV and stops at exactly 27.5 years', async () => {
  const calculate = await engine();
  const result = calculate(fixture.inputs);
  assert.equal(result.initial.depreciableBasis, fixture.depreciableBasis);
  const full = fixture.depreciableBasis / 27.5;
  for (const year of result.years.slice(0, 27)) closeTo(year.depreciation, full);
  closeTo(result.years[27].depreciation, full / 2);
  assert.equal(result.years[28].depreciation, 0);
  assert.equal(result.years[29].depreciation, 0);
  closeTo(result.years.reduce((sum, year) => sum + year.depreciation, 0), fixture.depreciableBasis, 1e-6);
  const noBuilding = calculate({ ...fixture.inputs, buildingPercent: 0 });
  assert.ok(noBuilding.years.every(year => year.depreciation === 0));
  assert.deepEqual(noBuilding.years.map(y => y.annualCashFlow), result.years.map(y => y.annualCashFlow));
  assert.deepEqual(noBuilding.years.map(y => y.irr), result.years.map(y => y.irr));
});

test('first-year appreciation uses ARV while cap rate uses beginning-of-year value', async () => {
  const calculate = await engine();
  const result = calculate(fixture.inputs);
  const one = result.years[0];
  closeTo(one.appreciation, fixture.inputs.afterRepairValue * 0.05);
  closeTo(one.capRate, one.noi / fixture.inputs.afterRepairValue);
  for (let i = 1; i < result.years.length; i += 1) {
    closeTo(result.years[i].startPropertyValue, result.years[i - 1].propertyValue);
  }
});

test('18-month zero-interest loan has a six-payment second year and no later mortgage', async () => {
  const calculate = await engine();
  const result = calculate({ interestRatePercent: 0, loanTermYears: 1.5 });
  const monthly = result.initial.loanAmount / 18;
  closeTo(result.years[0].mortgagePayment, monthly * 12);
  closeTo(result.years[1].mortgagePayment, monthly * 6);
  for (const year of result.years.slice(2)) {
    assert.equal(year.mortgagePayment, 0);
    assert.equal(year.mortgageInterest, 0);
    assert.equal(year.principalPaydown, 0);
    assert.equal(year.loanBalance, 0);
  }
});

test('loans longer than the projection retain their actual remaining balance', async () => {
  const calculate = await engine();
  const result = calculate({ loanTermYears: 40 });
  assert.equal(result.ok, true);
  assert.ok(result.years.at(-1).loanBalance > 0);
  closeTo(result.years.reduce((sum, y) => sum + y.principalPaydown, 0) + result.years.at(-1).loanBalance, result.initial.loanAmount, 1e-6);
});

test('zero-investment, zero-value models use null return ratios instead of NaN or fake zero returns', async () => {
  const calculate = await engine();
  const result = calculate({ purchasePrice: 0, afterRepairValue: 0, monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0 });
  assert.equal(result.ok, true);
  for (const year of result.years) {
    assert.equal(year.capRate, null);
    assert.equal(year.cashOnCashReturn, null);
    assert.equal(year.irr, null);
    assert.equal(year.unavailable.capRate, 'zero-denominator');
    assert.ok(year.unavailable.irr);
  }
});

test('declining growth, total loss, and 100% vacancy are handled without invalid arithmetic', async () => {
  const calculate = await engine();
  const result = calculate({ ...fixture.inputs, appreciationPercent: -100, rentGrowthPercent: -100, vacancyPercent: 100 });
  assert.equal(result.ok, true);
  assert.equal(result.years[0].operatingIncome, 0);
  assert.equal(result.years[0].expenses.management, 0);
  assert.equal(result.years[0].propertyValue, 0);
  assert.equal(result.years[1].grossRent, 0);
  assert.equal(result.years[1].startPropertyValue, 0);
  assert.equal(result.years[1].capRate, null);
});

test('zero-cost lines stay zero even when an unused growth factor would overflow', async () => {
  const calculate = await engine();
  const result = calculate({ utilitiesGrowthPercent: 1e308, miscellaneousGrowthPercent: 1e308 });
  assert.equal(result.ok, true);
  assert.ok(result.years.every(y => y.expenses.utilitiesTotal === 0 && y.expenses.miscellaneousTotal === 0));
});

test('unsupported numeric magnitudes return a model error, not infinite results', async () => {
  const calculate = await engine();
  const result = calculate({ monthlyRent: 1e308 });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'numeric-range');
  assert.equal(result.years, undefined);
});

test('public engine preserves validation errors and never mutates caller data', async () => {
  const calculate = await engine();
  assert.equal(calculate({ monthlyRent: '' }).ok, false);
  const before = JSON.stringify(fixture.inputs);
  calculate(fixture.inputs);
  assert.equal(JSON.stringify(fixture.inputs), before);
});

test('supplementary workbook returns use corrected cumulative wealth and sale accounting', async () => {
  const calculate = await engine();
  const result = calculate();
  for (const year of result.years) {
    closeTo(year.effectiveFutureValue, year.cumulativeCashFlow + year.netSaleProceeds);
    closeTo(year.returnOnEquity, year.effectiveNetCashFlow / year.equity);
    closeTo(year.annualizedReturn, (year.effectiveFutureValue / result.initial.totalCashRequired) ** (1 / year.year) - 1);
    closeTo(year.roi, (year.effectiveFutureValue - result.initial.totalCashRequired) / result.initial.totalCashRequired);
  }
});

test('zero ARV stays zero even with an unused extreme appreciation assumption', async () => {
  const calculate = await engine();
  const result = calculate({ afterRepairValue: 0, appreciationPercent: 1e308 });
  assert.equal(result.ok, true);
  assert.ok(result.years.every(y => y.propertyValue === 0 && y.startPropertyValue === 0));
});

test('supplementary ratios expose zero-basis and negative-wealth limitations explicitly', async () => {
  const calculate = await engine();
  const empty = calculate({ purchasePrice: 0, afterRepairValue: 0, monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0 });
  assert.equal(empty.ok, true);
  assert.equal(empty.years[0].returnOnEquity, null);
  assert.equal(empty.years[0].annualizedReturn, null);
  assert.equal(empty.years[0].roi, null);
  assert.ok(empty.years[0].unavailable.annualizedReturn);
  const loss = calculate({ afterRepairValue: 0, monthlyRent: 0 });
  assert.equal(loss.ok, true);
  assert.ok(loss.years[0].effectiveFutureValue < 0);
  assert.equal(loss.years[0].annualizedReturn, null);
  assert.equal(loss.years[0].unavailable.annualizedReturn, 'negative-future-value');
});

test('public projection reports ambiguous IRR when a repeated rate coexists with another rate', async () => {
  const calculate = await engine();
  const model = calculate({
    purchasePrice: 1, afterRepairValue: 97, downPaymentPercent: 100,
    buyingClosingPercent: 0, sellingClosingPercent: 0,
    monthlyRent: 37 / 12, monthlyPropertyTaxes: 29 / 12, monthlyInsurance: 0,
    vacancyPercent: 0, maintenancePercent: 0, managementPercent: 0,
    rentGrowthPercent: 0, propertyTaxGrowthPercent: 100, appreciationPercent: 0,
  });
  assert.equal(model.ok, true);
  assert.equal(model.years[2].irr, null);
  assert.equal(model.years[2].unavailable.irr, 'multiple-roots');
});
