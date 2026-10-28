# Browser checks

Serve the repository root over HTTP and open the calculator in a disposable test tab. These checks edit fields and reset them to the example values; do not run them in a tab containing a deal you want to keep.

Wait until the calculator controls are visible and `document.getElementById('app').dataset.startupState` is `ready`; the document load event alone is not the application's ready signal. In the browser's developer console:

```js
const qa = await import('/tests/browser/interactive-calculator.mjs');
await qa.runCalculatorChecks();
await qa.runCalculatorRefinementChecks();
qa.runCalculatorLayoutChecks();
qa.runCalculatorContrastChecks();
qa.runCalculatorPrivacyChecks();
```

Each runner returns named passing assertions and a total, or throws on the first failure. It exercises the actual page and financial engine, without a replacement DOM or mocked financial results. `runCalculatorLayoutChecks()` temporarily opens Advanced assumptions and inserts/removes native select style probes. The financial input form itself has no select fields; the graph and table each have a native year select outside that form.

Repeat layout checks at 375, 390, 768, 1024, 1440, and 1920px, with touch emulation for phone sizes. Disable the network cache and reload while testing source changes: changing only the document query string does not guarantee that an imported module is fresh.

## Native keyboard repeat checks

Synthetic JavaScript input events cannot replace these checks:

1. Focus Advanced assumptions and press Enter to open it.
2. Press Tab and confirm the vacancy field receives focus.
3. Select the monthly rent value and type 3000. Confirm cash flow updates without submission.
4. Focus Reset to example and press Enter. Verify **both** rent 2400 and monthly cash flow $319 are restored together.
5. Focus View results and press Enter. Confirm valid inputs reveal the detailed destination and move focus to its heading. Invalid inputs instead focus the first error.
6. Follow Edit property numbers in the detailed-results header and confirm focus returns to the input heading without clearing values.
7. Focus the open Advanced summary and press Enter to close it.
8. Open Advanced assumptions, follow a group jump link, and confirm keyboard focus lands on that group heading. Reload the fragment URL and confirm the Advanced section is revealed.
9. Change all advanced values before pressing Reset to example. Confirm every value and the default results are restored; the refinement runner automates this full-form regression.

Also inspect phone inputs, advanced utilities and helper text, default results, invalid fields, and zero-basis N/A explanations. Check actual keyboard focus and scroll positioning, not just CSS classes.

The implementation was tested with the available Chromium-based automation browser. Its local reports/screenshots are ignored under `work/qa/interactive-calculator/`; they are not a cross-browser certification. See [the complete Phase 3 record](../../docs/interactive-calculator.md).


## Long-term projection checks

```js
const projection = await import('/tests/browser/projection-results.mjs');
await projection.runProjectionChecks();
projection.runProjectionLayoutChecks();
```

The functional runner checks all 30 years, the 51 financial rows, table/headline/chart agreement, input changes, invalid clearing/recovery, selected-year preservation, reset, early payoff, negative/zero values, N/A explanation references, and the actual native year select's 16px text. The layout runner verifies local horizontal/vertical scrolling, full calculator width, sticky row/year headers, chart sizing, and no whole-page overflow at the six viewport configurations above.

The existing financial input form still uses text fields; the projection has a real year-navigation select outside that form. Native keyboard repetition should include End in the year select, arrow keys in the focused table, and Enter on a table-section jump link. Check actual sticky geometry while scrolling both axes, not merely computed `position: sticky`.

For long regression runs under a short CDP response deadline, start the async runner with a queued timer, retain results on a test-owned window property, and read back its observable completion state before navigating. Scenario loops yield to the browser task queue; microtask-order reset regressions remain intact. Keep batches/results bounded and persist each completed viewport so an automation timeout does not erase earlier evidence.

See [the Phase 4 record](../../docs/projection-results.md). These browser checks are not Safari/Firefox/Edge or screen-reader-speech certification.


## View results and actual Chart.js

The initial detailed area is hidden while the live preview updates. Run the flow check first in a fresh ready document without a projection fragment:

```js
const flow = await import('/tests/browser/results-flow.mjs');
await flow.runResultsFlowChecks();
flow.runResultsActionLayoutChecks();
// At a phone viewport, with the tab in the foreground:
await flow.runStickyResultsFocusChecks();
```

Use a **different fresh document** for the library-laziness check, because the first runner opens results and loads the library:

```js
const chart = await import('/tests/browser/chartjs-results.mjs');
await chart.runChartResultsChecks();
chart.runChartControlContrastChecks();
```

The library is an actual local Chart.js 4.6.1 instance, not a mocked graph. Inspect it through `Chart.getChart(document.querySelector('[data-projection-canvas]'))`; dataset `rawValues` must match the current engine years. The selected metric/year are native controls, and inspecting a year provides a visible amount outside Canvas. The table remains the full accessible equivalent.

Exercise delayed loading with an invalid-to-valid edit before the asset finishes. Verify loading status is restored and the final graph uses the latest deal. Block the local vendor request to verify table fallback; unblock it and activate Retry chart with native Enter. Failed retry must retain retry focus, while success must move focus to the selected metric only when retry still had focus.

Check actual resized canvas geometry, hover tooltip content, selected metric contrast/shape, and font readiness. Settle smooth/native scrolling and confirm hover coordinates hit the canvas with `elementFromPoint` before diagnosing a missing tooltip. Run visual/keyboard animation probes in a foreground tab and restore all request blocking, throttling and reduced-motion emulation afterward.
