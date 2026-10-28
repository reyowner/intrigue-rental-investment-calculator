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

Each runner returns named passing assertions and a total, or throws on the first failure. It exercises the actual page and financial engine, without a replacement DOM or mocked financial results. `runCalculatorLayoutChecks()` temporarily opens Advanced assumptions and inserts/removes native select style probes. The current financial form itself has no select fields.

Repeat layout checks at 375, 390, 768, 1024, 1440, and 1920px, with touch emulation for phone sizes. Disable the network cache and reload while testing source changes: changing only the document query string does not guarantee that an imported module is fresh.

## Native keyboard repeat checks

Synthetic JavaScript input events cannot replace these checks:

1. Focus Advanced assumptions and press Enter to open it.
2. Press Tab and confirm the vacancy field receives focus.
3. Select the monthly rent value and type 3000. Confirm cash flow updates without submission.
4. Focus Reset to example and press Enter. Verify **both** rent 2400 and monthly cash flow $319 are restored together.
5. Focus View estimates and press Enter. Confirm focus moves to the results heading.
6. Follow Edit property numbers and confirm focus returns to the input heading.
7. Focus the open Advanced summary and press Enter to close it.
8. Open Advanced assumptions, follow a group jump link, and confirm keyboard focus lands on that group heading. Reload the fragment URL and confirm the Advanced section is revealed.
9. Change all advanced values before pressing Reset to example. Confirm every value and the default results are restored; the refinement runner automates this full-form regression.

Also inspect phone inputs, advanced utilities and helper text, default results, invalid fields, and zero-basis N/A explanations. Check actual keyboard focus and scroll positioning, not just CSS classes.

The implementation was tested with the available Chromium-based automation browser. Its local reports/screenshots are ignored under `work/qa/interactive-calculator/`; they are not a cross-browser certification. See [the complete Phase 3 record](../../docs/interactive-calculator.md).
