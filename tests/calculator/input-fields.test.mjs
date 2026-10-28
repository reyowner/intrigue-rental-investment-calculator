import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature } from './helpers.mjs';
import { DEFAULT_INPUTS } from '../../src/features/calculator/engine.js';

const schema = () => loadFeature('constants/input-fields.js', 'INPUT_GROUPS');
const flattenDefaults = Object.entries(DEFAULT_INPUTS).flatMap(([key, value]) =>
  typeof value === 'object' ? Object.keys(value).map(name => `${key}.${name}`) : [key]);

test('input definitions cover every engine assumption exactly once, with helper text and source defaults', async () => {
  const groups = await schema();
  const fields = groups.flatMap(group => group.fields);
  assert.deepEqual(fields.map(field => field.name).sort(), [...flattenDefaults].sort());
  assert.equal(new Set(fields.map(field => field.name)).size, fields.length);
  for (const field of fields) {
    assert.ok(field.label.trim().length > 2, field.name);
    assert.ok(field.help.trim().length > 15, field.name);
    assert.ok(['currency', 'monthly', 'annual', 'percent', 'years'].includes(field.unit), field.name);
    const source = field.name.split('.').reduce((value, key) => value[key], DEFAULT_INPUTS);
    assert.equal(field.value, source, field.name);
  }
  assert.deepEqual(groups.filter(group => !group.advanced).flatMap(group => group.fields.map(field => field.name)), [
    'purchasePrice', 'afterRepairValue', 'renovationCost', 'downPaymentPercent',
    'interestRatePercent', 'loanTermYears', 'monthlyRent', 'monthlyPropertyTaxes', 'monthlyInsurance', 'monthlyHoa',
  ]);
  const advanced = groups.filter(group => group.advanced).flatMap(group => group.fields);
  assert.equal(advanced.filter(field => field.name.startsWith('monthlyUtilities.')).length, 7);
  assert.equal(advanced.filter(field => field.name.startsWith('annualMiscellaneous.')).length, 10);
});
