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

- **GitHub-first, feature-based structure:** I started with the repository and project foundation before adding features. I organized feature-specific code under `src/features/` and shared UI under `src/components/` so I can quickly find a section, understand its responsibilities and make manual changes without searching through unrelated code.
- **Phased development:** I split the work into the foundation and page layout, calculation engine, interactive inputs, projection table/charts, and optional enhancements. This gave me smaller checkpoints to personally review the output, request refinements and verify behavior before moving to the next phase.
- **Logo sourcing:** the assessment did not provide a downloadable Intrigue logo file, so I searched online for the existing logo and used it for this assessment rather than inventing a new brand identity. I did not design the logo or claim ownership of it; Intrigue's branding remains the property of its respective owners.
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

## AI assistance

I used **Hermes Agent by Nous Research** as my main AI coding tool, running **GPT-6.1 Sol** (`gpt-6.1-sol`) through the **OpenAI Codex provider**. I used it to help plan the phases and file structure, draft and refine implementation code, investigate calculation rules and edge cases, write and run automated/browser checks, and update documentation.

I set the requirements and made the final decisions on scope, organization and UI behavior, reviewing the output in stages and requesting changes where needed. AI-assisted implementation and reviews do not replace my responsibility for every submitted line of code. I am responsible for reviewing and understanding the implementation and being prepared to walk through the code and explain the financial calculations. The linked engine and calculation notes document the formulas, assumptions and verification evidence.

Detailed [technical decisions](docs/technical-overview.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md) remain in `docs/`. Supplied and externally sourced brand assets retain their owners' rights; no application-wide open-source license is assigned.
