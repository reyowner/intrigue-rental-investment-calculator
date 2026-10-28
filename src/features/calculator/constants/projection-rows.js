/** Source mapping and explanations only. All numbers come from the existing engine. */
const row = (key, label, sourceRow, help, emphasis = false) => Object.freeze({
  key, label, sourceRow, help, emphasis, format: sourceRow >= 56 ? 'percent' : 'currency',
});
const group = (id, label, rows) => Object.freeze({ id, label, rows: Object.freeze(rows) });

export const PROJECTION_GROUPS = Object.freeze([
  group('income', 'Rental income', [
    row('grossRent', 'Gross scheduled rent', 5, 'A full year of rent before vacancy, with rent growth starting in Year 2.'),
    row('vacancyLoss', 'Vacancy allowance', 6, 'Rent set aside for vacancy, deducted from gross scheduled rent.'),
    row('operatingIncome', 'Rent collected', 7, 'Gross scheduled rent less the vacancy allowance.', true),
  ]),
  group('property-costs', 'Property costs', [
    row('expenses.propertyTaxes', 'Property taxes', 9, 'Annual property taxes, including the property tax growth assumption.'),
    row('expenses.insurance', 'Insurance', 10, 'Annual insurance costs, including the separate insurance growth assumption.'),
    row('expenses.hoa', 'HOA fees', 11, 'Annual homeowners association fees, including the separate HOA growth assumption.'),
  ]),
  group('utilities', 'Owner-paid utilities', [
    row('expenses.utilitiesTotal', 'Total utilities', 12, 'The seven owner-paid utility lines combined. Monthly inputs are annualized once.', true),
    row('expenses.utilities.electricity', 'Electricity', 13, 'Annual owner-paid electricity, including utility growth.'),
    row('expenses.utilities.fuelOil', 'Fuel oil', 14, 'Annual owner-paid fuel oil, including utility growth.'),
    row('expenses.utilities.gas', 'Gas', 15, 'Annual owner-paid gas, including utility growth.'),
    row('expenses.utilities.sewer', 'Sewer', 16, 'Annual owner-paid sewer charges, including utility growth.'),
    row('expenses.utilities.telephone', 'Telephone', 17, 'Annual owner-paid telephone service, including utility growth.'),
    row('expenses.utilities.water', 'Water', 18, 'Annual owner-paid water, including utility growth.'),
    row('expenses.utilities.other', 'Other utilities', 19, 'Annual other owner-paid utilities, including utility growth.'),
  ]),
  group('miscellaneous', 'Miscellaneous costs', [
    row('expenses.miscellaneousTotal', 'Total miscellaneous costs', 20, 'The ten miscellaneous expense lines combined. Inputs are already annual amounts.', true),
    row('expenses.miscellaneous.accounting', 'Accounting', 21, 'Annual accounting costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.advertising', 'Advertising', 22, 'Annual advertising costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.janitorial', 'Janitorial services', 23, 'Annual janitorial costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.lawnSnow', 'Lawn and snow', 24, 'Annual lawn care and snow removal, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.legal', 'Legal', 25, 'Annual legal costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.licenses', 'Licenses', 26, 'Annual license costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.miscellaneous', 'Other miscellaneous costs', 27, 'Annual other miscellaneous costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.residentSuperintendent', 'Resident superintendent', 28, 'Annual resident superintendent costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.supplies', 'Supplies', 29, 'Annual supplies costs, including miscellaneous expense growth.'),
    row('expenses.miscellaneous.trashRemoval', 'Trash removal', 30, 'Annual trash removal, including miscellaneous expense growth.'),
  ]),
  group('reserves-and-fees', 'Reserves and fees', [
    row('expenses.maintenance', 'Maintenance reserve', 31, 'Maintenance percentage of gross scheduled rent, before vacancy.'),
    row('expenses.management', 'Property management', 32, 'Management percentage of rent collected, after vacancy.'),
    row('expenses.total', 'Total operating expenses', 33, 'All operating costs combined, excluding the mortgage. Utility and miscellaneous subtotals are counted only once.', true),
  ]),
  group('cash-flow', 'Cash flow', [
    row('noi', 'Net operating income', 35, 'Rent collected less operating expenses, before financing.', true),
    row('mortgagePayment', 'Mortgage payments', 36, 'Actual annual principal and interest payments. Payments stop after the loan is paid off.'),
    row('annualCashFlow', 'Annual cash flow', 37, 'Net operating income less actual mortgage payments.', true),
    row('monthlyCashFlow', 'Monthly cash flow', 38, 'Annual cash flow divided by 12. This is a monthly average.', true),
    row('principalPaydown', 'Principal paydown', 39, 'The amount of loan principal repaid during the year.'),
    row('appreciation', 'Annual appreciation', 40, 'The change in property value during the year. This is not cash received.'),
    row('effectiveNetCashFlow', 'Effective net cash flow', 41, 'Annual cash flow plus principal paydown and appreciation. Includes noncash gains.'),
  ]),
  group('tax-information', 'Tax information', [
    row('depreciation', 'Depreciation', 44, 'Informational building-basis allocation over 27.5 years, including a final partial year. It does not change the returns.'),
    row('mortgageInterest', 'Mortgage interest', 45, 'The interest portion of the annual mortgage payments. Already included in mortgage payments, not another cost to subtract.'),
  ]),
  group('value-and-equity', 'Value and equity', [
    row('propertyValue', 'End-of-year property value', 48, 'Estimated property value at year end, starting from value after renovation.'),
    row('loanBalance', 'Remaining loan balance', 49, 'Mortgage principal remaining at year end. Stays at zero after payoff.'),
    row('equity', 'End-of-year equity', 50, 'End-of-year property value less the remaining loan balance, before selling costs.', true),
    row('sellingClosingCosts', 'Selling closing costs', null, 'Selling closing-cost percentage of that year\'s property value. Shown separately to explain net sale proceeds.'),
    row('netSaleProceeds', 'Net sale proceeds', 51, 'Equity less selling closing costs, if sold at year end. Excludes that year\'s operating cash flow.'),
    row('cashFlowWithSale', 'Cash flow plus sale proceeds', null, 'That year\'s annual cash flow plus net sale proceeds, counted once as the final IRR payment.'),
    row('cumulativeCashFlow', 'Cumulative cash flow', 52, 'All annual operating cash flows to date. Excludes the initial investment and any sale proceeds.'),
    row('effectiveFutureValue', 'Effective future value', 53, 'Cumulative cash flow plus net sale proceeds. This is ending wealth, not profit.'),
  ]),
  group('returns', 'Investment returns', [
    row('capRate', 'Cap rate', 56, 'This year\'s net operating income divided by the property value at the start of this year.'),
    row('cashOnCashReturn', 'Cash-on-cash return', 57, 'This year\'s annual cash flow divided by the initial total cash required.'),
    row('returnOnEquity', 'Return on equity', 58, 'Effective net cash flow, including noncash gains, divided by end-of-year equity. Not cash-on-cash return.'),
    row('annualizedReturn', 'Annualized ending-wealth return', 59, 'The compounded return implied by ending wealth relative to initial cash. Treats prior cash distributions as ending wealth, unlike IRR.'),
    row('irr', 'IRR if sold at year end', 60, 'Annual return using the initial cash investment, annual cash flows, and net sale proceeds if sold at the end of this year.', true),
    row('roi', 'Total return on investment', 61, 'Ending wealth less the initial cash investment, divided by initial cash. A total return, not an annual rate.'),
  ]),
]);
