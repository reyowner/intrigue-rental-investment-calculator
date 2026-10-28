# Startup and hard reloads

## Observed behavior

The initial document contained a development fallback that looked like a failed application and incorrectly suggested serving HTTP even when the URL was already `http://localhost:8000/`.

In four instrumented reloads of the reported result-section URL, the application eventually mounted without startup errors. The three cold/hard reloads left the old placeholder mounted for approximately 3.3 seconds while the native JavaScript graph downloaded. The cached reload replaced it in approximately 0.03 seconds. These are local DOM timings, not a universal performance guarantee. A persistent failure in the user's browser was not reproduced.

## Changes

- `index.html` contains a small, self-styled loading screen that does not depend on the external application stylesheet to look intentional.
- Normal loading copy describes preparing the calculator. It does not diagnose file access or HTTP configuration as an error.
- `src/bootstrap.js` dynamically imports `main.js`, then marks the app ready. Import/dependency failures and initialization exceptions are caught. If rendering replaced the loading screen before an exception, the original screen is restored as an error screen.
- An HTML entry-script error guard covers failure to fetch the bootstrap itself. Retry is a native link, so it also works when that script never ran.
- Root states are `data-startup-state="loading"`, `ready`, or `error`. `aria-busy` becomes false for both ready and failed states. Actual failures expose an alert and Try again action; they are also logged to the browser console for diagnosis.
- The no-JavaScript copy accurately states that JavaScript is required, not that the calculator has not been implemented.
- The main application module is preloaded to overlap its request with bootstrap loading. This remains native HTML/CSS/JavaScript, without a bundler or build step.

A hard reload still has to download resources. The change makes that wait clear and separates it from a real failure; it does not claim instant startup or eliminate every possible client/network problem.

## Branded animation and refresh behavior

The loading screen uses the website's dark teal, the original lime Intrigue mark with unchanged path geometry, and a thin decorative orbit. The mark itself does not rotate or distort. The loader is self-contained, with no animation library or extra logo request.

The content has a **180ms reveal grace period**. If the app is ready before then, the loading content is removed without appearing. This does not hold back a ready page or impose a minimum animation duration. Three foreground cached-reload checks reached the ready page without revealing the loader. Slower reloads still show it intentionally.

Reduced-motion mode stops the orbit and uses an instant, non-moving reveal after the same grace period. Error states bypass that delay, stop the loading animation, and show retry immediately. No-JavaScript mode remains static and explains how to enable the calculator.

Motion was verified with changing transform matrices in an active test tab under temporary network delay, rather than assuming an animation name proves movement. The phone design was visually inspected, reduced-motion visibility was checked, and network/media emulation was restored afterward. A hidden/background tab can pause animation timelines and is not a valid motion test.

## Verification

The full automated command now includes the startup document regression:

```sh
node --test tests/calculator/*.test.mjs tests/startup.test.mjs tests/check-static.mjs
```

**113 tests passed.** Browser verification additionally passed ten startup scenarios:

1. Cold localhost load with result fragment.
2. Hard reload 1.
3. Hard reload 2.
4. Hard reload 3.
5. Blocked calculator dependency shows real error.
6. Retry recovers after dependency restored.
7. Blocked entry script still shows error via HTML guard.
8. Retry recovers after entry restored.
9. Initialization exception restores error screen after partial render.
10. Retry recovers after initialization failure.

The existing 161 functional and eight refinement browser checks were rerun after startup changed and passed. A genuine loading screen was visually inspected at phone size using temporarily delayed network requests; throttling was removed afterward.

`tests/browser/startup-checks.mjs` checks actual ready/error DOM states. Local diagnostic reports and screenshots are ignored under `work/qa/reload-investigation/`. Browser tooling must wait for the explicit ready state or calculator controls, not only the document load event, because dynamic startup can continue afterward.

These startup changes do not alter financial rules. They are included with the interactive-calculator feature; merging and deployment are handled separately. If the loading screen remains indefinitely rather than reaching ready or error, capture the browser console/network failure on the affected browser; the local tests do not establish its cause.
