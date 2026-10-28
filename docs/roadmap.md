# Development roadmap

The foundation is committed on `main`. The landing page, navigation, calculation engine, and interactive calculator are merged into `develop`. Phase 4 is implemented on `feat/projection-table-chart`, based on that merged baseline: all 30 years, all source financial rows, and a branded Chart.js cash-flow/equity graph and a same-page View results flow. Submission-wide cross-browser QA remains pending. The owner has already deployed `main` (production) and `develop` (preview) on Vercel. The Phase 4 feature branch is authorized for commit/push; its PR and merge into `develop` remain manual. Vercel skips builds for other branches. See [deployment workflow](deployment.md).

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

## Phase 5: contact flow and quality assurance

- Name, email, phone, property address, and message fields.
- Browser validation and clear demo-only confirmation; do not claim a message was sent without a backend.
- Check WCAG AA text contrast, focus states, labels, keyboard behavior, and 16px minimum input/select text.
- Exercise current Chrome, Safari, Firefox, and Edge when available; record unavailable coverage honestly.
- Gate: full required-feature checklist, all financial tests, phone and desktop visual review.

## Phase 6: submission and optional enhancements

- Final code/math walkthrough, AI disclosure, run instructions, and known limitations.
- Existing Vercel hosting uses `main` for production and `develop` for preview. After manual PR merges, verify the exact deployment commit and hosted behavior before submission; do not treat a feature push as a deployment.
- Only after required features pass: print/PDF styling, shareable inputs, deal summary in the contact flow, or dark mode.
- Use focused commits per completed concern, not artificial history or backdated commits.
