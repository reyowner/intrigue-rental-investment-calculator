# Rental Property Investment Calculator

An assessment project for Intrigue Real Estate & Property Management, intended to help Indianapolis-area rental property investors evaluate a deal without an email gate.

## Status

**Phase 0: foundation only.** This first commit contains a working static placeholder, brand tokens, supplied logo assets, and development documentation. The landing page, calculator, results, charts, and contact form have not been implemented. No financial results are claimed as verified.

## Stack

Plain HTML, CSS, and JavaScript. No framework, package installation, build step, backend, or database. Google Fonts supplies Raleway, with a local sans-serif fallback when unavailable.

## Run locally

Open `index.html` directly in a browser. Alternatively, from the repository directory, run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`. Python is only a convenience for local serving, not a runtime or build dependency.

## Structure

```text
index.html                 Minimal static entry page
assets/css/styles.css      Brand tokens and scaffold styles
assets/js/main.js          Reserved application entry point
assets/images/             Supplied Intrigue brand assets
assets/images/README.md    Asset provenance and usage cautions
docs/roadmap.md             Development phases and acceptance gates
docs/calculation-notes.md   Source mapping, overrides, and check figures
```

## Source precedence

The assessment brief is the authority for calculation rules and check figures. The workbook `Rental Analysis - Template With Example Numbers.xlsx` supplies input defaults and projection structure, but contains known errors. Where they disagree, the brief wins. See [calculation notes](docs/calculation-notes.md).

The workbook and original assessment attachment are intentionally not committed. Supplied logos remain the property of their respective owner; inclusion does not grant a redistribution license. No open-source license is assigned by this scaffold.

## Development and verification

See [the roadmap](docs/roadmap.md). Keep calculation logic separate from DOM rendering, use full precision internally, and round only for display. Future calculation tests must run without a frontend framework or production build step.

For the foundation, verify local asset loading, JavaScript syntax, phone-width overflow, keyboard skip navigation, and an honest unimplemented state. Later cross-browser testing and financial verification remain pending.

## AI-use disclosure

This foundation was prepared with OpenAI's GPT-6.1 model through Hermes Agent by Nous Research. AI assistance was used to review the supplied requirements and workbook structure, scaffold static files, write documentation, and perform repository and smoke checks. AI assistance does not replace developer review. The submitting developer remains responsible for understanding, validating, and explaining every submitted line and the eventual calculation logic.
