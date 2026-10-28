import test from 'node:test';
import assert from 'node:assert/strict';
import { calculator } from '../../src/features/calculator/components/calculator.js';

test('amount instructions distinguish entered values from automatically formatted results', () => {
  const markup = calculator();
  assert.ok(markup.includes('Enter amounts in US dollars without commas. Results are formatted automatically.'));
  assert.ok(markup.includes('$202,500'));
  assert.ok(markup.includes('$70,200'));
});


test('advanced disclosure identifies editable defaults and links to each existing group', () => {
  const markup = calculator();
  assert.match(markup, /30 pre-filled, editable assumptions/);
  assert.match(markup, /aria-label="Advanced assumption groups"/);
  for (const group of ['reserves', 'utilities', 'miscellaneous', 'growth', 'value-and-closing']) {
    assert.ok(markup.includes(`href="#assumptions-${group}"`), group);
    assert.ok(markup.includes(`id="assumptions-${group}" tabindex="-1"`), group);
  }
});


test('estimate copy explains form inputs, source spreadsheet, adapted example, and tool-specific calculation updates', async () => {
  const { calculatorIntro } = await import('../../src/features/homepage/sections/calculator-intro/calculator-intro.js');
  const { howItWorks } = await import('../../src/features/homepage/sections/how-it-works/how-it-works.js');
  const { siteFooter } = await import('../../src/components/site-footer/site-footer.js');
  const section = calculatorIntro();
  assert.ok(section.includes('Estimates are calculated from the numbers and assumptions entered in this form.'));
  assert.ok(section.includes("The calculator adapts Intrigue's rental-property analysis spreadsheet, with the calculation updates specified for this tool."));
  assert.ok(!section.includes('not universal market assumptions'));
  assert.ok(howItWorks().includes("adapted from a real duplex in Intrigue's rental-property analysis spreadsheet"));
  assert.ok(!howItWorks().includes('not a set of market assumptions'));
  assert.ok(calculator().includes('These results reflect the inputs in this form.'));
  assert.ok(siteFooter().includes('Estimates based on your inputs. Actual results may vary.'));
});
