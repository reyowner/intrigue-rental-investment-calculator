import { DEFAULT_INPUTS } from '../constants/default-inputs.js';

const PROPORTIONS = new Set([
  'downPaymentPercent', 'vacancyPercent', 'maintenancePercent', 'managementPercent',
  'buildingPercent', 'buyingClosingPercent', 'sellingClosingPercent',
]);
const isRecord = value => value !== null && typeof value === 'object'
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const DECIMAL = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * Omitted keys use source defaults; explicitly blank keys are validation errors.
 * Returns a new numeric model, never mutates the supplied object or defaults.
 * @param {unknown} input
 * @returns {{ok: true, value: object} | {ok: false, errors: Array<{field: string, code: string, message: string}>}}
 */
export function validateInputs(input = {}) {
  const errors = [];
  const issue = (field, code, message) => errors.push({ field, code, message });
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: '$', code: 'invalid-model', message: 'Provide a property input object.' }] };
  }

  function number(raw, field, minimum = 0, maximum = Infinity) {
    if (raw === null || raw === undefined || (typeof raw === 'string' && !raw.trim())) {
      issue(field, 'required', 'Enter a number; use 0 when there is no amount.');
      return 0;
    }
    if ((typeof raw !== 'number' && typeof raw !== 'string')
      || (typeof raw === 'string' && !DECIMAL.test(raw.trim()))) {
      issue(field, 'invalid-number', 'Enter a valid decimal number without currency symbols or separators.');
      return 0;
    }
    const parsed = typeof raw === 'number' ? raw : Number(raw.trim());
    if (!Number.isFinite(parsed)) {
      issue(field, 'not-finite', 'Enter a finite number.');
      return 0;
    }
    if (parsed < minimum || parsed > maximum) {
      issue(field, 'out-of-range', maximum === Infinity
        ? `Enter a number no lower than ${minimum}.`
        : `Enter a number from ${minimum} to ${maximum}.`);
    }
    return parsed;
  }

  function unknownKeys(record, defaults, prefix = '') {
    for (const key of Object.keys(record)) {
      if (!Object.hasOwn(defaults, key)) issue(prefix + key, 'unknown-field', 'This input is not part of the calculator model.');
    }
  }
  unknownKeys(input, DEFAULT_INPUTS);
  const value = {};
  for (const [key, fallback] of Object.entries(DEFAULT_INPUTS)) {
    const raw = Object.hasOwn(input, key) ? input[key] : fallback;
    if (typeof fallback === 'object') {
      const group = {};
      if (!isRecord(raw)) {
        issue(key, 'invalid-group', 'Provide the individual expense amounts as an object.');
      } else {
        unknownKeys(raw, fallback, `${key}.`);
        for (const [name, defaultAmount] of Object.entries(fallback)) {
          group[name] = number(Object.hasOwn(raw, name) ? raw[name] : defaultAmount, `${key}.${name}`);
        }
      }
      value[key] = group;
    } else {
      const growth = key.endsWith('GrowthPercent') || key === 'appreciationPercent';
      value[key] = number(raw, key, growth ? -100 : 0, PROPORTIONS.has(key) ? 100 : Infinity);
    }
  }

  if (!errors.some(error => error.field === 'loanTermYears')) {
    const months = value.loanTermYears * 12;
    if (months <= 0 || !Number.isSafeInteger(Math.round(months)) || Math.abs(months - Math.round(months)) > 1e-7) {
      issue('loanTermYears', 'invalid-term', 'Use a positive loan term that represents a whole number of months.');
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, value };
}
