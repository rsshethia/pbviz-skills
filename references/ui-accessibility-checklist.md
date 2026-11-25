# UI accessibility checklist and audit rubric

Use this as a pass/fail review for any visual's UI, whether you are building one or reviewing someone else's. Power BI provides some accessibility automatically; the visual author must supply the rest.

## Baseline provided by Power BI

- **Esc** moves focus from inside the visual back to the visual container.
- **Tab** walks tabbable elements inside the visual, then leaves it.
- Adding `supportsKeyboardFocus: true` (API 2.1.0+, not for image visuals) adds: **Enter** on the container enters the visual; **Tab** cycles inside until **Esc**.

You still must make elements focusable and labeled (`tabindex="0"`, `role`, `aria-label`, `<title>`/`<desc>` in SVG).

## Checklist

### Color and contrast

- [ ] Text contrast ≥ **4.5:1** (normal) / ≥ **3:1** (large text and UI graphics) — WCAG 2.1 AA.
- [ ] Meaning is never encoded by color alone (add shape, label, pattern, or icon).
- [ ] Color-blind safe: no red/green-only distinctions; verified with a simulator.
- [ ] Colors come from `host.colorPalette`; high-contrast mode uses only foreground/background/foreground-selected/hyperlink.

### Keyboard and focus

- [ ] Every interactive element is reachable by Tab and has a visible focus indicator.
- [ ] Enter/Space activates; Esc exits; no keyboard traps.
- [ ] Focus order follows visual reading order (left→right, top→bottom).
- [ ] After Enter into the visual, first element is focused programmatically if needed.
- [ ] Data points can be selected and inspected without a mouse where feasible.

### Semantics for assistive technology

- [ ] SVG has an accessible name (`role="img"` + `aria-label`, or `<title>`/`<desc>`).
- [ ] Interactive marks have meaningful labels including value and category.
- [ ] Decorative elements are hidden (`aria-hidden="true"`).
- [ ] Live regions are used sparingly for state changes that matter (e.g. "selection changed").
- [ ] Alt text / accessible description is available for the visual's purpose.

### Text and layout

- [ ] Labels do not overlap or truncate without a tooltip revealing the full value.
- [ ] Type scale is small and consistent; minimum readable size (≈12px) respected.
- [ ] Layout works at small tile sizes and in Focus mode, portrait and landscape.
- [ ] Text expansion for long translations does not break layout (test with German/Russian/Arabic).
- [ ] RTL languages: read `host.locale`, mirror directional layout if you support RTL locales.

### Motion and states

- [ ] Animation respects `prefers-reduced-motion` (disable or shorten transitions).
- [ ] No autoplay video (also a publishing guideline).
- [ ] Hover, focus, active, selected, disabled, and empty states all look distinct.
- [ ] Loading/rendering state is reported through the Rendering Events API.
- [ ] Empty data shows a helpful message, not a blank box (use `supportsLandingPage` / `supportsEmptyDataView` where appropriate).

### Touch and mobile

- [ ] Mouse handlers have touch equivalents (see [ui-responsive-and-performance.md](ui-responsive-and-performance.md)).
- [ ] Touch targets are large enough; no interaction requires hover.
- [ ] Context menu is reachable by long-press.

### Safety and certification overlap

- [ ] User data is written with `text()`/`textContent`, never `innerHTML`/`d3.html()`.
- [ ] No external fonts, images, or scripts.
- [ ] No console errors or unhandled exceptions for any input.

## Audit rubric (repeatable review)

Run this in order and record pass/fail with a one-line note:

1. **Visuals-first pass** — open the visual at normal size, small size, and Focus mode. Screenshot each.
2. **Theme pass** — switch report theme; confirm colors/fonts follow. Switch high-contrast; confirm the four-color rule.
3. **Keyboard pass** — unplug the mouse. Tab through, Enter/Space, Esc. Confirm visible focus and no trap.
4. **Screen-reader pass** — enable Narrator/NVDA; confirm the visual and marks are announced meaningfully.
5. **Contrast pass** — sample text/graphic colors, compute ratios; fix failures.
6. **Data pass** — empty, single value, many values, nulls, long labels, long translated labels.
7. **Touch pass** — test touch equivalents and long-press context menu.
8. **Motion pass** — enable reduced motion; confirm animation stops.
9. **Console pass** — no errors/warnings; run `pbiviz package --certification-audit`.
10. **Report-compare pass** — put a native Power BI visual next to yours; compare tooltip, selection halo, context menu, and empty state.

Fix order: blockers (keyboard trap, unreadable contrast, console errors) → theme/high-contrast → states/labels → polish.

Sources: [Keyboard navigation](https://learn.microsoft.com/en-us/power-bi/developer/visuals/supportskeyboardfocus-feature), [High contrast support](https://learn.microsoft.com/en-us/power-bi/developer/visuals/high-contrast-support), [Mobile development](https://learn.microsoft.com/en-us/power-bi/developer/visuals/mobile-development), [Landing page](https://learn.microsoft.com/en-us/power-bi/developer/visuals/landing-page), [Rendering events](https://learn.microsoft.com/en-us/power-bi/developer/visuals/event-service), [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/).
