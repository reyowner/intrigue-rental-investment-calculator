// Exact positive-root counting for the uncommon nonconventional IRR case.
// IEEE-754 inputs are rational numbers. Clearing their powers-of-two
// denominators lets BigInt Sturm arithmetic distinguish repeated roots without
// floating-point sign guesses. No BigInts escape into the public result model.
const MAX_COEFFICIENT_BITS = 16384;
const abs = value => value < 0n ? -value : value;
const sign = value => value < 0n ? -1 : value > 0n ? 1 : 0;

function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function trim(poly) {
  while (poly.length && poly.at(-1) === 0n) poly.pop();
  return poly;
}

// Divide by positive content only: Sturm signs must not be arbitrarily flipped.
function primitive(poly) {
  return normalizeContent(trim(poly));
}

// Bernstein endpoint zeroes are meaningful and must retain their array slots.
function normalizeContent(poly) {
  let content = 0n;
  for (const coefficient of poly) {
    if (abs(coefficient).toString(2).length > MAX_COEFFICIENT_BITS) {
      throw new RangeError('Exact IRR root counting exceeded its arithmetic budget.');
    }
    content = gcd(content, coefficient);
  }
  return content > 1n ? poly.map(value => value / content) : poly;
}

function integerCoefficients(values) {
  const view = new DataView(new ArrayBuffer(8));
  const parts = values.map(value => {
    if (value === 0) return { integer: 0n, exponent: 0 };
    view.setFloat64(0, value, false);
    const bits = view.getBigUint64(0, false);
    const exponent = Number((bits >> 52n) & 2047n);
    let integer = bits & ((1n << 52n) - 1n);
    if (exponent !== 0) integer += 1n << 52n;
    if ((bits >> 63n) !== 0n) integer = -integer;
    return { integer, exponent: exponent === 0 ? -1074 : exponent - 1075 };
  });
  const minimum = Math.min(...parts.filter(part => part.integer !== 0n).map(part => part.exponent));
  return primitive(parts.map(part => part.integer === 0n ? 0n : part.integer << BigInt(part.exponent - minimum)));
}

// Positive pseudo-division scales preserve the sign of the true remainder,
// including when the divisor has a negative leading coefficient.
function remainder(dividend, divisor) {
  let result = [...dividend];
  const leading = divisor.at(-1);
  const multiplier = abs(leading);
  while (result.length >= divisor.length && result.length) {
    const shift = result.length - divisor.length;
    const factor = (leading < 0n ? -1n : 1n) * result.at(-1);
    result = result.map(value => value * multiplier);
    for (let i = 0; i < divisor.length; i += 1) result[i + shift] -= factor * divisor[i];
    result = primitive(result);
  }
  return result;
}

function divideExact(dividend, divisor) {
  let rest = [...dividend];
  let quotient = Array(Math.max(0, dividend.length - divisor.length + 1)).fill(0n);
  const leading = divisor.at(-1);
  const multiplier = abs(leading);
  while (rest.length >= divisor.length && rest.length) {
    const shift = rest.length - divisor.length;
    const factor = (leading < 0n ? -1n : 1n) * rest.at(-1);
    quotient = quotient.map(value => value * multiplier);
    quotient[shift] += factor;
    rest = rest.map(value => value * multiplier);
    for (let i = 0; i < divisor.length; i += 1) rest[i + shift] -= factor * divisor[i];
    trim(rest);
    // Keep the quotient and remainder scaled together to control coefficient size.
    let content = 0n;
    for (const value of [...quotient, ...rest]) content = gcd(content, value);
    if (content > 1n) {
      quotient = quotient.map(value => value / content);
      rest = rest.map(value => value / content);
    }
  }
  if (rest.length) throw new RangeError('The IRR polynomial factor could not be removed exactly.');
  return primitive(quotient);
}

function variations(signs) {
  let previous = 0;
  let count = 0;
  for (const next of signs) {
    if (previous && next && previous !== next) count += 1;
    if (next) previous = next;
  }
  return count;
}

