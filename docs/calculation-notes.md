# Calculation source notes

## Authority and review status

The supplied assessment brief overrides workbook formulas and cached results. The local workbook was inspected read-only through its XLSX XML, including both tabs' labels, summary inputs, and early-year projection formulas/cached values. This is source mapping, not a completed 30-year formula audit or an independently validated calculation engine. The original workbook is not modified or committed.

The workbook has `Financial Summary` and `Financial Analysis` tabs. Workbook percentage values are stored as fractions; the UI must accept percentage points, for example `6.5` for 6.5%.

## Default inputs from Financial Summary

| Input | Cell | UI default | Unit |
|---|---|---:|---|
| Purchase price | C4 | 270000 | dollars |
| Value after renovation | C3 | 270000 | dollars |
| Renovation cost | C5 | 0 | dollars |
| Down payment | C11 | 25 | percent |
| Fixed interest rate | C10 | 6.5 | percent |
| Loan term | C12 | 30 | years |
| Rent | I3 | 2400 | dollars/month |
| Property taxes | I7 | 183 | dollars/month |
| Insurance | I8 | 150 | dollars/month |
| HOA | I9 | 0 | dollars/month |
| Vacancy allowance | I4 | 5 | percent of gross rent |
| Maintenance reserve | I5 | 5 | percent of gross rent |
| Management fee | I6 | 10 | percent of collected rent, brief override |
| Rent growth | I29 | 3 | percent/year |
| Property tax growth | I30 | 3 | percent/year |
| Utility growth | I31 | 1 | percent/year |
| Miscellaneous expense growth | I32 | 1 | percent/year |
| Building-to-land ratio | I33 | 50 | percent |
| Appreciation | I34 | 3 | percent/year |
| Buying closing costs | I35 | 1 | percent of purchase price |
| Selling closing costs | I36 | 7 | percent of sale value |
| Insurance growth | New input | 3 | percent/year |
| HOA growth | New input | 3 | percent/year |

All seven monthly utilities default to zero: Electricity (I11), Fuel Oil (I12), Gas (I13), Sewer (I14), Telephone (I15), Water (I16), Other (I17).

All ten annual miscellaneous expenses default to zero: Accounting (I19), Advertising (I20), Janitorial Services (I21), Lawn/Snow (I22), Legal (I23), Licenses (I24), Miscellaneous (I25), Resident Superintendent (I26), Supplies (I27), Trash Removal (I28).

Utility helper text must explain: enter only utilities the owner pays while a tenant is in place, because vacancy covers the rest; leave them out entirely if the tenant reimburses them.

Derived, read-only values: down payment amount, loan amount, monthly principal and interest, buying closing costs, and total cash required. Do not expose workbook totals as editable inputs.

## Required rules and corrections

- Loan principal is purchase price minus down payment. Use fixed-rate monthly amortization, including a zero-interest branch; stop payments when the loan is paid off.
- Total cash required = down payment + buying closing costs + renovation cost.
- Annual gross rent = monthly rent times 12, compounded by rent growth starting Year 2.
- Vacancy is a fraction of gross rent; collected rent is gross rent less vacancy.
- Management uses collected rent, not gross rent as in the workbook.
- Maintenance uses gross scheduled rent.
- Taxes, utilities, miscellaneous expenses, insurance, and HOA grow using their respective annual rates starting Year 2. Workbook insurance and HOA are incorrectly flat.
- Operating expenses include the individual expense lines, maintenance, and management, but not mortgage payments. Do not double-count utility/miscellaneous subtotal rows.
- NOI = collected rent minus operating expenses.
- Cap rate = annual NOI / start-of-year property value. Year 1 uses value after renovation. Neither workbook cap-rate output is authoritative.
- Cash-on-cash return = annual cash flow / total cash required.
- Annual cash flow = NOI minus that year's actual mortgage payments. Monthly cash flow = annual cash flow / 12.
- End-of-year value = value after renovation times (1 + appreciation rate) raised to the year number.
- Annual appreciation is the change from that year's starting value, including Year 1; do not calculate Year 1 from purchase price plus renovation.
- Equity = year-end property value minus loan balance.
- Net sale proceeds = equity minus selling closing costs, excluding annual cash flow. The workbook's sale-related row includes current-year cash flow, so do not copy its meaning unchanged.
- Effective net cash flow = annual cash flow + principal paydown + appreciation.
- Depreciable basis = building ratio times (purchase price + renovation). Depreciation is basis / 27.5 per full year, with only the remaining basis in the final partial year and zero afterward. Informational only; no effect on returns.
- Annual mortgage interest is informational and comes from the amortization schedule.
- Cumulative cash flow is the sum of annual operating cash flows, not sale proceeds or the initial investment.
- IRR for sale in year N uses negative total cash required at time zero, years 1 through N-1 cash flows, then year N cash flow plus net sale proceeds. Do not count the sale-year cash flow twice.
- Keep full precision throughout calculations. Round only at the display boundary.

