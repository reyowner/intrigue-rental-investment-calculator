import { analyzePositiveRoots } from './polynomial-roots.js';

const unavailable = reason => ({ status: 'unavailable', value: null, reason });

function signChanges(coefficients) {
  let previous = 0;
  let changes = 0;
  for (const value of coefficients) {
    const sign = Math.sign(value);
    if (sign && previous && sign !== previous) changes += 1;
    if (sign) previous = sign;
  }
  return changes;
}

function bernstein(values) {
  const scale = Math.max(...values.map(Math.abs));
  const degree = values.length - 1;
  let choose = 1;
  const coefficients = values.map((value, i) => {
    if (i > 0) choose *= (degree - i + 1) / i;
    return (value / scale) / choose;
  });
  if (coefficients.some((value, i) => value === 0 && values[i] !== 0)) {
    throw new RangeError('The IRR coefficients exceed numeric precision.');
  }
  return coefficients;
}

// Bounded de Casteljau evaluation avoids overflowing powers of q = 1/(1+r).
function evaluate(coefficients, x) {
  const row = [...coefficients];
  for (let size = row.length - 1; size > 0; size -= 1) {
    for (let i = 0; i < size; i += 1) row[i] = (1 - x) * row[i] + x * row[i + 1];
  }
  return row[0];
}

/**
 * Annual IRR for at most 30 periods, returned as a fraction.
 * One sign change proves one positive discount-factor root. For other cash
 * flows, exact BigInt Sturm counting distinguishes distinct roots, including
 * repeated roots that floating-point sign subdivision can miss. A unique root
 * is refined from the square-free polynomial on x = q/(1+q), in (0,1).
 * Multiple roots, absent roots, and precision-budget limits are explicit.
 */
export function solveIrr(cashFlows) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2 || cashFlows.length > 31
    || !cashFlows.every(value => typeof value === 'number' && Number.isFinite(value))) {
    return unavailable('invalid-cash-flows');
  }
  const flows = [...cashFlows];
  while (flows.length && flows[0] === 0) flows.shift();
  while (flows.length && flows.at(-1) === 0) flows.pop();
  const changes = signChanges(flows);
  if (flows.length < 2 || changes === 0) return unavailable('no-sign-change');

  try {
    const original = bernstein(flows);
    let coefficients = original;
    let left = 0;
    let right = 1;
    let exactX = null;
    if (changes > 1) {
      const analysis = analyzePositiveRoots(flows);
      if (analysis.status === 'multiple') return unavailable('multiple-roots');
      if (analysis.status === 'none') return unavailable('no-root');
      if (analysis.rootX !== undefined) exactX = analysis.rootX;
      else if (analysis.interval) ({ left, right, coefficients } = analysis.interval);
      else coefficients = bernstein(analysis.coefficients);
    }
    let low = 0;
    let high = 1;
    if (exactX === null) {
      if (Math.sign(coefficients[0]) === Math.sign(coefficients.at(-1))) return unavailable('numeric-precision');
      const lowSign = Math.sign(coefficients[0]);
      for (let iteration = 0; iteration < 160; iteration += 1) {
        const middle = (low + high) / 2;
        if (middle === low || middle === high) break;
        const value = evaluate(coefficients, middle);
        if (value === 0) { low = middle; high = middle; break; }
        if (Math.sign(value) === lowSign) low = middle;
        else high = middle;
      }
    }
    const x = exactX ?? left + (right - left) * ((low + high) / 2);
    const residual = Math.abs(evaluate(original, x));
    const magnitude = evaluate(original.map(Math.abs), x);
    const value = 1 / x - 2;
    if (!magnitude || residual / magnitude > 1e-10 || !Number.isFinite(value) || value <= -1) {
      return unavailable('numeric-precision');
    }
    return { status: 'ok', value: value === 0 ? 0 : value, reason: null };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return unavailable('numeric-precision');
  }
}
