# Calculator enhancements

## Scope

Implemented locally on `feat/calculator-enhancements`, based on `ca3043c`. The financial engine, defaults, mortgage, IRR and validation rules are unchanged. All enhancements consume the same model as the live figures. No framework, runtime package install, backend, deployment or automatic financial-data storage is added. The contact form intentionally stays a browser-only demo.

## Theme and favicon

- The header toggle shows the **current** mode: sun for light, moon for dark. Its accessible name describes the next action.
- A small blocking bootstrap reads `intrigue-theme` before styles/paint. Without a valid explicit choice, the site follows `prefers-color-scheme`, including subsequent OS changes. Explicit choices override OS changes. Storage denial does not break the app; choices still work for that page.
- Raleway and the exact assessment brand palette/8px action corners remain. A live review of Intrigue's homepage informed deep blue-green backgrounds, pale text and lime accents in dark mode. Unrelated navigation/claims were not copied. Header, hero, guidance, calculator, charts/table, contact and footer have appropriate surfaces; brand-highlight areas may intentionally remain dark in light mode.
- Chart.js recolors without recalculating finances, recreating form inputs or losing selected metric/year. Startup retry can bind the replacement theme button. Mobile hamburger borders are removed, not keyboard focus outlines.
- The supplied transparent map-pin PNG was alpha-cropped and padded/resized to a 64px favicon under `assets/images/intrigue-map-pin-favicon.png`. The external original was not modified.

## Current-deal boundary

`initializeCalculator()` exposes `getSnapshot()`, `subscribe(listener)`, `refresh()` and `revealResults()`. Each normal update captures raw strings and one engine result as `{inputs, model}`. Subscribers get invalid state as well as valid state; previous snapshots are not mutated. Page composition wires the report/share tools and contact review to this API. No second investment engine, global deal store or event-driven recomputation is introduced.

## PDF report

After View results, **Save full report as PDF** generates and downloads an actual PDF in the browser. It does not open a report popup or invoke `window.print()`, and does not depend on a configured printer/PDF destination. The browser may still ask where to save downloads according to its own settings.

The filename is `intrigue-rental-investment-report-YYYY-MM-DD.pdf`, using the local date when export is requested. A progress state prevents duplicate exports and recovers after a loading/generation failure. Input edits during preparation do not rewrite the captured snapshot; completion explicitly identifies an earlier snapshot if the deal changed.

The paper-oriented report is light regardless of screen theme and independent of the selected graph metric/year. It includes:

- all 40 current raw assumptions, units and plain-language helpers;
- five headlines and four financing figures with applicable N/A explanations;
- both annual cash-flow and end-of-year equity graphs, each with all 30 points;
- all 51 financial rows over all 30 years (1,530 values), in six five-year bands with repeated table headers;
- unavailable-return explanations, source-row glossary, sale/rounding caveats, a dated brand header and page numbers.

`report/pdf-document.js` draws native PDF text and vector graphs from the same validated snapshot/presenters; it adds no investment formulas. `report/download-report.js` turns the document into a PDF Blob and a normal download, with delayed object-URL cleanup. The app's inputs, selected metric and year remain unchanged. `investment-report.js` retains the HTML preview/snapshot-validation helper for diagnostics, but the Save action no longer invokes that preview or its print workflow.

`services/pdf-library.js` lazily loads unmodified **jsPDF 4.2.1** and **AutoTable 5.0.9**, plus local unmodified static Raleway regular/bold TrueType faces and the existing logo. npm tarball SHA-512 integrity and bundle/font SHA-256 provenance are recorded under `assets/vendor/`; MIT/OFL notices are retained. This requires no npm install/build step or external PDF CDN. Optional jsPDF HTML/SVG rendering dependencies are not used. PDF generation makes no request containing financial/contact data. Contact names, email and messages are excluded.

