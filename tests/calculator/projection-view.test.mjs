import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { calculateInvestment } from '../../src/features/calculator/engine.js';

// Independent source-row/path fixture from the read-only Financial Analysis audit.
const SOURCE_PATHS = {
  5: 'grossRent', 6: 'vacancyLoss', 7: 'operatingIncome',
  9: 'expenses.propertyTaxes', 10: 'expenses.insurance', 11: 'expenses.hoa', 12: 'expenses.utilitiesTotal',
  13: 'expenses.utilities.electricity', 14: 'expenses.utilities.fuelOil', 15: 'expenses.utilities.gas',
  16: 'expenses.utilities.sewer', 17: 'expenses.utilities.telephone', 18: 'expenses.utilities.water', 19: 'expenses.utilities.other',
  20: 'expenses.miscellaneousTotal', 21: 'expenses.miscellaneous.accounting', 22: 'expenses.miscellaneous.advertising',
  23: 'expenses.miscellaneous.janitorial', 24: 'expenses.miscellaneous.lawnSnow', 25: 'expenses.miscellaneous.legal',
  26: 'expenses.miscellaneous.licenses', 27: 'expenses.miscellaneous.miscellaneous', 28: 'expenses.miscellaneous.residentSuperintendent',
  29: 'expenses.miscellaneous.supplies', 30: 'expenses.miscellaneous.trashRemoval',
  31: 'expenses.maintenance', 32: 'expenses.management', 33: 'expenses.total',
  35: 'noi', 36: 'mortgagePayment', 37: 'annualCashFlow', 38: 'monthlyCashFlow',
  39: 'principalPaydown', 40: 'appreciation', 41: 'effectiveNetCashFlow', 44: 'depreciation', 45: 'mortgageInterest',
  48: 'propertyValue', 49: 'loanBalance', 50: 'equity', 51: 'netSaleProceeds', 52: 'cumulativeCashFlow', 53: 'effectiveFutureValue',
  56: 'capRate', 57: 'cashOnCashReturn', 58: 'returnOnEquity', 59: 'annualizedReturn', 60: 'irr', 61: 'roi',
};

async function adapter() {
  assert.ok(existsSync(new URL('../../src/features/calculator/utils/projection-view.js', import.meta.url)), 'the projection presentation adapter must exist');
  return (await import('../../src/features/calculator/utils/projection-view.js')).buildProjectionView;
}

test('projection presentation maps all 49 source rows to all 30 exact engine years', async () => {
  const buildProjectionView = await adapter();
  const model = calculateInvestment({ monthlyUtilities: { water: 35 }, annualMiscellaneous: { legal: 240 } });
  const view = buildProjectionView(model);
  assert.equal(view.valid, true);
  assert.deepEqual(view.years, Array.from({ length: 30 }, (_, i) => i + 1));
  const rows = view.groups.flatMap(group => group.rows);
  const sourceRows = rows.filter(row => row.sourceRow !== null);
  assert.equal(sourceRows.length, 49);
  assert.deepEqual(sourceRows.map(row => row.sourceRow).sort((a, b) => a - b), Object.keys(SOURCE_PATHS).map(Number));
  assert.equal(new Set(rows.map(row => row.key)).size, rows.length);
  for (const row of sourceRows) {
    assert.equal(row.cells.length, 30);
    assert.ok(row.label && row.help);
    for (const [i, cell] of row.cells.entries()) {
      assert.equal(cell.year, i + 1);
      assert.equal(cell.raw, SOURCE_PATHS[row.sourceRow].split('.').reduce((value, key) => value[key], model.years[i]));
    }
  }
});


test('projection values display the assessment figures and distinguish supplementary sale accounting', async () => {
  const buildProjectionView = await adapter();
  const model = calculateInvestment();
  const before = structuredClone(model);
  const rows = new Map(buildProjectionView(model).groups.flatMap(group => group.rows).map(row => [row.key, row]));
  const expected = [
    ['grossRent', 1, '$28,800'], ['vacancyLoss', 1, '$1,440'], ['operatingIncome', 1, '$27,360'],
    ['expenses.propertyTaxes', 1, '$2,196'], ['expenses.insurance', 1, '$1,800'], ['expenses.maintenance', 1, '$1,440'],
    ['expenses.management', 1, '$2,736'], ['expenses.total', 1, '$8,172'], ['noi', 1, '$19,188'],
    ['mortgagePayment', 1, '$15,359'], ['annualCashFlow', 1, '$3,829'], ['monthlyCashFlow', 1, '$319'],
    ['capRate', 1, '7.11%'], ['cashOnCashReturn', 1, '5.45%'], ['principalPaydown', 1, '$2,263'],
    ['appreciation', 1, '$8,100'], ['depreciation', 1, '$4,909'], ['irr', 1, '-11.36%'],
    ['annualCashFlow', 5, '$6,237'], ['equity', 5, '$123,442'], ['annualCashFlow', 10, '$9,677'],
    ['irr', 10, '15.10%'], ['expenses.insurance', 30, '$4,242'], ['cumulativeCashFlow', 30, '$452,099'], ['irr', 30, '14.04%'],
  ];
  for (const [key, year, value] of expected) assert.equal(rows.get(key).cells[year - 1].value, value, `${key} Year ${year}`);
  for (const key of ['sellingClosingCosts', 'cashFlowWithSale']) {
    assert.equal(rows.get(key).sourceRow, null);
    assert.equal(rows.get(key).cells[0].raw, model.years[0][key]);
    assert.ok(rows.get(key).help);
  }
  assert.ok(rows.get('netSaleProceeds').help.includes('Excludes'));
  assert.ok(rows.get('annualizedReturn').help.includes('unlike IRR'));
  assert.ok(rows.get('roi').help.includes('not an annual rate'));
  assert.deepEqual(model, before);
});


