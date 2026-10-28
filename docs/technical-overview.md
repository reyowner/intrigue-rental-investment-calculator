# Technical overview and calculation decisions

An assessment project for Intrigue Real Estate & Property Management, intended to help Indianapolis-area rental property investors evaluate a deal without an email gate.

This guide retains the detailed core-calculator background. For the current feature scope, see [calculator enhancements](enhancements.md); for quick setup, see [the README](../README.md). Historical test totals below belong to the core projection phase.

## Core projection phase

**Phase 4: complete long-term results.** The live calculator includes all 40 editable inputs, financing totals, five headline results, a complete 30-year projection table, and a branded Chart.js graph with cash-flow/equity controls. View results reveals the detailed same-page destination while calculations remain live. The table maps all 49 source financial rows and adds two sale breakdowns. Invalid inputs clear stale results; undefined returns show N/A with an explanation. No backend has been added. The owner has deployed `main` to Vercel production and `develop` to preview; this feature reaches preview only after its PR is merged into `develop`.

## Stack

Plain HTML, CSS, and JavaScript. Chart.js 4.6.1 is pinned locally and loaded only when detailed results are requested. No framework, package installation, build step, backend, or database is required. Google Fonts supplies Raleway, with a local sans-serif fallback when unavailable.

## Run locally

From the repository directory, serve the files over HTTP:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`. Python is only a convenience for local serving, not a runtime or build dependency. Any static HTTP server works. Native JavaScript modules require HTTP; opening `index.html` directly with `file://` will show the fallback instead of the application. Vercel serves the repository root, not just `src/`; no application build command is required. See [deployment and branch workflow](deployment.md).

Slower reloads show a branded, animated loading screen while native modules download. A 180ms reveal grace period avoids flashing it on fast cached refreshes, without delaying the ready page. Reduced-motion mode remains static. Actual startup failures show a retry action instead of misleading HTTP instructions. See [startup and reload verification](startup-and-reloads.md).

## Branches and deployment

| Branch | Purpose | Vercel behavior |
|---|---|---|
| `main` | Production-ready releases | Production deployment |
| `develop` | Integration and developer review | Preview deployment |
| Feature/fix branches | Work submitted through PRs into `develop` | Builds skipped by the configured Ignored Build Step |

Develop on a feature branch, open a PR into `develop`, and verify the updated preview after merging. Promote reviewed changes from `develop` to `main` through a separate PR for production. PR creation and merging are manual; pushing a feature branch does not publish it to either environment.

The existing Vercel configuration and owner-provided dashboard references are documented in [deployment and branch workflow](deployment.md). These dashboard references are not the public app URLs. This change documents the existing setup; it does not modify Vercel settings.

## Structure

```text
index.html                     Document shell and no-JavaScript fallback
src/bootstrap.js               Loading/error boundary for the module graph
src/main.js                    Native-module application composition entry
src/pages/homepage.js           Page composition and section-link focus
src/components/                Shared header, footer, and line icons
src/styles/                    Global styles and brand tokens
src/features/homepage/          Landing-page sections and copy constants
src/features/calculator/        Pure engine, input definitions, controller, and live results
assets/images/                 Local brand assets and property photo
assets/vendor/chartjs/          Pinned chart bundle, MIT notices and integrity provenance
tests/check-static.mjs          Dependency-free source checks
tests/calculator/              Financial regression tests and independent fixtures
docs/architecture.md           Feature ownership and extension rules
docs/verification.md           Checks performed and coverage limits
docs/roadmap.md                Development phases
docs/deployment.md             Vercel environments, branch filter, and release workflow
docs/calculation-notes.md       Source mapping, overrides, check figures
docs/calculator-engine.md       Engine API, error policy, and verification
docs/interactive-calculator.md  UI behavior, input coverage, and browser verification
docs/projection-results.md      Complete table, Chart.js, results flow, and verification
```

## Source precedence

The assessment brief is the authority for calculation rules and check figures. The workbook `Rental Analysis - Template With Example Numbers.xlsx` supplies input defaults and projection structure, but contains known errors. Where they disagree, the brief wins. See [calculation notes](calculation-notes.md).

The workbook and original assessment attachment are intentionally not committed. Supplied logos remain the property of their respective owner; inclusion does not grant a redistribution license. No open-source license is assigned to the application by this scaffold. Third-party Chart.js and its bundled color utility retain their MIT licenses and notices under `assets/vendor/chartjs/`.

## How the calculator engine works

The engine is a pure calculation module, separate from page rendering. The same inputs produce the same results, without calling a server or changing stored data.

