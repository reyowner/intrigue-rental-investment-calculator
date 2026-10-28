# Verification record

## Scope

The Phase 1 landing-page checks below are retained as a historical record. Phase 2 added an independently callable financial engine, recorded in [calculator-engine.md](calculator-engine.md). Phase 3 now replaces the preview with live controls and headline results; see [interactive-calculator.md](interactive-calculator.md) for its current verification. Phase 4 adds the complete rendered projection table and charts; see [projection-results.md](projection-results.md) for current tests, browser evidence, and limits. The owner has since configured Vercel production/preview hosting; the historical checks below are local checks, not verification of the current hosted releases. See [deployment workflow](deployment.md). Real contact delivery remains excluded.

## Automated source checks

Run from the repository root:

```sh
node --test tests/check-static.mjs
```

Eight source checks passed during the original landing-page verification: JavaScript syntax, relative module imports, CSS imports, document assets, template images, brand tokens/radius, copy restrictions, and honest preview/form states. These source checks do not replace browser testing or financial validation.

## Browser checks performed

62 distinct checks passed in the local Chromium-based browser. Results were collected programmatically, with named assertions saved in ignored `work/qa/landing-test-results.json`. Fixed failures were rerun, not left as known passing assumptions.

- Layout at 375, 390, 768, 1024, 1440, and 1920 CSS pixels: no whole-page horizontal overflow, hero fills available width, inputs at least 16px, action corners 8px.
- Both page images and all local CSS/JavaScript/image requests loaded successfully.
- One H1 and one main, unique IDs, visible form labels, valid section links, and no em dashes in visible copy.
- Explicit calculator-preview notice with no fake editable calculator controls or calculated outputs.
- Mobile menu open/close, Escape/focus restoration, keyboard Enter activation, hidden collapsed links, and navigation to sections.
- Native section links retain fragment URLs and transfer focus to headings after the native default action.
- Direct `#contact` load lands at the section after document loading; tested with a fresh document navigation.
- Skip link is first keyboard stop and moves focus to main.
- Reduced-motion preference disables smooth scrolling.
- Blank required fields, whitespace name, malformed email, short message, and invalid optional phone are rejected. The first invalid field receives focus.
- Valid name/email/message and international-style phone produce an honest local confirmation. Optional phone can be empty.
- User input is retained after validation; editing clears stale confirmation.
- Form submission does not call fetch or XHR, add details to the URL, or change localStorage. The implementation does not store details in sessionStorage either.
- No uncaught script errors or unhandled promise rejections observed on an instrumented final document load.

Browser key testing used complete Enter events including the character event, not only raw keydown. Full-width measurements compare against document client width, excluding the scrollbar rather than treating it as a margin.

## Visual inspection

Reviewed native screenshots at phone and desktop sizes, including hero, desktop calculator preview, and phone contact form. Screenshots are in ignored `work/qa/`. Raleway loaded in the inspected browser. Large headings, the primary action, preview notice, and form labels remain readable without clipped horizontal content.

## Contrast spot checks

Calculated sRGB contrast for seven key text/surface pairs. All exceeded 4.5:1: dark teal on lime (5.95), muted text on white (6.12), muted text on the pale surface (5.67), teal on white (8.84), light teal on dark teal (9.28), pale body text on dark teal (9.90), and error red on white (7.17). These are color-pair checks, not a complete WCAG conformance audit or proof of every photographic-overlay pixel.

## Manual repeat checklist

1. Start `python -m http.server 8000 --bind 127.0.0.1`, open the local origin, and inspect mobile/desktop layouts.
2. Tab to Skip to content, press Enter, and verify main receives focus.
3. On a narrow viewport, open navigation with Enter, close with Escape, then follow a section link.
4. Follow Run the numbers and confirm that the destination is clearly a noninteractive preview.
5. Toggle the example assumptions using keyboard and pointer.
6. Submit the contact form empty, fix each error, and submit valid test details. Confirm that nothing was sent and values remain editable.
7. Load the page directly with `#contact` and confirm its location after loading.

## Coverage limits

Tested in the available Chromium-based automation browser. Safari, Firefox, Edge-specific behavior, assistive-technology behavior, physical touch devices, and a complete accessibility audit have not been verified. Financial figures were not part of those original landing-page checks; they are now covered separately by the Phase 2 engine verification. No form was sent and no deployment was attempted.

## Current optional enhancements

Local Chromium checks cover themes, exact restoration of all 40 shared inputs, opt-in demo deal review, direct PDF Blob/download behavior with no popup or print call, and the existing calculator/table/chart regressions. The actual example download is a 19-page native PDF with embedded Raleway, both graphs and all 1,530 expected projection values. Extracted characters stay within page bounds; representative pages were visually inspected. PDF tests use the real pinned jsPDF/AutoTable renderer, not an HTML screenshot or fake file. See [enhancement behavior and coverage](enhancements.md) for commands, privacy and browser limits. This is local verification, not a deployment or professional audit.
