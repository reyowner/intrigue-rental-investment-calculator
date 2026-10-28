const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const HEADLINES = [
  { key: 'capRate', label: 'Cap rate', format: percent, help: 'Year 1 net operating income divided by the property value after renovation. Excludes financing.' },
  { key: 'cashOnCashReturn', label: 'Cash-on-cash return', format: percent, help: 'Year 1 cash flow divided by the cash needed to buy and prepare the property.' },
  { key: 'monthlyCashFlow', label: 'Year 1 monthly cash flow', format: dollars, help: 'Rent collected less operating costs and mortgage payments, averaged over Year 1.' },
  { key: 'totalCashRequired', label: 'Total cash required', format: dollars, help: 'Your down payment, buying closing costs, and renovation budget combined.' },
  { key: 'equityAtYear5', label: 'Total equity at Year 5', format: dollars, help: 'Estimated property value at the end of Year 5, less the remaining loan. Before selling costs.' },
];
const DERIVED = [
  { key: 'loanAmount', path: 'initial.loanAmount', label: 'Loan amount', format: dollars, help: 'Purchase price less your down payment.' },
  { key: 'monthlyPayment', path: 'mortgage.monthlyPayment', label: 'Monthly principal and interest', format: cents, help: 'The scheduled mortgage payment, excluding taxes, insurance, and HOA fees.' },
  { key: 'buyingClosingCosts', path: 'initial.buyingClosingCosts', label: 'Buying closing costs', format: dollars, help: 'Purchase price multiplied by your buying closing-cost percentage.' },
  { key: 'totalCashRequired', path: 'initial.totalCashRequired', label: 'Total cash required', format: dollars, help: 'Down payment plus buying closing costs and renovation.' },
];

/** Formatting adapter only; every financial value comes from the existing engine. */
export function buildResultView(model) {
  if (!model.ok) {
    const unavailable = 'Correct the highlighted inputs or use amounts within the supported numeric range to see this estimate.';
    const empty = definition => ({ key: definition.key, label: definition.label, help: definition.help, value: 'N/A', unavailable });
    return { valid: false, headline: HEADLINES.map(empty), derived: DERIVED.map(empty) };
  }
  const present = (definition, value) => {
    let unavailable = '';
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      const reason = model.years[0].unavailable[definition.key];
      if (reason === 'zero-denominator') unavailable = definition.key === 'capRate'
        ? 'N/A because the property value at the start of Year 1 is zero.'
        : 'N/A because total cash required is zero, so there is no cash basis for this return.';
      else unavailable = 'N/A because this return cannot be calculated within supported numeric precision.';
    }
    return {
      key: definition.key, label: definition.label, help: definition.help,
      value: unavailable ? 'N/A' : definition.format.format(Object.is(value, -0) ? 0 : value), unavailable,
    };
  };
  return {
    valid: true,
    headline: HEADLINES.map(definition => present(definition, model.headline[definition.key])),
    derived: DERIVED.map(definition => present(definition, definition.path.split('.').reduce((value, key) => value[key], model))),
  };
}
