import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature, closeTo } from './helpers.mjs';

const solver = () => loadFeature('utils/irr.js', 'solveIrr');

for (const [flows, expected] of [
  [[-100, 110], 110 / 100 - 1],
  [[-100, 50], 50 / 100 - 1],
  [[-100, 100], 0],
  [[-100, 1100], 1100 / 100 - 1],
  [[-100, 0.1], 0.1 / 100 - 1],
  [[0, -100, 110, 0], 110 / 100 - 1],
  [[100, -110], 110 / 100 - 1],
]) {
  test(`IRR solves a unique annual return for ${JSON.stringify(flows)}`, async () => {
    const solve = await solver();
    const result = solve(flows);
    assert.equal(result.status, 'ok');
    closeTo(result.value, expected, 1e-9);
    assert.equal(result.reason, null);
  });
}

test('IRR reports multiple roots instead of choosing a guess-dependent return', async () => {
  const solve = await solver();
  const result = solve([-100, 230, -132]);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.value, null);
  assert.equal(result.reason, 'multiple-roots');
});

test('IRR recognizes a repeated but unique zero-rate root', async () => {
  const solve = await solver();
  const result = solve([-100, 200, -100]);
  assert.equal(result.status, 'ok');
  closeTo(result.value, 0, 1e-10);
});

for (const flows of [[-100, -10], [100, 10], [0, 0], [-100, 100, -100]]) {
  test(`IRR is unavailable when no finite real return exists for ${JSON.stringify(flows)}`, async () => {
    const solve = await solver();
    const result = solve(flows);
    assert.equal(result.status, 'unavailable');
    assert.equal(result.value, null);
    assert.ok(result.reason);
  });
}

for (const flows of [null, [], [-100], [-100, Infinity], [-100, NaN], [-100, '110']]) {
  test(`IRR safely rejects malformed cash flows ${JSON.stringify(flows)}`, async () => {
    const solve = await solver();
    assert.deepEqual(solve(flows), { status: 'unavailable', value: null, reason: 'invalid-cash-flows' });
  });
}

test('IRR does not miss a repeated root when a second distinct return exists', async () => {
  const solve = await solver();
  // Polynomial: (3q - 1)^2 (2q - 1), q = 1/(1+r).
  assert.deepEqual(solve([-1, 8, -21, 18]), { status: 'unavailable', value: null, reason: 'multiple-roots' });
});

for (const [flows, expected] of [[[-1, 6, -9], 2], [[-4, 12, -9], 0.5]]) {
  test(`IRR recognizes a unique nondyadic repeated root for ${JSON.stringify(flows)}`, async () => {
    const solve = await solver();
    const result = solve(flows);
    assert.equal(result.status, 'ok');
    closeTo(result.value, expected, 1e-9);
  });
}

test('degree-30 repeated roots count as one distinct return, not thirty', async () => {
  const solve = await solver();
  const flows = [];
  let choose = 1;
  for (let power = 0; power <= 30; power += 1) {
    if (power > 0) choose = choose * (31 - power) / power;
    flows.push(Math.round(choose) * (power % 2 ? -1 : 1));
  }
  const result = solve(flows); // (q - 1)^30
  assert.equal(result.status, 'ok');
  closeTo(result.value, 0, 1e-9);
});

function multiplyFactors(factors) {
  let coefficients = [1];
  for (const factor of factors) {
    const next = Array(coefficients.length + factor.length - 1).fill(0);
    coefficients.forEach((a, i) => factor.forEach((b, j) => { next[i + j] += a * b; }));
    coefficients = next;
  }
  assert.ok(coefficients.every(Number.isSafeInteger));
  return coefficients;
}

for (const [name, factors, expected] of [
  ['repeated one-third discount factor with negative roots', [[-1, 3], [-1, 3], [1, 1], [1, 1]], 2],
  ['odd multiplicity with a negative root', [[-1, 2], [-1, 2], [-1, 2], [1, 3]], 1],
  ['degree-30 repeated half discount factor', Array.from({ length: 30 }, () => [-1, 2]), 1],
]) {
  test(`exact IRR counting handles ${name}`, async () => {
    const solve = await solver();
    const result = solve(multiplyFactors(factors));
    assert.equal(result.status, 'ok');
    closeTo(result.value, expected, 1e-9);
  });
}

for (const [name, factors] of [
  ['two repeated positive roots', [[-1, 3], [-1, 3], [-1, 2], [-1, 2]]],
  ['nearby distinct positive roots', [[-999, 1000], [-1001, 1000]]],
]) {
  test(`exact IRR counting rejects ${name}`, async () => {
    const solve = await solver();
    assert.equal(solve(multiplyFactors(factors)).reason, 'multiple-roots');
  });
}

test('exact IRR counting proves absence of positive roots in a mixed-sign polynomial', async () => {
  const solve = await solver();
  const result = solve(multiplyFactors([[1, 0, 1], [2, -2, 1]]));
  assert.equal(result.reason, 'no-root');
});

test('exact fast bounds preserve a dyadic boundary root alongside two interior roots', async () => {
  const solve = await solver();
  assert.equal(solve(multiplyFactors([[-1, 1], [-1, 2], [-1, 3]])).reason, 'multiple-roots');
});
