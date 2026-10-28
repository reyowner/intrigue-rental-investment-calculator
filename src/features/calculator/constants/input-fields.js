import { DEFAULT_INPUTS } from './default-inputs.js';

const field = (name, label, unit, help) => Object.freeze({
  name, label, unit, help,
  value: name.split('.').reduce((value, key) => value[key], DEFAULT_INPUTS),
});
const group = (id, title, advanced, fields, help = '') => Object.freeze({
  id, title, advanced, help, fields: Object.freeze(fields),
});

export const UTILITY_GUIDANCE = 'Only enter utilities the owner pays while a tenant is in place. Vacancy already accounts for the rest. Leave utilities out if the tenant reimburses them.';

// Presentation metadata only. Numeric defaults and validation stay in the engine.
export const INPUT_GROUPS = Object.freeze([
  group('purchase', 'Purchase and renovation', false, [
    field('purchasePrice', 'Purchase price', 'currency', 'The agreed price to buy the property, before closing costs or renovation.'),
    field('afterRepairValue', 'Value after renovation', 'currency', 'What you estimate the property will be worth once the planned work is complete.'),
    field('renovationCost', 'Renovation cost', 'currency', 'Your total cash budget to prepare the property. Enter 0 if no work is needed.'),
  ]),
  group('financing', 'Financing', false, [
    field('downPaymentPercent', 'Down payment', 'percent', 'The share of the purchase price you pay upfront, rather than borrow.'),
    field('interestRatePercent', 'Interest rate', 'percent', 'The fixed annual mortgage rate. Enter 0 for an interest-free loan.'),
    field('loanTermYears', 'Loan term', 'years', 'How long the loan runs. Use whole months expressed in years, such as 1.5 for 18 months.'),
  ]),
  group('monthly', 'Monthly income and costs', false, [
    field('monthlyRent', 'Monthly rent', 'monthly', 'Total expected monthly rent from all units before vacancy or expenses.'),
    field('monthlyPropertyTaxes', 'Property taxes', 'monthly', 'The monthly share of your property tax bill. Divide an annual bill by 12.'),
    field('monthlyInsurance', 'Insurance', 'monthly', 'The monthly cost of property insurance. Divide an annual premium by 12.'),
    field('monthlyHoa', 'HOA fees', 'monthly', 'Monthly homeowners association fees paid by the owner. Enter 0 if none apply.'),
  ]),
  group('reserves', 'Vacancy, reserves, and management', true, [
    field('vacancyPercent', 'Vacancy allowance', 'percent', 'The share of scheduled rent you expect to lose to vacancy or unpaid rent.'),
    field('maintenancePercent', 'Maintenance reserve', 'percent', 'The share of gross scheduled rent set aside for repairs and ongoing upkeep.'),
    field('managementPercent', 'Management fee', 'percent', 'The share of rent actually collected that pays for property management.'),
  ]),
  group('utilities', 'Owner-paid utilities', true, [
    field('monthlyUtilities.electricity', 'Electricity', 'monthly', 'The monthly electricity bill paid by the owner while the property is occupied.'),
    field('monthlyUtilities.fuelOil', 'Fuel oil', 'monthly', 'Your average monthly owner-paid fuel oil cost during occupancy.'),
    field('monthlyUtilities.gas', 'Gas', 'monthly', 'The monthly gas bill paid by the owner during occupancy.'),
    field('monthlyUtilities.sewer', 'Sewer', 'monthly', 'The monthly sewer charge paid by the owner during occupancy.'),
    field('monthlyUtilities.telephone', 'Telephone', 'monthly', 'The monthly owner-paid telephone service cost for the property.'),
    field('monthlyUtilities.water', 'Water', 'monthly', 'The monthly water bill paid by the owner during occupancy.'),
    field('monthlyUtilities.other', 'Other utilities', 'monthly', 'Any other monthly utility costs paid by the owner during occupancy.'),
  ], UTILITY_GUIDANCE),
  group('miscellaneous', 'Other annual expenses', true, [
    field('annualMiscellaneous.accounting', 'Accounting', 'annual', 'Yearly bookkeeping, accounting, or tax-preparation costs for this property.'),
    field('annualMiscellaneous.advertising', 'Advertising', 'annual', 'Yearly costs to advertise and market the rental.'),
    field('annualMiscellaneous.janitorial', 'Janitorial services', 'annual', 'Yearly cleaning costs paid by the owner, such as cleaning shared spaces.'),
    field('annualMiscellaneous.lawnSnow', 'Lawn care and snow removal', 'annual', 'The total yearly amount the owner pays for grounds care and snow removal.'),
    field('annualMiscellaneous.legal', 'Legal', 'annual', 'Yearly legal costs related to owning or operating the rental.'),
    field('annualMiscellaneous.licenses', 'Licenses', 'annual', 'Yearly rental licenses, permits, or registration fees.'),
    field('annualMiscellaneous.miscellaneous', 'Miscellaneous', 'annual', 'Other yearly operating costs that are not listed elsewhere. Avoid counting a cost twice.'),
    field('annualMiscellaneous.residentSuperintendent', 'Resident superintendent', 'annual', 'Yearly compensation for an on-site superintendent or caretaker.'),
    field('annualMiscellaneous.supplies', 'Supplies', 'annual', 'Yearly operating supplies, excluding repairs already covered by the maintenance reserve.'),
    field('annualMiscellaneous.trashRemoval', 'Trash removal', 'annual', 'The total yearly cost of owner-paid trash collection or removal.'),
  ], 'Enter yearly totals here, not monthly bills. Use 0 for costs that do not apply.'),
  group('growth', 'Annual growth assumptions', true, [
    field('rentGrowthPercent', 'Rent growth', 'percent', 'Expected yearly change in scheduled rent, starting in Year 2. A negative rate models a decline.'),
    field('propertyTaxGrowthPercent', 'Property tax growth', 'percent', 'Expected yearly change in property taxes, starting in Year 2.'),
    field('insuranceGrowthPercent', 'Insurance growth', 'percent', 'Expected yearly change in insurance costs, starting in Year 2. The example uses 3%.'),
    field('hoaGrowthPercent', 'HOA growth', 'percent', 'Expected yearly change in HOA fees, starting in Year 2. The example uses 3%.'),
    field('utilitiesGrowthPercent', 'Utility growth', 'percent', 'Expected yearly change in all owner-paid utility costs, starting in Year 2.'),
    field('miscellaneousGrowthPercent', 'Other expense growth', 'percent', 'Expected yearly change in the other annual expense lines, starting in Year 2.'),
  ]),
  group('value-and-closing', 'Property value and closing costs', true, [
    field('buildingPercent', 'Building-to-land ratio', 'percent', 'The share of purchase plus renovation cost assigned to the building for depreciation, excluding land.'),
    field('appreciationPercent', 'Property appreciation', 'percent', 'Expected yearly change in property value, starting in Year 1. A negative rate models a decline.'),
    field('buyingClosingPercent', 'Buying closing costs', 'percent', 'Purchase fees as a share of the purchase price, paid in cash at closing.'),
    field('sellingClosingPercent', 'Selling closing costs', 'percent', 'Sale fees as a share of the projected sale value, deducted from sale proceeds.'),
  ], 'Appreciation and selling costs affect the long-term model. Depreciation is informational only. These assumptions do not change Year 1 operating cash flow.'),
]);
