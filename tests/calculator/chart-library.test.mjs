import test from 'node:test';
import assert from 'node:assert/strict';

test('library loads one pinned local script, shares pending work, and retries errors', async () => {
  const { loadChartLibrary } = await import('../../src/features/calculator/services/chart-library.js');
  const scripts = [];
  globalThis.document = { createElement: () => ({ remove() { this.removed = true; } }), head: { append(s) { scripts.push(s); } } };
  try {
    const first = loadChartLibrary();
    const second = loadChartLibrary();
    assert.equal(scripts.length, 1);
    assert.match(scripts[0].src, /assets\/vendor\/chartjs\/chart.umd.min.js$/);
    scripts[0].onerror();
    await assert.rejects(first);
    await assert.rejects(second);
    assert.equal(scripts[0].removed, true);
    const retry = loadChartLibrary();
    assert.equal(scripts.length, 2);
    globalThis.Chart = {version:'4.6.1'};
    scripts[1].onload();
    assert.equal(await retry, globalThis.Chart);
    assert.equal(await loadChartLibrary(), globalThis.Chart);
    assert.equal(scripts.length, 2);
  } finally { delete globalThis.document; delete globalThis.Chart; }
});