1. **Validate the deal.** Check amounts, percentage ranges, and loan term. Omitted inputs use the example defaults; an explicitly blank or invalid field produces an error rather than a misleading zero.
2. **Calculate the cash needed.** Loan amount is purchase price less down payment. Initial cash is down payment plus buying closing costs and renovation costs.
3. **Build the mortgage schedule.** Calculate principal and interest month by month, including 0% interest. Stop payments after payoff, even when the projection continues.
4. **Calculate operating performance.** Deduct vacancy from scheduled rent. Calculate management on collected rent and maintenance on gross rent. Subtract operating expenses to get net operating income (NOI), then subtract mortgage payments to get cash flow.
5. **Project 30 years.** Apply each operating growth assumption from Year 2, track property appreciation, loan balance, equity, and capped depreciation, and calculate sale proceeds for each possible sale year.
6. **Calculate returns.** Cap rate uses NOI divided by the property's start-of-year value. Cash-on-cash return uses cash flow divided by initial cash. IRR includes the timing of annual cash flows and sale proceeds, and is unavailable when no unique supported rate can be established.

All calculation amounts retain full precision; rounding belongs to the display layer. Input percentages use percentage points (`6.5`), while returned rates use fractions (`0.065`).

For the unchanged example duplex, the engine produces:

| Result | Verified display |
|---|---:|
| Loan amount | $202,500 |
| Monthly principal and interest | $1,279.94 |
| Initial cash required | $70,200 |
| Year 1 NOI | $19,188 |
| Year 1 monthly cash flow | $319 |
| Year 1 cap rate | 7.11% |
| Year 1 cash-on-cash return | 5.45% |
| Year 5 equity | $123,442 |

See the [calculation walkthrough and API](calculator-engine.md) for formulas, result structure, error handling, and IRR implementation. The [source notes](calculation-notes.md) explain every required spreadsheet correction and list all assessment check figures.

## Why the results are verifiable

Confidence comes from inspectable rules and repeatable checks, not from an assertion that the calculator is infallible:

- **An explicit source hierarchy.** The assessment's calculation rules win over known spreadsheet errors. Examples include management on collected rent, growing insurance/HOA, and cap rate based on start-of-year value. The original workbook was preserved unchanged.
- **All supplied check figures pass.** The committed suite verifies the assessment's initial, Year 1, Year 5, Year 10, and Year 30 figures, not just the headline values above.
- **Independent comparisons.** Tests compare nonzero expense lines against a separately calculated 50-digit Python Decimal fixture and conventional IRRs against an independent bisection oracle. Accounting identities reconcile cash flow, equity, and mortgage balances.
- **Difficult cases are tested.** Coverage includes blank/negative inputs, zero interest, cash purchases, short loans, declining assumptions, depreciation limits, zero denominators, and repeated or multiple IRR roots. Undefined returns remain explicitly unavailable instead of being presented as 0%.
- **Verification goes beyond Node.** The current suite passes 138 automated tests. Browser verification includes 33 projection checks, 18 results-flow checks, 16 real Chart.js checks, seven tested widths, and native keyboard/accessibility checks. The interactive calculator passes 161 functional browser checks, with additional responsive, keyboard, contrast, and privacy checks. The engine phase also recorded 26 native-module checks in the available Chromium-based browser. A separate fresh-context AI-assisted review also challenged known-factor and extreme-scaling IRR cases; it reported no reproducible defects within its coverage.

The dependency-free Node suite is the repeatable baseline. Browser checks and AI-assisted review are supplementary evidence, not an independent professional audit or a mathematical proof. The projections depend on the visitor's assumptions; they do not guarantee rents, appreciation, financing terms, or investment outcomes. Currency calculations use JavaScript floating-point arithmetic, not a lender's cent-rounded servicing ledger. Cross-browser and physical-device coverage remains limited as documented below.

## Development and verification

See [the roadmap](roadmap.md). Calculation logic is separate from DOM rendering, uses full precision internally, and leaves rounding to the display layer. See the [engine API](calculator-engine.md) to call it independently of the page.

Run the complete dependency-free test suite:

```sh
node --test tests/calculator/*.test.mjs tests/startup.test.mjs tests/check-static.mjs
```

Tests were executed with Node.js 24.22.1. Node is a test-only tool, not a browser runtime or build dependency. See [verification notes](verification.md) for browser checks and coverage limits. Safari, Firefox, Edge-specific, and physical-device verification remain pending.

The contact form validates name, email, optional phone, and message in the browser. It does not send, persist, or log contact details. A successful check explicitly says that nothing was sent. The separate main-website link is the real contact route.

The live calculator uses the engine as its sole source of financial calculations. All seven utilities and ten miscellaneous lines are included in Advanced assumptions, along with reserves, growth rates, building ratio, appreciation, and buying/selling costs. Some assumptions affect later projection rows rather than the five current headlines. See [the UI verification record](interactive-calculator.md) and [browser runner instructions](../tests/browser/README.md). The full table and Chart.js graph expose that annual model, including all individual expenses and supplementary returns. View results validates and reveals those details without delaying calculation. Edit property numbers preserves the deal, and chart loading failure leaves the full table available. See [long-term results](projection-results.md).

## AI-use disclosure

The foundation, landing page, calculation engine, interactive calculator, and long-term results were prepared with OpenAI's GPT-6.1 model through Hermes Agent by Nous Research. AI assistance was used for requirements and workbook review, brand research, implementation, regression tests, independent calculation fixtures, adversarial code review, documentation, and browser checks. AI assistance does not replace developer review. The submitting developer remains responsible for understanding, validating, and explaining every submitted line and the calculation logic.
