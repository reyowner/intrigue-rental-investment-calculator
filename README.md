# Rental Property Investment Calculator

A browser-only investment calculator for Intrigue Real Estate & Property Management. Plain HTML, CSS and JavaScript with locally pinned Chart.js and on-demand PDF libraries; no framework, package installation, build step, database or backend.

## Run locally

Serve the **repository root** over HTTP, not `file://`:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. Any static HTTP server works. Run checks with Node.js (tested with 24.22.1):

```sh
node --test tests/calculator/*.test.mjs tests/*.test.mjs tests/check-static.mjs
```

## Decisions

- **One engine:** all 40 inputs, headline/financing figures, charts and the full 30-year table use the same model. Calculations remain live; View results reveals the detailed report.
- **Source authority:** the assessment brief overrides known workbook errors. Defaults come from Intrigue's duplex example; the original workbook is not committed. See [calculation notes](docs/calculation-notes.md).
- **Light/dark mode:** follows the OS until explicitly chosen. Only the theme preference is stored automatically. Brand colors, Raleway and 8px action corners remain.
- **Complete PDF:** downloads `intrigue-rental-investment-report-YYYY-MM-DD.pdf` directly, with all inputs, financing/headline results, both graphs and every projection year. Local jsPDF/AutoTable and embedded Raleway load only on export; no popup or print dialog is involved.
- **Share links:** explicitly encode all assumptions in a versioned URL fragment. Anyone with the link can read them; contact details are excluded. Edits are not automatically saved into previous links.
- **Demo contact only:** validates locally and never sends messages. An optional live deal review preserves the visitor's message. A submission backend is deliberately out of scope.

## Assumptions and limits

Amounts are USD. Input rates use percentage points (`6.5`); returned rates use fractions (`0.065`). Internal precision is retained until display. Invalid inputs clear stale estimates; unavailable returns show N/A with explanations. Projections are not guarantees or a lender's cent-rounded ledger.

Google Fonts supplies Raleway, with a system fallback. Chart.js, jsPDF and AutoTable retain their MIT notices; bundled PDF fonts retain the OFL license. Verification uses local Chromium, not physical Safari/iPhone, Firefox/Edge-specific or complete screen-reader certification. See [enhancement verification](docs/enhancements.md) and [engine details](docs/calculator-engine.md).

## Deployment and next steps

Vercel uses `main` for production and `develop` for preview, skipping feature-branch builds. Feature PRs target `develop`; production promotion is separate. See [deployment workflow](docs/deployment.md).

With more time: physical-device/cross-browser and screen-reader checks, browser/PDF regressions in CI, offline font assets, and further print navigation/pagination refinements.

Detailed [technical decisions](docs/technical-overview.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md) remain in `docs/`. AI assistance through Hermes Agent by Nous Research supported implementation and verification; the submitting developer remains responsible for reviewing and explaining the work. Supplied brand assets retain their owners' rights; no application-wide open-source license is assigned.
