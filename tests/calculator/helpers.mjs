import assert from 'node:assert/strict';

export async function loadFeature(relativePath, exportName) {
  let module;
  try {
    module = await import(new URL(`../../src/features/calculator/${relativePath}`, import.meta.url));
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    module = {};
  }
  assert.ok(exportName in module, `Missing calculator feature: ${exportName}`);
  return module[exportName];
}

export function closeTo(actual, expected, tolerance = 1e-7) {
  assert.ok(Number.isFinite(actual), `Expected a finite number, received ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by more than ${tolerance}`);
}
