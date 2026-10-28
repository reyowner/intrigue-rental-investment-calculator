# Floating navigation background correction

## Reference inspection

The official homepage at https://www.intriguepm.com/ was inspected in light and dark themes in an isolated test browser. Its outer header has a transparent background. The navigation pill remains teal; the surrounding color comes from the page surface, not a white header panel. The inspected light body surface is rgb(242,243,244), and the dark surface is rgb(13,27,33). These are live-site observations, not a new theme implementation for this assessment.

## Root cause and fix

Our dark-teal bar was already correctly colored. The white region came from its separate normal-flow area above a dark hero, exposing the white body background around the bar.

The app shell now overlaps header and main in the first CSS grid row. The header stays sticky and transparent, and the hero reaches the very top behind it. Hero top padding keeps text and imagery safely below the navigation. The footer remains below main. As the visitor scrolls, the current section is visible around the pill rather than being covered by a separate header strip.

No theme toggle, global dark/light theme, reference-site links, color changes to the approved logo, or unrelated page redesign was introduced. The brand palette and dark-teal navigation surface are retained.

## Verification

- 72 named browser assertions passed, saved in ignored `work/qa/navigation-background/results.json`.
- Checked 375, 390, 768, 895, 896, 1024, 1440, and 1920 CSS-pixel widths.
- Verified hero starts at the top, corner hit testing lands on the hero rather than a white header region, outer header is transparent, content clears the navigation, no page overflow, and sticky position remains correct.
- Verified footer placement, mobile modal coverage, scroll restoration, local-anchor heading focus/clearance, existing two-part logo treatment, and absence of a theme control.
- Fixed mobile CTA visibility specificity so the shared `.button` rule cannot reveal the desktop-only action on narrow screens. Checked it on both sides of the breakpoint.
- Added a dependency-free source regression for the shared header/hero backdrop.
- Compared native screenshots of the official light/dark treatments and the local desktop/mobile result.

The available Chromium-based browser was tested. Cross-browser and full accessibility conformance are not claimed. No commit, push, or deployment is part of this correction.
