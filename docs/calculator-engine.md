# Calculation engine

## Scope and authority

The Phase 2 engine is independent of the landing page. It computes a 30-year projection in the browser, with no DOM, network, storage, charting, backend, package installation, or build dependency. Phase 3 connects this engine to the live calculator through separate form and presentation adapters; see [the interactive calculator guide](interactive-calculator.md).

The assessment brief overrides the workbook. [Calculation notes](calculation-notes.md) contain source-cell mappings, corrections, exact check figures, and supplementary-row definitions. The workbook was reviewed read-only and its SHA-256 remained unchanged.

## Calculation walkthrough

The model follows the same sequence for every deal. The rates in the formulas below are fractions after converting percentage-point inputs.

| Step | Rule |
|---|---|
| Initial financing | `downPayment = purchasePrice * downPaymentRate`; `loanAmount = purchasePrice - downPayment`. Renovation is paid in cash, not added to the loan. |
| Initial cash | `totalCashRequired = downPayment + purchasePrice * buyingClosingRate + renovationCost`. |
| Monthly mortgage | For principal `P`, monthly interest `r`, and term `n` months: `P * r / (1 - (1 + r) ** -n)`. At 0% interest: `P / n`. Each month separates interest from principal and carries the actual remaining balance forward. |
| Scheduled rent | `monthlyRent * 12 * (1 + rentGrowthRate) ** (year - 1)`. Year 1 uses the entered rent; operating growth begins in Year 2. |
| Collected rent | `grossRent - grossRent * vacancyRate`. Management is `collectedRent * managementRate`; maintenance is `grossRent * maintenanceRate`. |
| Operating expenses | Taxes, insurance, HOA, each owner-paid utility, each annual miscellaneous line, maintenance, and management. Monthly inputs are annualized once. Expense subtotals are not counted twice. Mortgage payments are excluded. |
| NOI and cash flow | `NOI = collectedRent - operatingExpenses`; `annualCashFlow = NOI - actualAnnualMortgagePayments`; `monthlyCashFlow = annualCashFlow / 12`. |
| Growth | Each operating line uses its own configured growth category, compounded annually from Year 2. Insurance and HOA have separate rates, both defaulting to 3%. |
| Property value and equity | `endValue = afterRepairValue * (1 + appreciationRate) ** year`; `equity = endValue - remainingLoan`. Appreciation starts in Year 1 and is the change from that year's starting value. |
| Sale proceeds | `netSaleProceeds = equity - endValue * sellingClosingRate`. The current year's operating cash flow is kept separate. |
| Headline returns | `capRate = NOI / startOfYearValue`; `cashOnCashReturn = annualCashFlow / totalCashRequired`. Year 1 supplies the headline rates and monthly cash flow; equity uses Year 5. |
| Depreciation | Basis is `(purchasePrice + renovationCost) * buildingRatio`. Allocate basis over 27.5 years, limit the final partial year to the remaining basis, then stop. It is informational and does not affect cash flow or returns. |
| IRR for sale in year N | Start with negative initial cash, append each annual cash flow, and add sale proceeds only to Year N's cash flow. Return a unique supported annual rate or an explicit unavailable reason. |

The default example provides a traceable Year 1 cross-check: $28,800 scheduled rent less $1,440 vacancy gives $27,360 collected rent. Operating expenses are $8,172, leaving $19,188 NOI. Full-precision mortgage payments then leave annual cash flow displayed as $3,829, or $319 per month. The complete acceptance figures and supplementary-row definitions are in the [source notes](calculation-notes.md).

## Public entry point

```js
import { calculateInvestment, DEFAULT_INPUTS } from './src/features/calculator/engine.js';

const example = calculateInvestment();
const deal = calculateInvestment({
  purchasePrice: 300000,
  monthlyRent: 2800,
  interestRatePercent: 6.5,
  monthlyUtilities: { water: 35 },
});

if (!deal.ok) {
  // Render field-specific messages. Do not show stale financial results.
  console.table(deal.errors);
} else {
  // Raw numbers only. Currency/percentage formatting belongs to the UI.
  console.log(deal.headline, deal.years[0], deal.years[29]);
}
```

This import path assumes a module at the repository root. In the browser, use a native module script served over HTTP. `DEFAULT_INPUTS` and its expense groups are frozen numeric source defaults, not formatted strings from the preview.

