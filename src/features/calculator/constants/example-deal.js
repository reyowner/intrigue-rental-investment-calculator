// Presentation-only source values from Financial Summary, not calculated outputs.
// Kept in the calculator feature so the later engine can own its input defaults.
export const exampleDeal = [
  { label: 'Purchase price', value: '$270,000' },
  { label: 'Value after renovation', value: '$270,000' },
  { label: 'Renovation budget', value: '$0' },
  { label: 'Down payment', value: '25%' },
  { label: 'Monthly rent', value: '$2,400' },
  { label: 'Interest rate', value: '6.5%' },
];

export const additionalAssumptions = [
  { label: 'Loan term', value: '30 years' },
  { label: 'Monthly property taxes', value: '$183' },
  { label: 'Monthly insurance', value: '$150' },
  { label: 'Monthly HOA', value: '$0' },
  { label: 'Vacancy allowance', value: '5%' },
  { label: 'Maintenance reserve', value: '5%' },
  { label: 'Management fee', value: '10% of collected rent' },
];
