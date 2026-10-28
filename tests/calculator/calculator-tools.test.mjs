import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatorTools } from '../../src/features/calculator/components/calculator-tools.js';

test('report and sharing tools are secondary native controls with explicit privacy and complete-report scope', () => {
  const html = calculatorTools();
  assert.match(html, /type="button"[^>]*data-save-report/);
  assert.match(html, /type="button"[^>]*data-share-deal/);
  assert.match(html, /all 30 years/);
  assert.match(html, /both graphs/);
  assert.match(html, /anyone with the link/i);
  assert.match(html, /contact details are not included/i);
  assert.match(html, /<textarea[^>]*readonly[^>]*data-share-url/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /<input|type="submit"/);
});


test('report tools belong to detailed results without changing the financial input inventory', async () => {
  const { calculator } = await import('../../src/features/calculator/components/calculator.js');
  const html = calculator();
  const form = html.match(/<form\b[\s\S]*?<\/form>/)[0];
  assert.doesNotMatch(form, /data-save-report|data-share-deal/);
  assert.equal((html.match(/<input /g) || []).length, 40);
  const details = html.slice(html.indexOf('<section class="projection-results"'));
  assert.match(details, /data-calculator-tools/);
  assert.ok(details.indexOf('data-overview=') < details.indexOf('data-calculator-tools'), 'headline estimates precede secondary export/share actions');
  assert.equal((details.match(/data-save-report/g) || []).length, 1);
});
