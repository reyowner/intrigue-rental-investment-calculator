# Feature-based application structure

## Stack and entry points

This is a static site built with plain HTML, CSS, and native JavaScript modules. There is no framework, package manifest, bundler, backend, or build step. Serve the repository root over HTTP, then load `index.html`.

- `index.html` owns document metadata, font loading, the stylesheet/module entry points, skip link, and loading/no-JavaScript fallback.
- `src/bootstrap.js` imports the application inside an error boundary, updates loading/ready/error state, and restores the startup screen if initialization fails after partial rendering.
- `src/main.js` starts the application and honors initial section hashes.
- `src/pages/homepage.js` composes shared chrome and feature sections, initializes behavior, and manages focus after native anchor navigation.

## Ownership

```text
src/
  components/
    site-header/         Shared navigation markup, styling, and mobile behavior
    site-footer/         Shared footer markup and styling
    ui/icon.js           Small shared decorative line-icon set
  features/
    homepage/
      constants/content.js
      sections/
        hero/            Hero copy, actions, property image
        how-it-works/    Three-step explanation
        calculator-intro/ Calculator section wrapper, composes the live calculator
        contact/         Contact markup, styles, local validation
    calculator/
      engine.js          Public pure calculation entry, no DOM or side effects
      calculator-controller.js  Native form events, validation, and live result updates
      projection-controller.js Stable table updates and results reveal
      projection-chart-controller.js Lazy Chart.js lifecycle and native controls
      services/          Pinned local chart-library loading
      constants/         Numeric defaults, input helpers, source projection-row mapping
      utils/             Financial engine functions plus input/presentation adapters
      components/        Form, summaries, complete table, Chart.js card and styles
  pages/homepage.js
  styles/
    tokens.css           Exact assessment brand tokens and shared spacing
    global.css           CSS imports, resets, shared primitives, accessibility
  main.js
```

Keep feature-local components, constants, utilities, services, and types inside that feature as they become necessary. Do not add empty folders solely to match a taxonomy. Shared UI goes in `src/components/` only when genuinely reusable across features. Plain JavaScript can use JSDoc for future types without adding a TypeScript compiler.

Each section owns its markup and CSS. Page composition must not absorb section-specific content or financial business logic. Use native controls before inventing shared abstractions.

## Rendering and behavior

Small functions return developer-authored HTML strings, composed once at startup. No user input is interpolated into HTML. Contact error and success messages are assigned with `textContent`. This is a small static module composition pattern, not a new component framework.

CSS files are imported from `src/styles/global.css` and stay next to the section/component they style. Shared classes such as `.button` and shared tokens belong in global styles. The page itself has no fixed maximum width; text blocks and form internals remain readable.

The application shell places the header and main in the same CSS grid row, with the footer below. This lets the hero continue behind the transparent floating header instead of exposing a separate white band. The header is aligned to the start of that row so sticky positioning remains effective. Hero top padding uses the navigation offset to keep content below the bar. DOM reading and keyboard order remain header, main, footer.

Navigation uses app-local fragment anchors, preserving direct links, reloads, and native browser history. `site-header/navigation.js` owns link labels and destinations. The floating dark-teal bar stays sticky, with scroll-padding clearance for section targets. The mobile navigation is a native modal `dialog`, with background inertness, scroll locking, focus containment, Escape dismissal, and focus restoration. Resizing to desktop closes it without leaving background scrolling locked.

## Scope and future seams

The calculator feature exposes `calculateInvestment()` from `engine.js`. Financial defaults live in `constants/default-inputs.js`; pure calculation and validation functions live in `utils/`. Financial tests live in `tests/calculator/` and run without loading the page. The engine has no DOM, network, storage, or formatting dependencies. See [the API](calculator-engine.md).

The page composes `calculator()` and initializes `initializeCalculator(root)` after mounting. `constants/input-fields.js` defines every control and helper, obtaining numeric defaults from the engine's frozen defaults. `utils/input-values.js` preserves raw form values for engine validation; `utils/result-view.js` formats successful models and explicit N/A states. The controller updates text and error attributes without replacing focused inputs, so caret, disclosure state, and entered values survive recalculation. The unused preview-only components and formatted defaults have been removed.

The calculator passes the same successful or invalid result to `projection-controller.js`. Source-mapped table rows and a Chart.js metric-switching card read existing annual values; no financial formulas are duplicated. View results reveals the same-page report while headlines stay live. The pinned local bundle loads only on reveal. Table/chart controls remain stable during edits; invalid models clear displays and destroy the chart. Retry is isolated from app startup, and no framework/build step was introduced. See [long-term result ownership and verification](projection-results.md).

The contact form is local-only. It validates but never sends or persists details. Adding a real submission service is a separately scoped change requiring truthful status copy and explicit authorization.

The owner has configured Vercel hosting for `main` (production) and `develop` (preview), with other branch builds skipped. See [deployment workflow](deployment.md). This feature does not change hosting settings or add analytics, trackers, cookies, theme switching, or optional calculator bonuses.
