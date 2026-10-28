import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature } from './helpers.mjs';

test('numeric defaults preserve the source duplex and the two assessment additions', async () => {
  const values = await loadFeature('constants/default-inputs.js', 'DEFAULT_INPUTS');
  assert.deepEqual(values, {
    purchasePrice: 270000, afterRepairValue: 270000, renovationCost: 0,
    downPaymentPercent: 25, interestRatePercent: 6.5, loanTermYears: 30,
    monthlyRent: 2400, monthlyPropertyTaxes: 183, monthlyInsurance: 150, monthlyHoa: 0,
    vacancyPercent: 5, maintenancePercent: 5, managementPercent: 10,
    monthlyUtilities: { electricity: 0, fuelOil: 0, gas: 0, sewer: 0, telephone: 0, water: 0, other: 0 },
    annualMiscellaneous: { accounting: 0, advertising: 0, janitorial: 0, lawnSnow: 0, legal: 0, licenses: 0, miscellaneous: 0, residentSuperintendent: 0, supplies: 0, trashRemoval: 0 },
    rentGrowthPercent: 3, propertyTaxGrowthPercent: 3, utilitiesGrowthPercent: 1,
    miscellaneousGrowthPercent: 1, insuranceGrowthPercent: 3, hoaGrowthPercent: 3,
    buildingPercent: 50, appreciationPercent: 3, buyingClosingPercent: 1, sellingClosingPercent: 7,
  });
  assert.ok(Object.isFrozen(values));
  assert.ok(Object.isFrozen(values.monthlyUtilities));
  assert.ok(Object.isFrozen(values.annualMiscellaneous));
});
