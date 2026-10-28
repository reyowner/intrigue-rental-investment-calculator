import test from 'node:test';
import assert from 'node:assert/strict';
import { calculator } from '../../src/features/calculator/components/calculator.js';

// Results navigation changes presentation, not the live model or financial controls.
test('the detailed projection starts hidden behind one explicit form-submit results action', () => {
  const html = calculator();
  const form = html.match(/<form\b[\s\S]*?<\/form>/)[0];
  const projection = html.match(/<section class="projection-results"[^>]*>/)[0];
  assert.match(projection, /\bhidden\b/);
  assert.equal((form.match(/data-view-results/g) || []).length, 1);
  assert.match(form, /type="submit"[^>]*aria-controls="projection"[^>]*aria-expanded="false"[^>]*data-view-results/);
  assert.ok(form.indexOf('data-view-results') > form.indexOf('data-advanced-assumptions'));
  assert.equal((form.match(/<input /g) || []).length, 40);
  assert.equal((html.match(/data-headline=/g) || []).length, 5);
});


test('edit and contact actions belong to detailed results rather than competing with input navigation', () => {
  const html = calculator();
  const preview = html.match(/<aside class="calculator-results"[\s\S]*?<\/aside>/)[0];
  assert.doesNotMatch(preview, /calculator-edit-link|calculator-projection-link|href="#contact"/);
  assert.equal((html.match(/data-edit-property/g) || []).length, 1);
  const details = html.slice(html.indexOf('<section class="projection-results"'));
  assert.match(details, /data-edit-property[^>]*>Edit property numbers/);
  assert.match(details, /class="projection-next-step"/);
  assert.match(details, /href="#contact"/);
});


test('the revealed destination repeats the five headline figures without new financial inputs', () => {
  const html = calculator();
  const details = html.slice(html.indexOf('<section class="projection-results"'));
  assert.equal((details.match(/data-overview=/g) || []).length, 5);
  assert.ok(details.indexOf('data-overview=') < details.indexOf('data-projection-charts'));
  assert.match(details, /7\.11%/);
  assert.match(details, /\$123,442/);
});
