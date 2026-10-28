import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFeature, closeTo } from './helpers.mjs';

function discountedValue(flows, rate) {
  let denominator = 1;
  let total = flows[0];
  let magnitude = Math.abs(flows[0]);
  for (const flow of flows.slice(1)) {
    denominator *= 1 + rate;
    total += flow / denominator;
    magnitude += Math.abs(flow / denominator);
  }
  return { total, magnitude };
}

// Independent rate-domain bisection for conventional cash flows only.
function conventionalIrr(flows) {
  let low = -0.999999;
  let high = 1;
  while (discountedValue(flows, high).total > 0) high = high * 2 + 1;
  for (let i = 0; i < 160; i += 1) {
    const middle = (low + high) / 2;
    if (middle === low || middle === high) break;
    if (discountedValue(flows, middle).total > 0) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

test('IRR agrees with an independent conventional-cash-flow oracle over all 30 horizons', async () => {
  const calculate = await loadFeature('engine.js', 'calculateInvestment');
  const model = calculate();
  const history = [-model.initial.totalCashRequired];
  for (const year of model.years) {
    const flows = [...history, year.annualCashFlow + year.netSaleProceeds];
    closeTo(year.irr, conventionalIrr(flows), 1e-10);
    const residual = discountedValue(flows, year.irr);
    assert.ok(Math.abs(residual.total) / residual.magnitude < 1e-10);
    history.push(year.annualCashFlow);
  }
});

test('standalone IRR agrees with independent bisection for varied conventional investments', async () => {
  const solve = await loadFeature('utils/irr.js', 'solveIrr');
  for (let length = 1; length <= 30; length += 1) {
    const flows = [-10000, ...Array.from({ length }, (_, i) => 100 + 37 * (i + 1))];
    flows[flows.length - 1] += 12000;
    const actual = solve(flows);
    assert.equal(actual.status, 'ok');
    closeTo(actual.value, conventionalIrr(flows), 1e-9);
  }
});

test('varied deals preserve accounting identities and annual/monthly reconciliation', async () => {
  const calculate = await loadFeature('engine.js', 'calculateInvestment');
  let state = 137;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  for (let sample = 0; sample < 24; sample += 1) {
    const input = {
      purchasePrice: 80000 + random() * 400000,
      afterRepairValue: 100000 + random() * 500000,
      renovationCost: random() * 30000,
      downPaymentPercent: random() * 100,
      interestRatePercent: random() * 12,
      loanTermYears: [1, 5, 15, 30, 40][sample % 5],
      monthlyRent: 500 + random() * 3000,
      monthlyPropertyTaxes: random() * 400,
      monthlyInsurance: random() * 300,
      monthlyHoa: random() * 200,
      rentGrowthPercent: -2 + random() * 7,
      insuranceGrowthPercent: random() * 8,
      hoaGrowthPercent: random() * 8,
      appreciationPercent: -3 + random() * 9,
      vacancyPercent: random() * 30,
      maintenancePercent: random() * 20,
      managementPercent: random() * 20,
      monthlyUtilities: { gas: random() * 50, water: random() * 100 },
      annualMiscellaneous: { accounting: random() * 200, lawnSnow: random() * 600 },
    };
    const model = calculate(input);
    assert.equal(model.ok, true, `sample ${sample}`);
    let cumulative = 0;
    let principal = 0;
    for (const year of model.years) {
      const expenses = year.expenses;
      closeTo(expenses.total, expenses.propertyTaxes + expenses.insurance + expenses.hoa + expenses.utilitiesTotal + expenses.miscellaneousTotal + expenses.maintenance + expenses.management, 1e-7);
      closeTo(year.operatingIncome, year.grossRent - year.vacancyLoss, 1e-7);
      closeTo(year.noi, year.operatingIncome - expenses.total, 1e-7);
      closeTo(year.mortgagePayment, year.mortgageInterest + year.principalPaydown, 1e-7);
      closeTo(year.annualCashFlow, year.noi - year.mortgagePayment, 1e-7);
      closeTo(year.monthlyCashFlow * 12, year.annualCashFlow, 1e-7);
      closeTo(year.equity, year.propertyValue - year.loanBalance, 1e-7);
      closeTo(year.netSaleProceeds, year.equity - year.sellingClosingCosts, 1e-7);
      closeTo(year.effectiveNetCashFlow, year.annualCashFlow + year.principalPaydown + year.appreciation, 1e-7);
      cumulative += year.annualCashFlow;
      principal += year.principalPaydown;
      closeTo(year.cumulativeCashFlow, cumulative, 1e-7);
      closeTo(principal + year.loanBalance, model.initial.loanAmount, 1e-5);
      if (year.irr !== null) {
        const flows = [-model.initial.totalCashRequired, ...model.years.slice(0, year.year).map(y => y.annualCashFlow)];
        flows[flows.length - 1] += year.netSaleProceeds;
        const residual = discountedValue(flows, year.irr);
        assert.ok(Math.abs(residual.total) / residual.magnitude < 1e-8);
      }
    }
  }
});

test('separate engine calls do not share mutable defaults, inputs, or projection results', async () => {
  const calculate = await loadFeature('engine.js', 'calculateInvestment');
  const first = calculate();
  first.inputs.monthlyUtilities.gas = 400;
  first.years[0].expenses.utilities.gas = 999;
  first.mortgage.months[0].payment = 999;
  const second = calculate();
  assert.equal(second.inputs.monthlyUtilities.gas, 0);
  assert.equal(second.years[0].expenses.utilities.gas, 0);
  assert.notEqual(second.mortgage.months[0].payment, 999);
});