test('unavailable projection returns retain an explanation instead of becoming zero percent', async () => {
  const buildProjectionView = await adapter();
  const model = calculateInvestment({ purchasePrice: 0, afterRepairValue: 0, monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0 });
  const rows = new Map(buildProjectionView(model).groups.flatMap(group => group.rows).map(row => [row.key, row]));
  for (const key of ['capRate', 'cashOnCashReturn', 'returnOnEquity', 'annualizedReturn', 'roi', 'irr']) {
    for (const cell of rows.get(key).cells) {
      assert.equal(cell.value, 'N/A', key);
      assert.ok(cell.reason.length > 10, key);
      assert.equal(cell.raw, null, key);
    }
  }
  assert.match(rows.get('cashOnCashReturn').cells[0].reason, /cash required is zero/);
  assert.match(rows.get('returnOnEquity').cells[0].reason, /equity is zero/);
  assert.equal(rows.get('annualCashFlow').cells[0].value, '$0');
  const losing = buildProjectionView(calculateInvestment({ monthlyRent: 0 }));
  const annualized = losing.groups.flatMap(group => group.rows).find(row => row.key === 'annualizedReturn');
  assert.equal(annualized.cells[29].value, 'N/A');
  assert.match(annualized.cells[29].reason, /ending wealth is negative/i);
  const ambiguous = calculateInvestment({ purchasePrice: 1, afterRepairValue: 97, downPaymentPercent: 100, buyingClosingPercent: 0, sellingClosingPercent: 0, monthlyRent: 37 / 12, monthlyPropertyTaxes: 29 / 12, monthlyInsurance: 0, vacancyPercent: 0, maintenancePercent: 0, managementPercent: 0, rentGrowthPercent: 0, propertyTaxGrowthPercent: 100, appreciationPercent: 0 });
  const irr = buildProjectionView(ambiguous).groups.flatMap(group => group.rows).find(row => row.key === 'irr');
  assert.equal(irr.cells[2].value, 'N/A');
  assert.match(irr.cells[2].reason, /multiple possible/);
});


test('invalid projection models expose no stale years or rows', async () => {
  const buildProjectionView = await adapter();
  for (const invalid of [calculateInvestment({ monthlyRent: '' }), calculateInvestment({ monthlyRent: '1e308' })]) {
    assert.equal(invalid.ok, false);
    assert.deepEqual(buildProjectionView(invalid), { valid: false, years: [], groups: [] });
  }
});


test('unavailable cell references resolve to a deduplicated set of visible explanation notes', async () => {
  const buildProjectionView = await adapter();
  const view = buildProjectionView(calculateInvestment({ purchasePrice: 0, afterRepairValue: 0, monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0 }));
  assert.ok(Array.isArray(view.notes));
  assert.equal(new Set(view.notes.map(note => note.reason)).size, view.notes.length);
  for (const row of view.groups.flatMap(group => group.rows)) {
    for (const cell of row.cells) {
      if (cell.reason) assert.equal(view.notes.find(note => note.number === cell.note).reason, cell.reason);
      else assert.equal(cell.note, null);
    }
  }
});


test('each utility and miscellaneous line remains distinct with nonzero costs and declining growth', async () => {
  const buildProjectionView = await adapter();
  const model = calculateInvestment({
    monthlyUtilities: { electricity: 11, fuelOil: 22, gas: 33, sewer: 44, telephone: 55, water: 66, other: 77 },
    annualMiscellaneous: { accounting: 101, advertising: 202, janitorial: 303, lawnSnow: 404, legal: 505, licenses: 606, miscellaneous: 707, residentSuperintendent: 808, supplies: 909, trashRemoval: 1010 },
    utilitiesGrowthPercent: -1, miscellaneousGrowthPercent: 2, insuranceGrowthPercent: -2, hoaGrowthPercent: 4, monthlyHoa: 15,
  });
  const rows = buildProjectionView(model).groups.flatMap(group => group.rows);
  const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  for (const row of rows.filter(row => row.key.startsWith('expenses.'))) {
    for (const [i, cell] of row.cells.entries()) {
      const expected = row.key.split('.').reduce((value, key) => value[key], model.years[i]);
      assert.equal(cell.raw, expected);
      assert.equal(cell.value, dollars.format(expected));
    }
  }
  const zero = buildProjectionView(calculateInvestment({ downPaymentPercent: 100, monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0 }));
  assert.equal(zero.groups.flatMap(group => group.rows).find(row => row.key === 'cashOnCashReturn').cells[29].value, '0.00%');
});
