# 30-year projection and results experience

## Scope and authority

Phase 4 is implemented on `feat/projection-table-chart`, based on the merged `develop` branch. It adds the complete projection table, a branded Chart.js line chart and an explicit **View results** flow. Financial formulas, defaults, validation, mortgage calculations and the IRR solver remain unchanged. No framework, package installation, build step, backend or storage is required. The feature branch is authorized for commit/push. PR creation and merging remain manual. Existing Vercel deployments use `main` for production and `develop` for preview; feature-branch builds are skipped. See [deployment workflow](deployment.md).

The assessment brief overrides known workbook errors. All **49 financial rows** in the read-only Financial Analysis audit are mapped to the engine. Two sale-accounting breakdowns bring the table to **51 financial rows across all 30 years**, or **1,530 value cells**. Every utility and miscellaneous line remains visible, including zero costs. `sourceRow: null` identifies the added selling-closing-cost and cash-flow-plus-sale rows. The workbook is not loaded or redistributed at runtime. See [source mappings and corrections](calculation-notes.md).

## Investor flow

1. Enter the ten primary deal inputs, with the other 30 editable defaults in Advanced assumptions. Financing totals remain read-only.
2. Headline estimates and the underlying projection update immediately while typing. Detailed results start hidden; the Chart.js bundle is not requested yet.
3. Select **View results**, one form-submit action after the inputs. A sticky action stays reachable inside the form on phone/tablet layouts. The live-preview card no longer has adjacent, competing edit/projection links.
4. Invalid inputs prevent initial reveal and focus the first error, opening Advanced assumptions if necessary. A model-level error focuses the error summary. No server submission or navigation away occurs.
5. Valid submission reveals the same-page destination and focuses its heading. A synchronized copy of all five headline figures comes first, then the graph, full table, glossary and contact action.
6. **Edit property numbers** returns to the existing form without losing values. Once opened, results remain live without another results click. Invalid edits show a correction state; correction restores the current deal.

Reset restores all 40 defaults and results while retaining disclosure openness, opened-results state and viewing controls. Direct projection/table/group fragments reveal details before initial scrolling. The results button controls visibility/navigation, not calculation. There is no email gate.

## Feature ownership

- `calculator-controller.js`: one engine calculation per update, synchronized headline/derived/overview output, validation and results focus/navigation.
- `constants/projection-rows.js`: source row/path mappings, labels, units and explanations.
- `utils/projection-view.js`: formatted annual values and deduplicated unavailable-return notes, not financial calculations.
- `components/projection-results.js` and `.css`: destination summary, semantic table, navigation, glossary, correction state and contact step.
- `projection-controller.js`: stable table-cell updates, retained scroll/year state and chart lifecycle bridge.
- `components/projection-charts.js` and `.css`: static chart card and native controls.
- `utils/projection-chart-view.js`: graph configuration, value/tooltip formatting and safe display scaling of existing engine values.
- `projection-chart-controller.js`: lazy creation, instance reuse, metric/year selection, clearing, retry and late-font redraw.
- `services/chart-library.js`: on-demand local loading, version checking, request coalescing and retryable failure.

Inputs, caret, table nodes and chart controls are not replaced on ordinary edits. One chart instance updates in place. Invalid models destroy/unregister it, clear its pixels/raw datasets, and clear all financial displays. Correction uses the latest model and retains metric/year. A pending library load also renders the latest model rather than an old request snapshot.

## Chart.js distribution and design

**Chart.js 4.6.1** is vendored as the unmodified official UMD bundle at `assets/vendor/chartjs/chart.umd.min.js`. Registry tarball SHA-512 was verified before whitelist extraction. The 210,082-byte bundle SHA-256 is `87364cc2b2a76a6684929e7d6b80b18a897794db38400caff1fcf1791c6925d2`.

`assets/vendor/chartjs/provenance.json` records version, source and integrity. Chart.js and bundled `@kurkle/color` 0.3.2 retain their MIT licenses/notices in that directory. No npm install or external chart CDN is needed. Existing Google Fonts loading is separate.

The card has **Annual cash flow / Equity** controls, with an appropriate dollar scale for the selected metric and all 30 annual points. It avoids an ambiguous dual axis or flattening cash flow against larger equity values. Teal lines, a light-teal grid, restrained lime markers, Raleway, 8px corners and bounded responsive height match Intrigue. The active metric has a contrasting boundary and inset shape cue, not only lime fill. Chart animation is disabled.

A native **Inspect year** select exposes the selected year's amount outside the canvas. Hover/touch tooltips use original dollar values. Controls have at least 44px targets; selects have at least 16px text. The named/described canvas refers to the equivalent table. Canvas pixels alone are not assumed screen-reader accessible: native controls and the semantic table are the non-pointer alternatives.