## Projection row mapping

Financial Analysis rows to preserve or map explicitly:

- 5 gross scheduled income; 6 vacancy; 7 operating income.
- 9 taxes; 10 insurance; 11 HOA; 12 utilities subtotal; 13-19 individual utilities.
- 20 miscellaneous subtotal; 21-30 individual miscellaneous expenses.
- 31 maintenance; 32 management; 33 total operating expenses.
- 35 NOI; 36 mortgage expenses; 37 annual cash flow; 38 monthly cash flow.
- 39 principal paydown; 40 annual appreciation; 41 effective net cash flow.
- 44 depreciation; 45 mortgage interest.
- 48 property value; 49 loan balance; 50 equity; 51 sale-related row; 52 accumulated cash flow.
- 56 cap rate; 57 cash-on-cash return; 60 annual-sale IRR.

The workbook also has equity at purchase (Summary C7), effective future value (Analysis 53), return on equity (58), annualized return (59), and ROI (61). The brief says to match the sheet's rows but does not fully specify these supplementary return definitions. Before Phase 4, explicitly settle whether to include these and document their corrected definitions; never silently copy the workbook's flawed sale/cap-rate assumptions. Net sale proceeds must remain separately identifiable from cash flow plus proceeds.

## Acceptance fixtures from the brief, not computed by this scaffold

| Period | Metric | Expected display |
|---|---|---:|
| Initial | Loan amount | $202,500 |
| Initial | Monthly principal and interest | $1,279.94 |
| Initial | Total cash required | $70,200 |
| Year 1 | Gross rent | $28,800 |
| Year 1 | Vacancy | $1,440 |
| Year 1 | Rent collected | $27,360 |
| Year 1 | Property taxes | $2,196 |
| Year 1 | Insurance | $1,800 |
| Year 1 | Maintenance | $1,440 |
| Year 1 | Management | $2,736 |
| Year 1 | Total operating expenses | $8,172 |
| Year 1 | NOI | $19,188 |
| Year 1 | Mortgage payments | $15,359 |
| Year 1 | Annual cash flow | $3,829 |
| Year 1 | Monthly cash flow | $319 |
| Year 1 | Cap rate | 7.11% |
| Year 1 | Cash-on-cash return | 5.45% |
| Year 1 | Principal paydown | $2,263 |
| Year 1 | Appreciation | $8,100 |
| Year 1 | Depreciation | $4,909 |
| Year 1 | IRR if sold | -11.36% |
| Year 5 | Annual cash flow | $6,237 |
| Year 5 | Equity | $123,442 |
| Year 10 | Annual cash flow | $9,677 |
| Year 10 | IRR if sold | 15.10% |
| Year 30 | Insurance | $4,242 |
| Year 30 | Cumulative cash flow | $452,099 |
| Year 30 | IRR if sold | 14.04% |

## Edge-case policy to settle and test in Phase 2

- Blank, invalid, non-finite, and negative entries must produce understandable validation, not silently misleading results.
- Distinguish invalid negative costs from potentially meaningful negative growth/appreciation rates.
- Define allowable percentage ranges and whether fractional-year loan terms are supported.
- Zero interest must amortize correctly; zero principal must not produce invalid mortgage math.
- Guard zero denominators for cap rate and cash-on-cash return.
- IRR may not exist, and nonconventional cash flows may have multiple roots. Explain unavailable or ambiguous results rather than returning an arbitrary percentage.
- Shorter loans must stop both payments and interest; depreciation must never exceed its basis.
