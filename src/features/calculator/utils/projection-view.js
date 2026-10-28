import { PROJECTION_GROUPS } from '../constants/projection-rows.js';

const formats = {
  currency: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
  percent: new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

/** Machine reasons originate in the engine; these explanations add no financial rules. */
function unavailableReason(key, year) {
  const reason = year.unavailable[key];
  if (reason === 'zero-denominator') {
    if (key === 'capRate') return 'The property value at the start of this year is zero.';
    if (key === 'returnOnEquity') return 'End-of-year equity is zero.';
    return 'Total cash required is zero, so there is no initial cash basis for this return.';
  }
  if (reason === 'negative-future-value') return 'Ending wealth is negative, so this annualized return has no supported real value.';
  if (reason === 'multiple-roots') return 'These cash flows have multiple possible IRRs; there is no single unambiguous return.';
  if (reason === 'no-sign-change') return 'These cash flows do not contain both positive and negative amounts needed for a finite IRR.';
  if (reason === 'no-root') return 'These sale cash flows do not produce a supported finite IRR.';
  return 'This return cannot be calculated safely within supported numeric precision.';
}

/** Projection presentation only; never recompute a financial value. */
export function buildProjectionView(model) {
  if (!model.ok) return { valid: false, years: [], groups: [] };
  const notes = [];
  return {
    valid: true,
    notes,
    years: model.years.map(year => year.year),
    groups: PROJECTION_GROUPS.map(group => ({
      ...group,
      rows: group.rows.map(row => ({
        ...row,
        cells: model.years.map(year => {
          const raw = row.key.split('.').reduce((value, key) => value[key], year);
          const missing = typeof raw !== 'number' || !Number.isFinite(raw);
          const reason = missing ? unavailableReason(row.key, year) : '';
          let note = null;
          if (reason) {
            let entry = notes.find(entry => entry.reason === reason);
            if (!entry) { entry = { number: notes.length + 1, reason }; notes.push(entry); }
            note = entry.number;
          }
          return {
            year: year.year, raw, note,
            value: missing ? 'N/A' : formats[row.format].format(Object.is(raw, -0) ? 0 : raw),
            reason,
          };
        }),
      })),
    })),
  };
}
