# Development roadmap

The core calculator, full 30-year projection and Chart.js results flow are implemented. Optional enhancements are implemented locally on `feat/calculator-enhancements`: site-wide themes, the supplied map-pin favicon, complete PDF reports, shareable deals and opt-in contact summaries. The owner manages Vercel `main` production and `develop` preview; feature builds are skipped. This phase does not commit, push, merge or change hosting settings. See [enhancement behavior](enhancements.md) and [deployment workflow](deployment.md).

## Phase 0: repository foundation

- Plain HTML entry page, CSS brand tokens, and reserved JavaScript entry point.
- Include supplied logo files unchanged with provenance notes.
- README, source notes, roadmap, editor settings, and local-file exclusions.
- Verify the placeholder at 375px and desktop widths, assets, and JavaScript syntax.
- Push exactly one initial commit to a private GitHub repository on `main`.

## Phase 1: branded landing-page structure

- Inspect the official website for brand context before choosing the final design.
- Build header, plain-language hero, how it works, calculator/results regions, contact section, and footer.
- Apply Raleway, approved colors, 8px button corners, and simple line icons only.
- Full-width page; constrain paragraphs and form content, not the page itself.
- No email gate, unsupported promises, prohibited company names, or em dashes in page copy.
- Gate: responsive visual review at 375px and desktop; semantic headings and keyboard navigation.

## Phase 2: calculation engine and regression tests

- Map every workbook input and projection row; apply brief overrides.
- Implement pure calculation functions independently of the DOM.
- Fixed-rate monthly amortization, annual growth starting Year 2, sale proceeds, capped depreciation, and annual-sale IRR.
- Test every supplied check figure, zero interest, early payoff, zero cash/property value, blank/negative inputs, and non-finite values.
- Return an explicit unavailable state for undefined ratios or unsolvable/ambiguous IRR, not a fabricated zero.
- Gate: automated check-figure and edge-case tests; document policy choices. See [the engine API and verification record](calculator-engine.md).

## Phase 3: interactive calculator and headline results

- Ten deal-specific inputs first, then collapsible advanced assumptions.
- All workbook defaults, seven utilities, ten miscellaneous lines, and new 3% insurance/HOA growth fields.
- Visible labels, short explanations, owner-paid utility guidance, and read-only derived values.
- Live updates, graceful field validation, five required headline results.
- Gate: exercise every input group and error state without stale or misleading results. See [interactive calculator verification](interactive-calculator.md).

## Phase 4: required long-term results, implemented

- Complete 30-year projection including individual expense lines and source-mapped supplementary rows.
- Phone-usable horizontal table with clear row/year orientation and keyboard access.
- At least one real engine-backed chart, plus equivalent accessible tabular data. The table and chart are mandatory assessment requirements, not optional bonuses.
- Gate: table/chart/headline agreement, readable mobile scrolling, no whole-page horizontal overflow. See [the implementation and verification record](projection-results.md).

## Phase 5: demo contact and quality assurance

- Name, email, phone, property address, and message fields.
- Browser validation and clear demo-only confirmation are sufficient for this assessment. No working submission backend or real message delivery is required or planned.
- Optional current-deal inclusion is a read-only browser review, not a sent attachment; preserve the visitor message.
- Check WCAG AA text contrast, focus states, labels, keyboard behavior, and 16px minimum input/select text.
- Exercise current Chrome, Safari, Firefox, and Edge when available; record unavailable coverage honestly.
- Gate: full required-feature checklist, all financial tests, phone and desktop visual review.

## Phase 6: submission and optional enhancements

- Final code/math walkthrough, AI disclosure, run instructions, and known limitations.
- Existing Vercel hosting uses `main` for production and `develop` for preview. After manual PR merges, verify the exact deployment commit and hosted behavior before submission; do not treat a feature push as a deployment.
- Implemented optional enhancements: branded direct PDF download with all inputs/results and both graphs, versioned share links, opt-in deal review in the demo contact form, and persistent light/dark themes.
- Remaining improvements: physical-device/cross-browser and screen-reader testing, CI browser/PDF checks, offline font hosting and more print navigation. Real contact delivery remains deliberately outside the demo scope.
- Use focused commits per completed concern, not artificial history or backdated commits.