The directly downloaded example is **19 A4 pages**, about 221 KB: all nine summary/financing figures fit the cover, both graphs fit page two, and all 1,530 expected formatted projection values survive PDF text extraction. No extracted characters were outside page bounds. Cover, graphs, assumptions, table continuation and glossary pages were inspected. Input lengths can change pagination. This is not PDF/A or certified accessible/tagged PDF.

## Sharing

**Copy share link** serializes the 40 canonical financial strings into a bounded, versioned base64url fragment (`#deal=...`). Contact details, theme and arbitrary extra properties are not encoded. Existing query parameters are stripped from the copied URL. Base64 is encoding, not encryption; anyone with the link can read it. A fragment is not part of an ordinary HTTP request, but can remain in browser history and can be read by browser software or a recipient.

On load or a deal-fragment change, the codec validates version, exact payload shape/length and decimal-string safety. The existing engine validates financial bounds after restoration. All 40 controls are restored before results are revealed; a malformed link leaves current values unchanged and displays a notice. A structurally valid but financially invalid link restores those strings with errors, not invented estimates.

The copy action has a visible manual-copy fallback when clipboard permission is unavailable. New edits clear a displayed old link and invalidate pending copy-status updates. Edits and Reset are not automatic URL saves; create a new link to share the revised deal. Neither names/contact fields nor deal numbers are written to browser storage.

## Demo contact inclusion

**Include my current deal numbers** is unchecked by default. Opt-in exposes a read-only disclosure with all 40 inputs and the nine headline/financing figures. It follows the current calculator, including raw decimal precision, without overwriting the visitor's text. Invalid opted-in deals clear the old review, explain the problem and block only the local confirmation; unchecking permits a general message even while calculator inputs are invalid. Changes invalidate a prior ready confirmation.

Check my message still performs only browser validation. Confirmation explicitly says nothing has been sent. No network request, mail service, CRM, persistence or real attachment is added.

## Verification and repeatable browser checks

```sh
node --test tests/calculator/*.test.mjs tests/*.test.mjs tests/check-static.mjs
```

The combined suite passes **165 automated tests**. Current regressions include the financial oracle fixtures plus theme persistence/denial/remount, raw sharing/rejection, report completeness/scaling, direct PDF generation/download, local-date filename, lazy dependency loading/retry, opt-in behavior and tool markup. Browser checks are in:

- `tests/browser/theme-enhancements.mjs`: mode/icon preservation and 30 representative text contrast pairs.
- `tests/browser/pdf-download.mjs`: actual PDF Blob/signature/filename, no popup/printing, retained inputs and busy-state recovery. Allow test-owned browser downloads and inspect the real saved file.
- `tests/browser/deal-tools.mjs`: clipboard fallback, invalid-state guards, contact review and the report action wrapper.
- `tests/browser/calculator-enhancements.mjs`: snapshot subscriptions, invalidity and immutable earlier inputs in a disposable fixture.
- Existing calculator, projection, results-flow and Chart.js runners remain available; use fresh ready documents for initial-state/lazy-load checks.

Observed Chromium checks include exact restoration of all 40 modified fields through fresh navigation, no shared personal/contact fields, malformed-link notices, both themes at 320/375/768/1024/1440/1920px, and 30 text pairs plus eight graph-control contrast checks in each mode. The real downloaded PDF was extracted, reconciled against engine-presenter values and rasterized; this is not a screenshot-only export or a simulated save. Named evidence, downloads and screenshots remain ignored under `work/qa/`. QA-only PDF inspection tools are not application dependencies.

The header logo was further reduced, vertically centered and inset from the navigation pill's left edge. A conflicting phone-only size override was removed; the combined brand link keeps a 44px hit area. Existing navigation/theme/menu behavior is preserved.

Limits: Chromium/touch emulation is not physical Safari/iPhone, Firefox/Edge-specific, screen-reader speech or complete WCAG certification. Download behavior can vary by browser/device. Publishing requires the owner's explicit approval and is limited to the feature branch; PR creation, merging and deployment are separate steps.
