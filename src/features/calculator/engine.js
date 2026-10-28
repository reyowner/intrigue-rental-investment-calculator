import { validateInputs } from './utils/validate-inputs.js';
import { projectInvestment } from './utils/projection.js';
export { DEFAULT_INPUTS } from './constants/default-inputs.js';

function assertFiniteModel(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('A projection exceeds the supported numeric range.');
  if (value && typeof value === 'object') Object.values(value).forEach(assertFiniteModel);
}

/**
 * Public browser/Node entry point. No DOM, network, storage, or formatting.
 * Inputs use percentage points; output ratios/IRRs use fractions.
 * Missing inputs use source defaults; invalid explicit inputs return errors.
 * Undefined returns are null with a machine-readable reason on the year.
 */
export function calculateInvestment(input = {}) {
  const validation = validateInputs(input);
  if (!validation.ok) return validation;
  try {
    const model = projectInvestment(validation.value);
    assertFiniteModel(model);
    return { ok: true, ...model };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: [{ field: '$', code: 'numeric-range', message: error.message }] };
  }
}
