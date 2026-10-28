import test from 'node:test';
import assert from 'node:assert/strict';
import { projectionCharts } from '../../src/features/calculator/components/projection-charts.js';
import { readFile } from 'node:fs/promises';

test('chart controls are touch-sized with bounded responsive plot height and visible focus', async () => {
  const css=await readFile(new URL('../../src/features/calculator/components/projection-charts.css',import.meta.url),'utf8');
  assert.match(css,/\.projection-chart-plot\s*\{[^}]*height:\s*clamp\(/);
  assert.match(css,/min-height:\s*44px/);
  assert.match(css,/font-size:\s*16px/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/border-radius:\s*8px/);
  assert.doesNotMatch(css,/animation:|transition:|svg/);
});

test('static widget provides native controls, named canvas and table equivalent', () => {
  const html = projectionCharts();
  assert.equal((html.match(/<canvas\b/g) || []).length, 1);
  assert.match(html, /data-projection-charts/);
  assert.match(html, /data-chart-state="idle"/);
  assert.match(html, /data-projection-canvas/);
  assert.match(html, /data-chart-selected-value/);
  assert.doesNotMatch(html, /<svg/);
  for (const metric of ['annualCashFlow', 'equity']) assert.match(html, new RegExp(`data-chart-metric="${metric}"`));
  assert.match(html, /<select[^>]*data-chart-year/);
  assert.equal((html.match(/<option /g) || []).length, 30);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-describedby="projection-chart-description projection-table-heading"/);
  assert.match(html, /href="#projection-table-heading"/);
  for (const hook of ['status', 'retry', 'selection', 'value']) assert.match(html, new RegExp(`data-chart-${hook}`));
});
