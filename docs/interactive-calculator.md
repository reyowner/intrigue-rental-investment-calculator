# Interactive calculator

## Phase 3 scope

The landing-page preview is replaced with a browser-only form connected to the existing calculation engine. There is no second implementation of the financial formulas, backend, framework, package installation, or build step.

Phase 3 was implemented on `feat/interactive-calculator` and merged into `develop`. Phase 4 continues separately on `feat/projection-table-chart`; its publishing and deployment require separate authorization.

## Complete input coverage

All **40 engine inputs** have a visible label, an accessible unit, and individual plain-language helper text. Numeric defaults are read from `DEFAULT_INPUTS`, not copied formatted strings.

| Location | Contents |
|---|---|
| Primary inputs, 10 | Purchase price, value after renovation, renovation cost, down payment, interest, loan term, monthly rent, taxes, insurance, HOA. |
| Advanced reserves, 3 | Vacancy, maintenance reserve, management fee. |
| Advanced utilities, 7 | Electricity, fuel oil, gas, sewer, telephone, water, other. Monthly amounts. |
| Advanced miscellaneous, 10 | Accounting, advertising, janitorial services, lawn care/snow removal, legal, licenses, miscellaneous, resident superintendent, supplies, trash removal. Annual amounts. |
| Advanced operating growth, 6 | Rent, property taxes, insurance, HOA, utilities, other expenses. Insurance and HOA each default to 3%. |
| Advanced property/closing, 4 | Building-to-land ratio, appreciation, buying closing costs, selling closing costs. |

The utilities explanation is included verbatim:

> Only enter utilities the owner pays while a tenant is in place. Vacancy already accounts for the rest. Leave utilities out if the tenant reimburses them.

Some advanced assumptions affect later annual rows or IRR rather than the five headline results. Phase 3 included them in the complete model; Phase 4 now exposes those effects in the detailed table and charts. See [long-term results](projection-results.md).

## Source-aware page copy

The estimate note explicitly ties results to the numbers and assumptions entered in the form. The form introduction and how-it-works note identify the starting example as adapted from Intrigue's real-duplex spreadsheet. Related result/footer copy uses the same input-based framing, while retaining the uncertainty of actual results. The spreadsheet is described as adapted with the specified calculation updates, not reproduced without correction; the assessment brief remains authoritative. These wording changes do not alter defaults or formulas, expose the private workbook, or change the contact form's truthful local-only status.

## Behavior and ownership

- `constants/input-fields.js`: complete control metadata and helpers, with source-derived defaults. A test compares its field paths with every engine input, so omissions and duplicate fields fail.
- `components/calculator.js` and `.css`: native form, fieldsets, Advanced assumptions disclosure, read-only totals, headline results, and responsive styling.
- `utils/input-values.js`: raw form entries to the engine's nested input shape. Blanks stay blank so validation is meaningful.
- `utils/result-view.js`: display formatting and explicit unavailable-result explanations. It does not calculate financial results.
- `calculator-controller.js`: invokes `calculateInvestment()` on input/change, updates text and errors without replacing the controls, and handles reset and error navigation.
- Homepage composition mounts and initializes the feature. Financial mathematics remain in the existing engine modules.

The form shows read-only loan amount, scheduled monthly principal and interest, buying closing costs, and total cash required. The five live headline figures are cap rate, cash-on-cash return, Year 1 monthly cash flow, total cash required, and Year 5 equity.

### Invalid and unavailable values

An invalid field receives `aria-invalid`, a nearby error, and a linked error-summary entry. All derived and headline values are cleared to N/A immediately instead of retaining a previous deal's apparently valid estimates. Correcting the field restores the current model. A model-level numeric-range failure is also explained in the summary.

A valid model with a zero denominator shows N/A and the specific reason. A genuinely defined zero remains `$0` or `0.00%`; negative cash flow remains negative. Focus, caret, disclosure openness, and typed values are retained while recalculating.

Reset restores example values and estimates together. Native trusted keyboard testing exposed a reset-event timing issue that programmatic `form.reset()` alone did not catch; the controller now owns that reset synchronously. Reset leaves disclosure openness intact. A follow-up regression changes all 30 advanced values together, then verifies that the actual reset button restores every one of the 40 inputs and the default estimates.

Entry instructions distinguish raw inputs from formatted results: “Enter amounts in US dollars without commas. Results are formatted automatically.”