function normalizedNumbers(poly) {
  const maximum = poly.reduce((largest, value) => abs(value) > largest ? abs(value) : largest, 0n);
  const denominatorShift = Math.max(0, maximum.toString(2).length - 53);
  const denominator = Number(maximum >> BigInt(denominatorShift));
  return poly.map(coefficient => {
    if (!coefficient) return 0;
    const magnitude = abs(coefficient);
    const shift = Math.max(0, magnitude.toString(2).length - 53);
    const value = Number(magnitude >> BigInt(shift)) / denominator * 2 ** (shift - denominatorShift);
    if (value === 0 || !Number.isFinite(value)) throw new RangeError('The IRR factor exceeds floating-point precision.');
    return sign(coefficient) * value;
  });
}

// Exact Bernstein sign bounds cheaply prove "none" or "multiple" for most
// cash flows. A stubborn repeated/nearby root falls back to the Sturm chain;
// no floating-point sign is used to make a uniqueness claim.
function quickClassification(polynomial) {
  const degree = polynomial.length - 1;
  const choose = [1n];
  let denominator = 1n;
  for (let i = 1; i <= degree; i += 1) {
    choose.push(choose[i - 1] * BigInt(degree - i + 1) / BigInt(i));
    denominator = denominator / gcd(denominator, choose[i]) * choose[i];
  }
  const coefficients = primitive(polynomial.map((value, i) => value * (denominator / choose[i])));
  const endpoints = new Set();
  const intervals = [];
  let unresolved = false;
  let visits = 0;
  function visit(values, left, right, depth) {
    if (intervals.length + endpoints.size > 1) return;
    visits += 1;
    if (visits > 128) { unresolved = true; return; }
    if (values[0] === 0n && left > 0) endpoints.add(left);
    if (values.at(-1) === 0n && right < 1) endpoints.add(right);
    const changes = variations(values.map(sign));
    if (!changes) return;
    if (changes === 1) { intervals.push({ left, right, coefficients: values }); return; }
    if (depth >= 20) { unresolved = true; return; }
    const row = [...values];
    const lower = [row[0] << BigInt(degree)];
    const upper = [row.at(-1) << BigInt(degree)];
    for (let step = 1; step <= degree; step += 1) {
      const size = degree - step + 1;
      for (let i = 0; i < size; i += 1) row[i] += row[i + 1];
      lower.push(row[0] << BigInt(degree - step));
      upper.push(row[size - 1] << BigInt(degree - step));
    }
    const middle = (left + right) / 2;
    visit(normalizeContent(lower), left, middle, depth + 1);
    visit(normalizeContent(upper.reverse()), middle, right, depth + 1);
  }
  visit(coefficients, 0, 1, 0);
  if (intervals.length + endpoints.size > 1) return { status: 'multiple', count: null, coefficients: null };
  if (unresolved) return { status: 'unknown' };
  if (intervals.length) {
    const interval = intervals[0];
    return { status: 'unique', count: 1, interval: { ...interval, coefficients: normalizedNumbers(interval.coefficients) } };
  }
  if (endpoints.size) return { status: 'unique', count: 1, rootX: [...endpoints][0] };
  return { status: 'none', count: 0, coefficients: null };
}

/**
 * Classify distinct q > 0 roots exactly. If unique, return the square-free factor
 * for accurate numeric refinement, so a repeated root is not a flat minimum.
 * The caller supplies 2..31 finite cash flows with no leading/trailing zeroes.
 */
export function analyzePositiveRoots(cashFlows) {
  const polynomial = integerCoefficients(cashFlows);
  const quick = quickClassification(polynomial);
  if (quick.status !== 'unknown') return quick;
  const derivative = primitive(polynomial.slice(1).map((coefficient, i) => coefficient * BigInt(i + 1)));
  const chain = [polynomial, derivative];
  while (chain.at(-1).length > 1) {
    const next = primitive(remainder(chain.at(-2), chain.at(-1)).map(value => -value));
    if (!next.length) break;
    chain.push(next);
  }
  const atZero = chain.map(poly => sign(poly.find(value => value !== 0n) || 0n));
  const atInfinity = chain.map(poly => sign(poly.at(-1)));
  const count = variations(atZero) - variations(atInfinity);
  if (count !== 1) return { status: count > 1 ? 'multiple' : 'none', count, coefficients: null };
  const commonFactor = chain.at(-1);
  const squareFree = commonFactor.length > 1 ? divideExact(polynomial, commonFactor) : polynomial;
  return { status: 'unique', count, coefficients: normalizedNumbers(squareFree) };
}
