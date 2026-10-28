/** Fixed fully amortizing loan payment. annualRate is a fraction, not percent points. */
export function monthlyMortgagePayment(principal, annualRate, termMonths) {
  if (!Number.isFinite(principal) || principal < 0 || !Number.isFinite(annualRate) || annualRate < 0
    || !Number.isSafeInteger(termMonths) || termMonths <= 0) {
    throw new RangeError('Mortgage inputs must be finite, nonnegative, and use a positive whole-month term.');
  }
  if (principal === 0) return 0;
  const rate = annualRate / 12;
  if (rate === 0) {
    const payment = principal / termMonths;
    if (payment === 0) throw new RangeError('Mortgage payment is below numeric precision.');
    return payment;
  }
  // log1p/expm1 avoid cancellation near 0% and overflowing (1 + rate)^term.
  const discount = -Math.expm1(-termMonths * Math.log1p(rate));
  const payment = principal * rate / discount;
  if (!Number.isFinite(payment) || payment <= 0) throw new RangeError('Mortgage payment exceeds numeric precision.');
  return payment;
}

/**
 * Monthly records for the projection, including zero records after payoff.
 * The final payment clears the remaining principal without rounding cents.
 * @returns {{monthlyPayment: number, months: Array<{month: number, startBalance: number, payment: number, principal: number, interest: number, endBalance: number}>}}
 */
export function buildMortgageSchedule(principal, annualRate, termMonths, projectionMonths = 360) {
  const monthlyPayment = monthlyMortgagePayment(principal, annualRate, termMonths);
  if (!Number.isSafeInteger(projectionMonths) || projectionMonths < 0 || projectionMonths > 360) {
    throw new RangeError('The mortgage projection supports up to 360 whole months.');
  }
  const rate = annualRate / 12;
  const months = [];
  let balance = principal;
  for (let month = 1; month <= projectionMonths; month += 1) {
    const startBalance = balance;
    let interest = 0;
    let payment = 0;
    let paidPrincipal = 0;
    if (balance > 0 && month <= termMonths) {
      interest = balance * rate;
      payment = month === termMonths ? balance + interest : Math.min(monthlyPayment, balance + interest);
      paidPrincipal = Math.max(0, payment - interest);
      if (![interest, payment, paidPrincipal].every(Number.isFinite) || (paidPrincipal === 0 && interest > 0)) {
        throw new RangeError('The mortgage cannot amortize reliably at these magnitudes.');
      }
      balance = month === termMonths ? 0 : Math.max(0, balance - paidPrincipal);
    }
    months.push({ month, startBalance, payment, principal: paidPrincipal, interest, endBalance: balance });
  }
  return { monthlyPayment, months };
}
