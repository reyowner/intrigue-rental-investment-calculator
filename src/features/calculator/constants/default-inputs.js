// Numeric source defaults. Percent inputs use percentage points: 6.5 means 6.5%.
// Insurance and HOA growth are assessment additions, not workbook inputs.
export const DEFAULT_INPUTS = Object.freeze({
  purchasePrice: 270000,
  afterRepairValue: 270000,
  renovationCost: 0,
  downPaymentPercent: 25,
  interestRatePercent: 6.5,
  loanTermYears: 30,
  monthlyRent: 2400,
  monthlyPropertyTaxes: 183,
  monthlyInsurance: 150,
  monthlyHoa: 0,
  vacancyPercent: 5,
  maintenancePercent: 5,
  managementPercent: 10,
  monthlyUtilities: Object.freeze({
    electricity: 0, fuelOil: 0, gas: 0, sewer: 0, telephone: 0, water: 0, other: 0,
  }),
  annualMiscellaneous: Object.freeze({
    accounting: 0, advertising: 0, janitorial: 0, lawnSnow: 0, legal: 0,
    licenses: 0, miscellaneous: 0, residentSuperintendent: 0, supplies: 0, trashRemoval: 0,
  }),
  rentGrowthPercent: 3,
  propertyTaxGrowthPercent: 3,
  utilitiesGrowthPercent: 1,
  miscellaneousGrowthPercent: 1,
  insuranceGrowthPercent: 3,
  hoaGrowthPercent: 3,
  buildingPercent: 50,
  appreciationPercent: 3,
  buyingClosingPercent: 1,
  sellingClosingPercent: 7,
});
