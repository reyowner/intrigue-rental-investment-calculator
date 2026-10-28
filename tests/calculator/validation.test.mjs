import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature } from './helpers.mjs';

test('validation merges omitted defaults and parses decimal input without mutating the caller', async () => {
  const validate = await loadFeature('utils/validate-inputs.js', 'validateInputs');
  const input = { purchasePrice: ' 300000 ', monthlyUtilities: { gas: '17.5' }, loanTermYears: '15.5' };
  const before = JSON.stringify(input);
  const result = validate(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.purchasePrice, 300000);
  assert.equal(result.value.monthlyUtilities.gas, 17.5);
  assert.equal(result.value.monthlyUtilities.water, 0);
  assert.equal(result.value.loanTermYears, 15.5);
  assert.equal(result.value.insuranceGrowthPercent, 3);
  assert.equal(JSON.stringify(input), before);
});

for (const [name, input, field] of [
  ['blank', { monthlyRent: '' }, 'monthlyRent'],
  ['whitespace', { monthlyRent: '  ' }, 'monthlyRent'],
  ['null', { monthlyRent: null }, 'monthlyRent'],
  ['explicit undefined', { monthlyRent: undefined }, 'monthlyRent'],
  ['negative cost', { renovationCost: -1 }, 'renovationCost'],
  ['negative interest', { interestRatePercent: -1 }, 'interestRatePercent'],
  ['invalid suffix', { purchasePrice: '270000abc' }, 'purchasePrice'],
  ['hex string', { purchasePrice: '0x10' }, 'purchasePrice'],
  ['boolean', { purchasePrice: true }, 'purchasePrice'],
  ['infinity', { purchasePrice: Infinity }, 'purchasePrice'],
  ['NaN', { monthlyRent: NaN }, 'monthlyRent'],
  ['over 100% down', { downPaymentPercent: 101 }, 'downPaymentPercent'],
  ['over 100% vacancy', { vacancyPercent: 101 }, 'vacancyPercent'],
  ['over 100% building', { buildingPercent: 101 }, 'buildingPercent'],
  ['zero term', { loanTermYears: 0 }, 'loanTermYears'],
  ['partial month term', { loanTermYears: 0.1 }, 'loanTermYears'],
  ['growth below total loss', { appreciationPercent: -101 }, 'appreciationPercent'],
  ['invalid nested group', { monthlyUtilities: null }, 'monthlyUtilities'],
  ['negative utility', { monthlyUtilities: { gas: -2 } }, 'monthlyUtilities.gas'],
  ['negative annual expense', { annualMiscellaneous: { accounting: -3 } }, 'annualMiscellaneous.accounting'],
  ['unknown input', { purchasePrce: 270000 }, 'purchasePrce'],
  ['unknown utility', { monthlyUtilities: { unexpected: 1 } }, 'monthlyUtilities.unexpected'],
]) {
  test(`validation rejects ${name} with a field-specific error`, async () => {
    const validate = await loadFeature('utils/validate-inputs.js', 'validateInputs');
    const result = validate(input);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(error => error.field === field && error.code && error.message));
    assert.equal(result.value, undefined);
  });
}

test('validation allows zero amounts, 0% interest, cash purchases, and declining growth', async () => {
  const validate = await loadFeature('utils/validate-inputs.js', 'validateInputs');
  const result = validate({ purchasePrice: 0, afterRepairValue: 0, monthlyRent: 0, downPaymentPercent: 100, interestRatePercent: 0, appreciationPercent: -100, rentGrowthPercent: -2 });
  assert.equal(result.ok, true);
  assert.equal(result.value.appreciationPercent, -100);
});

for (const input of [null, [], 'deal', 4]) {
  test(`validation rejects non-object model input ${JSON.stringify(input)}`, async () => {
    const validate = await loadFeature('utils/validate-inputs.js', 'validateInputs');
    const result = validate(input);
    assert.equal(result.ok, false);
    assert.equal(result.errors[0].field, '$');
  });
}
