# Rental Property Investment Calculator

An assessment project for Intrigue Real Estate & Property Management, intended to help Indianapolis-area rental property investors evaluate a deal without an email gate.

## Status

**Phase 1: landing page.** Responsive branded landing page, mobile navigation, how-it-works section, a clearly labeled calculator preview, and a browser-only contact form. The calculation engine, live inputs/results, projection table, and chart are not implemented yet. No financial results are claimed as verified.

## Stack

Plain HTML, CSS, and JavaScript. No framework, package installation, build step, backend, or database. Google Fonts supplies Raleway, with a local sans-serif fallback when unavailable.

## Run locally

From the repository directory, serve the files over HTTP:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`. Python is only a convenience for local serving, not a runtime or build dependency. Any static HTTP server works. Native JavaScript modules require HTTP; opening `index.html` directly with `file://` will show the fallback instead of the application. Deploy the repository root, not just `src/`, when hosting is authorized.

## Structure

```text
index.html                     Document shell and no-JavaScript fallback
src/main.js                    Native-module application entry
src/pages/homepage.js           Page composition and section-link focus
src/components/                Shared header, footer, and line icons
src/styles/                    Global styles and brand tokens
src/features/homepage/          Landing-page sections and copy constants
src/features/calculator/        Static preview and example input values
assets/images/                 Local brand assets and property photo
tests/check-static.mjs          Dependency-free source checks
docs/architecture.md           Feature ownership and extension rules
docs/verification.md           Checks performed and coverage limits
docs/roadmap.md                Development phases
docs/calculation-notes.md       Source mapping, overrides, check figures
```

## Source precedence

The assessment brief is the authority for calculation rules and check figures. The workbook `Rental Analysis - Template With Example Numbers.xlsx` supplies input defaults and projection structure, but contains known errors. Where they disagree, the brief wins. See [calculation notes](docs/calculation-notes.md).

The workbook and original assessment attachment are intentionally not committed. Supplied logos remain the property of their respective owner; inclusion does not grant a redistribution license. No open-source license is assigned by this scaffold.

## Development and verification

See [the roadmap](docs/roadmap.md). Keep calculation logic separate from DOM rendering, use full precision internally, and round only for display. Future calculation tests must run without a frontend framework or production build step.

Run `node --test tests/check-static.mjs` for dependency-free source checks. See [verification notes](docs/verification.md) for browser interaction checks and limitations. Full Safari, Firefox, and Edge coverage and all financial verification remain pending.

The contact form validates name, email, optional phone, and message in the browser. It does not send, persist, or log contact details. A successful check explicitly says that nothing was sent. The separate main-website link is the real contact route.

The calculator preview is presentation-only, with no editable controls, calculated results, fake chart, or implied working financial engine. Read-only example values come from the supplied duplex.

## AI-use disclosure

The foundation and landing page were prepared with OpenAI's GPT-6.1 model through Hermes Agent by Nous Research. AI assistance was used to review the supplied requirements, workbook structure, and official brand reference, implement the static page and local interactions, write documentation, and perform source and browser checks. AI assistance does not replace developer review. The submitting developer remains responsible for understanding, validating, and explaining every submitted line and the eventual calculation logic.
