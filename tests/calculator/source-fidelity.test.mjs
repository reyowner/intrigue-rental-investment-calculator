import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadFeature, closeTo } from './helpers.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/source-inputs.json', import.meta.url), 'utf8'));

test('each numeric source input maps to its workbook cell with correct percentage units', async () => {
  const defaults = await loadFeature('constants/default-inputs.js', 'DEFAULT_INPUTS');
  for (const field of fixture.fields) {
    const actual = field.path.split('.').reduce((value, key) => value[key], defaults);
    closeTo(actual, field.expected, 1e-12);
  }
  assert.equal(new Set(fixture.fields.map(f => f.cell)).size, fixture.fields.length);
  assert.equal(defaults.insuranceGrowthPercent, 3);
  assert.equal(defaults.hoaGrowthPercent, 3);
});
