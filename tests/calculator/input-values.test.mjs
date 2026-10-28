import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature } from './helpers.mjs';
import { calculateInvestment, DEFAULT_INPUTS } from '../../src/features/calculator/engine.js';
import { INPUT_GROUPS } from '../../src/features/calculator/constants/input-fields.js';

const entries = () => INPUT_GROUPS.flatMap(group => group.fields.map(field => [field.name, String(field.value)]));

test('form entry adapter sends every raw field to the engine without losing nested expenses or blank values', async () => {
  const read = await loadFeature('utils/input-values.js', 'readInputValues');
  const source = entries();
  const input = read(source);
  assert.deepEqual(calculateInvestment(input).inputs, DEFAULT_INPUTS);
  source.find(([name]) => name === 'monthlyUtilities.water')[1] = '33.50';
  source.find(([name]) => name === 'annualMiscellaneous.legal')[1] = '240';
  source.find(([name]) => name === 'monthlyRent')[1] = '';
  const changed = read(source);
  assert.equal(changed.monthlyUtilities.water, '33.50');
  assert.equal(changed.annualMiscellaneous.legal, '240');
  assert.equal(changed.monthlyRent, '');
  assert.equal(calculateInvestment(changed).ok, false);
  assert.equal(DEFAULT_INPUTS.monthlyUtilities.water, 0);
  assert.equal(read([]).purchasePrice, null);
});
