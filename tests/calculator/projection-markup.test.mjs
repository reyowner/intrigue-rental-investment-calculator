import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { calculateInvestment } from '../../src/features/calculator/engine.js';

async function render(model) {
  assert.ok(existsSync(new URL('../../src/features/calculator/components/projection-results.js', import.meta.url)), 'the long-term projection component must exist');
  return (await import('../../src/features/calculator/components/projection-results.js')).projectionResults(model);
}

test('projection markup renders a semantic complete table with year navigation and row explanations', async () => {
  const html = await render(calculateInvestment());
  assert.equal((html.match(/data-projection-row=/g) || []).length, 51);
  assert.equal((html.match(/data-projection-cell=/g) || []).length, 1530);
  assert.equal((html.match(/scope="col" id="projection-year-/g) || []).length, 30);
  assert.ok(html.includes('id="projection-year-30"'));
  assert.ok(html.includes('role="region" tabindex="0"'));
  assert.ok(html.includes('aria-labelledby="projection-table-heading"'));
  assert.ok(html.includes('<caption'));
  assert.ok(html.includes('Annual amounts in US dollars, except monthly cash flow and percentage returns.'));
  assert.ok(html.includes('id="projection-year-jump"'));
  assert.ok(html.includes('<option value="30">Year 30</option>'));
  assert.ok(html.includes('headers="projection-row-grossRent projection-year-1 projection-group-income"'));
  assert.ok(html.includes('id="projection-help-grossRent"'));
  assert.ok(html.includes('Understand these numbers'));
  assert.ok(html.includes('data-projection-charts'));
  assert.ok(!html.includes('planned for the next development phase'));
});


test('the live calculator includes its engine-backed long-term results rather than a future-phase placeholder', async () => {
  const { calculator } = await import('../../src/features/calculator/components/calculator.js');
  const html = calculator();
  assert.ok(html.includes('data-projection-table'));
  assert.ok(html.includes('data-view-results'));
  assert.ok(!html.includes('planned for the next development phase'));
});