### Input contract

- Supply a plain object of overrides. Omitted fields use defaults. Omitted members of an expense group also use defaults. An explicitly blank, null, or undefined field is an error, not a default or zero.
- Input rates use percentage points: `6.5` means 6.5%. Returned ratios and IRRs use fractions: `0.065` means 6.5%.
- Valid decimal strings, including scientific notation, are parsed to numbers. Currency signs, commas, hexadecimal, booleans, NaN, and Infinity are rejected. Formatting/unformatting a UI field is a separate responsibility.
- Money amounts and interest are nonnegative. Down payment, vacancy, maintenance, management, building ratio, and buying/selling closing percentages are in `[0, 100]`.
- Growth rates and appreciation are at least -100%. A -100% operating-growth assumption removes that income/cost from Year 2 onward; -100% appreciation brings the end-of-Year-1 property value to zero. Zero bases stay zero.
- Loan term must be positive and represent whole months. A 1.5-year term is valid; a fractional month is not. The projection always covers 30 years, even for shorter or longer loans.
- `monthlyUtilities` contains `electricity`, `fuelOil`, `gas`, `sewer`, `telephone`, `water`, and `other`. These are owner-paid monthly amounts, annualized once in the engine.
- `annualMiscellaneous` contains `accounting`, `advertising`, `janitorial`, `lawnSnow`, `legal`, `licenses`, `miscellaneous`, `residentSuperintendent`, `supplies`, and `trashRemoval`. These are annual amounts.
- Unknown top-level or expense-group fields are rejected. Each call creates its own normalized inputs, schedule, and projection; caller data and source defaults are not mutated.

The complete field list and exact defaults live in `constants/default-inputs.js`, not a second copied configuration in this document.

### Successful result

`{ ok: true, inputs, initial, mortgage, years, headline }`

| Member | Meaning |
|---|---|
| `inputs` | New, validated numeric input object. |
| `initial` | Down payment, loan amount, buying closing costs, renovation cost, total cash required, equity at purchase, and depreciable basis. |
| `mortgage.monthlyPayment` | Full-precision scheduled principal-and-interest payment. The actual final payment may be adjusted for the remaining balance. |
| `mortgage.months` | 360 monthly records: month, payment, principal, interest, and ending balance. After payoff, payment/principal/interest and balance stay zero. A loan longer than 30 years retains its balance. |
| `years` | 30 entries, with `year` values 1 through 30. Index 0 is Year 1. |
| `headline` | Year 1 cap rate, cash-on-cash return, monthly cash flow, initial total cash required, and Year 5 equity. |

Each year contains the income, individual operating expenses and subtotals, NOI, annual mortgage payment/interest/principal paydown, annual/monthly cash flow, appreciation, depreciation, property value, remaining loan, equity, selling costs, sale proceeds, cumulative cash flow, and return fields. Utilities and miscellaneous lines retain their own named objects under `expenses` so a table can render every source line.

`netSaleProceeds` excludes operating cash flow. `cashFlowWithSale` includes the sale year's cash flow once. Cumulative operating cash flow excludes the initial investment and sale proceeds. Supplementary workbook return definitions are explicit in the calculation notes; they are not interchangeable with IRR.

### Invalid input or unsupported money calculation

```js
{
  ok: false,
  errors: [
    { field: 'monthlyRent', code: 'required', message: '...' }
  ]
}
```

Nested error paths use names such as `monthlyUtilities.water`. Model-level errors use `field: '$'`; numeric overflow or an unrepresentable amortization schedule uses `code: 'numeric-range'`. Invalid models do not include partially calculated results.

### Unavailable ratios and IRR

A valid property model can contain undefined returns. Those values are `null`, with a machine-readable reason on that year's `unavailable` object:

- `zero-denominator`: for example, cap rate on a zero-valued property or cash-on-cash return with no initial cash.
- `negative-future-value`: annualized ending-wealth return has no supported real value.
- IRR `no-sign-change`, `no-root`, or `multiple-roots`: no supported unique finite annual return exists.
- `numeric-precision`: a return cannot be established safely within floating-point precision or the exact-arithmetic budget.

