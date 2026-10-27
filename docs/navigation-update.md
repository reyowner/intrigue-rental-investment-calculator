# Navigation update

## Approved scope

Adapt only the UI/UX of the supplied `intrigue-navigation-component` reference: floating sticky dark-teal bar, rounded outer container, white lettering with the original lime trailing mark, lime primary action, and a full-screen mobile menu. Do not import the brokerage site's Home/About/Services/Resources/rental/property-search navigation. No theme toggle, financial logic, deployment, commit, or push is included.

The app keeps How it works (`#how-it-works`), The calculator (`#calculator`), and Let's talk (`#contact`). `src/components/site-header/navigation.js` is the single source of their labels and destinations.

## Implementation

- Component markup, modal lifecycle, and mobile behavior stay in `src/components/site-header/`.
- The outer navigation container is rounded like the reference. Actual action buttons retain 8px corners.
- The final logo combines the latest supplied PNG without its mark and the original lime path from the supplied SVG. Only transparent margins are cropped from the PNG, and only the lettering receives the white CSS filter. The SVG mark is extracted without redrawing or recoloring and stays lime. Both desktop and mobile share this composition.
- The mobile menu uses native `dialog.showModal()` for top-layer presentation and background inertness, plus explicit focus wrapping, Escape/close-button handling, and opener-focus restoration.
- Section links close the menu without stealing focus back from the destination heading. Resizing to desktop closes the modal, restores scrolling, and moves focus to visible navigation.
- Sticky-header scroll clearance prevents section destinations being covered. A stable scrollbar gutter prevents content reflow while background scrolling is locked. The skip link is stacked above the sticky header.
- No unrelated landing-page content or form behavior is changed.

## Verification

- `node --test tests/check-static.mjs`: 10 source tests passed, including two new navigation regressions.
- 75 distinct browser assertions passed. Results are stored in ignored `work/qa/navigation/results.json`.
- Viewports: 375, 390, 768, 895, 896, 1024, 1440, and 1920 CSS pixels, plus a 375 by 320 short-screen menu check.
- Verified no horizontal overflow, sticky positioning, correct breakpoint transitions, app-only destinations, asset loading, independent white PNG lettering and unfiltered lime SVG rendering, and 8px CTA corners.
- Exercised keyboard Enter, modal focus containment, Tab/Shift-Tab wrapping, Escape, close control, preserved page position/drafts, repeated reopen, mobile-to-desktop transitions, and accessible short-screen scrolling.
- Checked mobile and desktop links/CTAs, heading clearance, initial section URLs, existing hero action, existing form validation, unique IDs, and no uncaught runtime errors.
- Reviewed desktop and full-screen mobile screenshots in the native browser image attachment.
- The copied full SVG matches the latest supplied SVG byte-for-byte. The extracted lime path retains the original geometry and fill, and the cropped PNG preserves the source lettering pixels.
- `git diff --check` passed. Changes remain local on `develop`, uncommitted and unpushed.

Coverage remains the available Chromium-based browser. Safari, Firefox, Edge-specific behavior, physical touch devices, and a full assistive-technology audit are not claimed.
