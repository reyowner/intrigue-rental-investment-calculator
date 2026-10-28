import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvestment } from '../../src/features/calculator/engine.js';

test('chart view preserves all 30 raw engine values without mutation and normalizes unsafe ranges', async () => {
  const { buildProjectionChartConfig } = await import('../../src/features/calculator/utils/projection-chart-view.js');
  const model = calculateInvestment();
  const before = structuredClone(model);
  for (const metric of ['annualCashFlow', 'equity']) {
    const config = buildProjectionChartConfig(model, metric, 30);
    assert.deepEqual(config.data.datasets[0].rawValues, model.years.map(y => y[metric]));
    assert.deepEqual(config.data.labels, model.years.map(y => y.year));
    assert.equal(config.options.projectionMetric, metric);
    assert.equal(config.options.animation, false);
    assert.equal(config.data.datasets[0].pointRadius[29], 5);
    assert.equal(config.data.datasets[0].clip, false, 'selected point at the domain edge must remain visible');
  }
  assert.deepEqual(model, before);
  for (const value of [0, -500, 500, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE]) {
    const values = Array.from({length:30}, (_, i) => i % 2 ? value : -value);
    const fixture = {ok:true, years:values.map((v,i) => ({year:i+1, annualCashFlow:v, equity:v}))};
    const config = buildProjectionChartConfig(fixture);
    const ds = config.data.datasets[0];
    assert.deepEqual(ds.rawValues, values);
    assert.equal(ds.data.length, 30);
    assert.ok(ds.data.every(Number.isFinite));
    assert.ok(config.options.scales.y.min <= 0 && config.options.scales.y.max >= 0);
    assert.ok(config.options.scales.y.max > config.options.scales.y.min);
    const tip = config.options.plugins.tooltip.callbacks.label({dataset:ds, dataIndex:1});
    assert.doesNotMatch(tip, /NaN|Infinity/);
    if (Math.abs(value) === Number.MIN_VALUE) {
      assert.equal(config.options.scales.y.ticks.callback(.5), null, 'underflow must not create another zero tick');
      assert.equal(config.options.scales.y.ticks.callback(0), '$0');
    }
  }
});
