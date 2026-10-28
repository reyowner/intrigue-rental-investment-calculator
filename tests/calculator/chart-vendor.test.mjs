import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

test('vendored official UMD runs without runtime dependencies and matches provenance hash', async () => {
  const dir = new URL('../../assets/vendor/chartjs/', import.meta.url);
  const source = await readFile(new URL('chart.umd.min.js',dir),'utf8');
  const provenance=JSON.parse(await readFile(new URL('provenance.json',dir),'utf8'));
  assert.equal(createHash('sha256').update(source).digest('hex'),provenance.bundleSha256);
  const sandbox={}; vm.runInNewContext(source,sandbox);
  assert.equal(sandbox.Chart.version,'4.6.1');
  assert.match(await readFile(new URL('LICENSE.md',dir),'utf8'),/MIT License/);
  assert.match(await readFile(new URL('NOTICE.md',dir),'utf8'),/@kurkle\/color/);
});
