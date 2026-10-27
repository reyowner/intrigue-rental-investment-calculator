# Feature-based application structure

## Stack and entry points

This is a static site built with plain HTML, CSS, and native JavaScript modules. There is no framework, package manifest, bundler, backend, or build step. Serve the repository root over HTTP, then load `index.html`.

- `index.html` owns document metadata, font loading, the stylesheet/module entry points, skip link, and loading/no-JavaScript fallback.
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
        calculator-intro/ Calculator section wrapper, composes preview feature
        contact/         Contact markup, styles, local validation
    calculator/
      constants/example-deal.js
      components/        Presentation-only preview; no engine yet
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

Navigation uses real fragment anchors, preserving direct links, reloads, and native browser history. Focus transfers after the native anchor action. Mobile links are removed from keyboard access by `display: none` while collapsed; Escape closes the menu and restores focus.

## Scope and future seams

The calculator feature currently owns static example inputs and an explicitly noninteractive preview. The next phase can introduce `calculator/utils/` for pure financial functions and tests, then components for real inputs, results, tables, and charts. Do not turn formatted preview strings into the math engine's numeric source of truth: use the cell mapping in `docs/calculation-notes.md` for numeric defaults and rate conversion.

The contact form is local-only. It validates but never sends or persists details. Adding a real submission service is a separately scoped change requiring truthful status copy and explicit authorization.

No hosting, analytics, trackers, cookies, theme switching, or optional calculator bonuses were added.