`Chart.getChart(canvas)` exposes the actual instance; dataset `rawValues` retains engine precision, `options.projectionMetric` identifies the series and `options.projectionScale` identifies display scaling. Very large/tiny ranges are normalized without changing the model or tooltip data. Ordinary amounts are rounded for display; compact/scientific notation keeps extreme labels readable. Zero and negative series stay numeric.

The bundle loads only after reveal, including an intentional direct projection fragment. The table does not wait for the graph. Load/constructor/update failure shows chart-specific retry/table fallback without crashing the app. Invalid-to-valid recovery during a pending request restores truthful loading status. Failed keyboard retry retains focus; success transfers it to the selected metric only if retry still owned focus. Late webfonts redraw only the still-current chart.

## Table navigation and unavailable values

The table uses full calculator width inside a bounded local scrollport, not whole-page horizontal overflow. Sticky row/year/corner headers, a labelled **Jump to year** select, native arrow-key scrolling and nine section links preserve orientation. A narrow override also makes selected amounts readable at 320px, below the assessment minimum.

Every value references its row/year/group headers. The caption explains annual dollars, the monthly cash-flow exception, percentages and separate hypothetical sale years. **Understand these numbers** exposes a glossary, also referenced by row headers while closed.

Table money is rounded to dollars; the separate scheduled monthly mortgage payment retains cents. Fractional rates use two decimal percentage places. No display rounding feeds back into the model or raw chart data.

Unavailable returns show **N/A**, numbered markers and accessible references to visible, deduplicated explanations. Reasons distinguish zero initial cash, zero starting property value, zero equity, negative ending wealth, absent/ambiguous IRR and supported-precision limits. Genuine zero/negative results remain numeric. The glossary distinguishes sale proceeds from cash flow, noncash effective gains from cash income, ending wealth from profit and supplementary returns from IRR. Depreciation/interest are informational, not costs to subtract twice.

## Verification

```sh
node --test tests/calculator/*.test.mjs tests/startup.test.mjs tests/check-static.mjs
```

The current combined suite passes **138 tests** with Node.js 24.22.1. Coverage includes the independent 49-row fixture over all 30 exact model years, assessment figures, nonzero expenses, sale accounting, null/zero/negative values, no mutation, semantics, safe graph configuration, lazy loading/failure, instance reuse, pending-load races, retry focus and font lifecycle. Financial-engine modules remain unchanged from `develop`.

Run the flow check first on a fresh disposable ready document:

```js
const flow = await import('/tests/browser/results-flow.mjs');
await flow.runResultsFlowChecks();
```

On another fresh document, before opening results:

```js
const chart = await import('/tests/browser/chartjs-results.mjs');
await chart.runChartResultsChecks();
chart.runChartControlContrastChecks();
```

Table/layout checks:

```js
const projection = await import('/tests/browser/projection-results.mjs');
await projection.runProjectionChecks();
projection.runProjectionLayoutChecks();
projection.runProjectionYearJumpChecks();
```

Runners edit/reset values; never use a tab containing a deal you want to keep. Wait for explicit app/chart readiness. Long runs queue async work and read back bounded completion states.

Observed Chromium verification:

- 18 results-flow, 16 real Chart.js integration and 33 full-projection checks passed.
- Existing calculator regressions passed: 161 functional, 8 refinement, 8 contrast and 4 privacy checks. Privacy checks also passed after graph loading: financial edits made no fetch/XHR/storage writes and added no values to the URL.
- Widths 320, 375, 390, 768, 1024, 1440 and 1920px passed 100 calculator, 8 projection-layout and 3 year-amount-visibility checks each, plus results-action and actual graph checks. Graph selects were at least 16px and controls at least 44px.
- Eight graph-control/line contrast and selection-cue checks passed. Earlier low-contrast active boundaries were corrected.
- Nine phone focus-visibility regressions passed with normal and reduced motion after fixing a field obscured by the sticky results action. Native focus and validation layout changes now keep the active input clear of the header/action.
- Native Enter revealed results/switched metrics; End selected Year 30. Accessibility-tree names covered canvas/year inspection. A real hover tooltip showed Year 15 and its formatted cash flow.
- Delayed loading with invalid-to-valid edits rendered the latest deal. Blocked loading left the full table/app usable. Failed/successful keyboard retry retained/transferred focus correctly.
- Phone/desktop screenshots of the real results and Chart.js card were visually inspected. Evidence is ignored under `work/qa/chartjs*`.

An earlier bounded read-only review found one 320px year-jump clipping issue. It was reproduced, fixed and retested against selected text bounds. No other defects were reproduced within that review's scope; this is not a professional audit.

Limits: Chromium automation/touch emulation is not physical Safari/iPhone, Firefox, Edge-specific, screen-reader speech or complete WCAG certification. Projections are assumption-dependent estimates, not guarantees. This feature is not deployed by its branch push; it reaches the existing preview only after a manual merge into `develop`. Production promotion remains a separate manual PR into `main`.
