import { buildMortgageSchedule } from './mortgage.js';
import { solveIrr } from './irr.js';

const YEARS = 30;
const percent = value => value / 100;
const sum = values => values.reduce((total, value) => total + value, 0);
const grow = (base, rate, year) => base === 0 ? 0 : base * (1 + percent(rate)) ** (year - 1);

/** Build an independent 30-year model from already validated numeric inputs. */
export function projectInvestment(inputs) {
  const downPayment = inputs.purchasePrice * percent(inputs.downPaymentPercent);
  const loanAmount = inputs.purchasePrice - downPayment;
  const buyingClosingCosts = inputs.purchasePrice * percent(inputs.buyingClosingPercent);
  const totalCashRequired = downPayment + buyingClosingCosts + inputs.renovationCost;
  const depreciableBasis = (inputs.purchasePrice + inputs.renovationCost) * percent(inputs.buildingPercent);
  const initial = {
    downPayment, loanAmount, buyingClosingCosts, renovationCost: inputs.renovationCost,
    totalCashRequired, equityAtPurchase: inputs.afterRepairValue - loanAmount, depreciableBasis,
  };
  const mortgage = buildMortgageSchedule(loanAmount, percent(inputs.interestRatePercent), Math.round(inputs.loanTermYears * 12));
  const years = [];
  const priorCashFlows = [-totalCashRequired];
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= YEARS; year += 1) {
    const grossRent = grow(inputs.monthlyRent * 12, inputs.rentGrowthPercent, year);
    const vacancyLoss = grossRent * percent(inputs.vacancyPercent);
    const operatingIncome = grossRent - vacancyLoss;
    const utilities = Object.fromEntries(Object.entries(inputs.monthlyUtilities)
      .map(([name, amount]) => [name, grow(amount * 12, inputs.utilitiesGrowthPercent, year)]));
    const miscellaneous = Object.fromEntries(Object.entries(inputs.annualMiscellaneous)
      .map(([name, amount]) => [name, grow(amount, inputs.miscellaneousGrowthPercent, year)]));
    const expenses = {
      propertyTaxes: grow(inputs.monthlyPropertyTaxes * 12, inputs.propertyTaxGrowthPercent, year),
      insurance: grow(inputs.monthlyInsurance * 12, inputs.insuranceGrowthPercent, year),
      hoa: grow(inputs.monthlyHoa * 12, inputs.hoaGrowthPercent, year),
      utilities, utilitiesTotal: sum(Object.values(utilities)),
      miscellaneous, miscellaneousTotal: sum(Object.values(miscellaneous)),
      maintenance: grossRent * percent(inputs.maintenancePercent),
      management: operatingIncome * percent(inputs.managementPercent),
    };
    expenses.total = expenses.propertyTaxes + expenses.insurance + expenses.hoa
      + expenses.utilitiesTotal + expenses.miscellaneousTotal + expenses.maintenance + expenses.management;
    const noi = operatingIncome - expenses.total;
    const months = mortgage.months.slice((year - 1) * 12, year * 12);
    const mortgagePayment = sum(months.map(month => month.payment));
    const principalPaydown = sum(months.map(month => month.principal));
    const mortgageInterest = sum(months.map(month => month.interest));
    const loanBalance = months.at(-1).endBalance;
    const annualCashFlow = noi - mortgagePayment;
    cumulativeCashFlow += annualCashFlow;
    const startPropertyValue = grow(inputs.afterRepairValue, inputs.appreciationPercent, year);
    const propertyValue = grow(inputs.afterRepairValue, inputs.appreciationPercent, year + 1);
    const appreciation = propertyValue - startPropertyValue;
    const equity = propertyValue - loanBalance;
    const sellingClosingCosts = propertyValue * percent(inputs.sellingClosingPercent);
    const netSaleProceeds = equity - sellingClosingCosts;
    const depreciation = Math.min(depreciableBasis / 27.5,
      Math.max(0, depreciableBasis - (depreciableBasis / 27.5) * (year - 1)));
    const unavailable = {};
    function ratio(numerator, denominator, field) {
      if (denominator === 0) { unavailable[field] = 'zero-denominator'; return null; }
      const value = numerator / denominator;
      if (!Number.isFinite(value)) { unavailable[field] = 'numeric-precision'; return null; }
      return value === 0 ? 0 : value;
    }
    const irrResult = solveIrr([...priorCashFlows, annualCashFlow + netSaleProceeds]);
    if (irrResult.status !== 'ok') unavailable.irr = irrResult.reason;
    const effectiveNetCashFlow = annualCashFlow + principalPaydown + appreciation;
    const effectiveFutureValue = cumulativeCashFlow + netSaleProceeds;
    let annualizedReturn = null;
    if (totalCashRequired === 0) unavailable.annualizedReturn = 'zero-denominator';
    else if (effectiveFutureValue < 0) unavailable.annualizedReturn = 'negative-future-value';
    else {
      annualizedReturn = (effectiveFutureValue / totalCashRequired) ** (1 / year) - 1;
      if (!Number.isFinite(annualizedReturn)) {
        annualizedReturn = null;
        unavailable.annualizedReturn = 'numeric-precision';
      }
    }
    const entry = {
      year, grossRent, vacancyLoss, operatingIncome, expenses, noi, mortgagePayment,
      annualCashFlow, monthlyCashFlow: annualCashFlow / 12, principalPaydown,
      appreciation, effectiveNetCashFlow,
      depreciation, mortgageInterest, startPropertyValue, propertyValue, loanBalance, equity,
      sellingClosingCosts, netSaleProceeds, cashFlowWithSale: annualCashFlow + netSaleProceeds,
      cumulativeCashFlow, effectiveFutureValue, annualizedReturn,
      returnOnEquity: ratio(effectiveNetCashFlow, equity, 'returnOnEquity'),
      roi: ratio(effectiveFutureValue - totalCashRequired, totalCashRequired, 'roi'),
      capRate: ratio(noi, startPropertyValue, 'capRate'),
      cashOnCashReturn: ratio(annualCashFlow, totalCashRequired, 'cashOnCashReturn'),
      irr: irrResult.value, unavailable,
    };
    years.push(entry);
    priorCashFlows.push(annualCashFlow);
  }
  return {
    inputs, initial, mortgage, years,
    headline: {
      capRate: years[0].capRate, cashOnCashReturn: years[0].cashOnCashReturn,
      monthlyCashFlow: years[0].monthlyCashFlow, totalCashRequired,
      equityAtYear5: years[4].equity,
    },
  };
}