The UI should show an explanation, not format null as 0%. The five headline metrics do not carry a separate error map; consult Year 1's `unavailable` map for undefined headline cap rate or cash-on-cash return.

## Mortgage and IRR implementation

The mortgage uses fixed-rate monthly amortization. A logarithmic/exponential payment formula avoids cancellation at low positive rates; 0% interest uses principal divided by the term. The last scheduled payment clears the remaining balance. No cent rounding is applied internally, so this is a financial projection rather than an exact reproduction of a lender's cent-rounded servicing ledger.

IRR evaluates the annual cash-flow stream defined in the brief. One cash-flow sign change proves a unique positive discount-factor root. Other streams are classified using exact integer arithmetic derived from the represented IEEE-754 input values:

1. Exact Bernstein subdivision proves empty intervals, isolated simple roots, or multiple distinct roots without floating-point sign guesses.
2. Unresolved repeated/nearby roots receive a signed Sturm-chain count. A unique repeated root is reduced to a square-free polynomial before numeric refinement.
3. Numeric refinement uses the bounded transform `x = q / (1 + q)`, where `q = 1 / (1 + r)`. A residual check on the original cash flows must pass before returning the rate.

This distinguishes one repeated root from several distinct IRRs. It does not choose a root based on a starting guess. The solver accepts at most 30 annual periods and finite rates greater than -100%. Exact arithmetic has a coefficient-size budget; unsupported cases return an explicit precision limitation rather than a guessed rate. All ordinary property-money projections still use JavaScript floating-point numbers.

## Phase 2 engine verification record

Run from the repository root, using Node.js 24.22.1 as tested:

```sh
node --test tests/calculator/*.test.mjs tests/startup.test.mjs tests/check-static.mjs
```

The engine phase recorded **102 tests passed, zero failed**. The current combined suite includes UI and projection presenters and has **165 passing tests**. Engine-phase coverage includes:

- Every supplied assessment check figure, including Year 1, Year 5, Year 10, and Year 30 figures and all five headlines.
- Numeric defaults mapped to workbook cells, including the intentional 10% management override and the two added growth inputs.
- All seven utility and ten miscellaneous lines against an independent Python Decimal fixture generated at 50-digit precision.
- Independent conventional-cash-flow IRR bisection, mortgage/accounting invariants, and call-to-call state isolation.
- Zero interest, cash purchases, shorter/fractional-year and longer loans, final payoff, depreciation through its final half year, zero denominators, declining assumptions, blank/negative/invalid values, and unsupported numeric magnitudes.
- Known-factor polynomial regressions for multiple, repeated, nearby, absent, boundary, and degree-30 IRR roots, including the public-engine reproduction found in adversarial review.
- Existing source, import, asset, copy, navigation, and honest-preview checks.

**26 named checks also passed in the available Chromium-based browser**, importing the actual native modules over the local HTTP server. They include headline/default figures, horizon returns, short-loan payoff, invalid inputs, zero denominators, repeated-root IRR regressions, and confirmation that the page still shows the noninteractive preview. Evidence is saved in ignored `work/financial-source-review/browser-engine-checks.json`.

A read-only, fresh-context AI-assisted follow-up review reported no reproducible defects within its coverage. It independently exercised the original repeated-root regressions, 2,664 exact known-factor cases, and 114 additional coefficient-scaling, zero-padding, and extreme-discount-factor cases. Both root classification and computed IRR were checked. Constructed coefficients stayed within exact integer bounds; 593 generator candidates outside the degree/safe-integer limits were skipped rather than treated as reliable oracles. The 16,384-bit arithmetic-budget boundary and arbitrary extreme IEEE-754 coefficient mixtures were not exhaustively tested.

Coverage limits: this is not a proof over every floating-point input. Safari, Firefox, Edge-specific, physical-device, and assistive-technology testing have not been performed for this phase. Live UI integration and field behavior are now covered separately in [the Phase 3 verification record](interactive-calculator.md). Projection-table/chart rendering is now implemented separately; see [the Phase 4 record](projection-results.md). The owner has already deployed `main` (production) and `develop` (preview) on Vercel. Hosted verification and release of this feature remain separate from local engine verification; see [deployment workflow](deployment.md). Publishing the feature branch is a separately authorized Git operation, not a deployment or a merge into `develop` or `main`.