### Responsive and accessible behavior

The page and calculator section have no fixed maximum width. Text and form internals remain readable within the full-width page. Layout is one column on phones and inputs/results are side by side on larger screens.

All current financial controls are numeric **text inputs**, not selects, so fractional terms and typed invalid values can be handled consistently. Positive amounts use a decimal keyboard hint; growth/appreciation use a text keyboard hint so a minus sign is available. Both calculator-field and global native-select styles were verified with temporary select probes; these are style checks, not claims that the production form contains a select.

Native details/summary supports keyboard disclosure. Its closed summary identifies all 30 advanced defaults as editable. Jump links lead to the existing five groups, with visually distinct, focusable headings; directly linked groups are revealed on reload. Error links open a collapsed Advanced section and focus the relevant control. Result/edit links let visitors navigate a long phone form. A single polite live status announces updated results; visible helpers and unavailable reasons remain available for reading.

## Verification

Run all automated source/financial/presentation tests:

```sh
node --test tests/calculator/*.test.mjs tests/startup.test.mjs tests/check-static.mjs
```

**113 tests passed** using the existing dependency-free Node runner. The existing financial modules and their acceptance figures are unchanged.

Actual local Chromium-based browser verification:

- **8 follow-up refinement assertions** verify entry instructions, editable disclosure context, group destinations, simultaneous changes to all advanced values, full reset, formatted results, and preserved disclosure state.
- **161 functional assertions:** all defaults/helpers, all 40 fields blanked individually and corrected, input changes, nested expense units, invalid values, zero interest, short loans, N/A versus real zero, negative values, reset ordering, disclosure/error focus, and current headline results.
- **98 layout assertions at each of 375, 390, 768, 1024, 1440, and 1920 CSS-pixel viewport configurations:** open/closed overflow, full-width page surfaces, all input/textarea font sizes, native-select style probes, control heights, IDs and landmarks. The 375/390 configurations used touch emulation.
- **9 keyboard/group-navigation checks:** Enter/Tab disclosure behavior, actual text insertion, keyboard reset, native result/edit link focus, group-heading focus, and group-fragment reload.
- **8 contrast spot checks:** text pairs exceeded 4.5:1; input and reset-button boundaries exceeded 3:1. The boundary color was strengthened after the initial check failed.
- **4 local-processing/security checks:** no calculator fetch/XHR requests or web-storage writes during the exercised edits, no values added to the URL, and invalid HTML-like input stayed data rather than becoming DOM.
- No uncaught errors or unhandled promise rejections on the instrumented document load and exercised interaction run. Phone input/result/N/A and desktop layouts were visually inspected.

The repeatable browser module and instructions are in [tests/browser](../tests/browser/README.md). Named results and screenshots are local, ignored evidence under `work/qa/interactive-calculator/`, not production assets. Development checks disabled the browser cache after finding that a new page query alone could still load an old native module.

A fresh-context AI-assisted review independently exercised all 40 fields through 120 blank/change/restore state comparisons and found one accessibility issue in the earlier markup: percentage units were not available to assistive technology. The labels now include spoken units for every field, and a final Chromium accessibility-tree read verified all 40 accessible names include their units and have their helper descriptions. The read-only review reported no other confirmed defects within its tested scope.

Limits: available Chromium-based automation and touch emulation are not physical iPhone/Safari, Firefox, Edge-specific, screen-reader, or complete WCAG conformance testing. Exact browser assertions and color-pair checks do not guarantee future investment performance.

## Phase 4 follow-up

The following mandatory Phase 4 scope is now implemented separately in [long-term results](projection-results.md):

1. Render the complete 30-year projection, including every individual expense line, mortgage and depreciation detail, equity/sale figures, cumulative cash flow, and annual returns/IRR.
2. Keep the table usable on a phone, with clear year/row orientation and keyboard-accessible horizontal scrolling rather than whole-page overflow.
3. Add at least one real engine-backed chart with equivalent accessible data.
4. Verify agreement between headlines, table, chart, and the same calculated model.

Phase 3 originally deferred this UI instead of shipping a placeholder. The current application includes the real table and an engine-backed Chart.js graph with cash-flow/equity controls, revealed through View results while headline estimates remain live. The historical Phase 3 counts above are retained; the current combined Node suite passes 165 tests.
