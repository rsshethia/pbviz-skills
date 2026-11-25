# Future-facing, decision-oriented design (short version)

## What I deliberately left out

Trend reports, vendor forecasts, "AI will replace dashboards" claims, and generic design-system advocacy. They age badly and do not change what you write in `visual.ts`. The items below are durable principles plus a few **inferences** clearly marked as such.

## Five signals worth acting on (inference, not prediction)

| Signal | What it means for a custom visual |
| --- | --- |
| From *reporting* to *deciding* | Show variance against a target/baseline, not just the raw value. A KPI without context is decoration. |
| Explanatory and narrative views alongside exploration | Support a clear reading order — title states the finding; tooltip/drill explains it. |
| Conversational / AI-assisted exploration | Keep data accessible through host services and a clean view model; do not hard-code a single narrative. |
| Accessibility as a default requirement | Color-vision safety, contrast, keyboard, and screen-reader values are design inputs, not a final QA pass. |
| Fluid consumption (desktop, mobile, Focus mode, embedded) | One visual must survive many viewport sizes and touch input; design for the smallest case first. |

## Interaction: the mantra still holds

Shneiderman's interaction mantra — **overview first, zoom and filter, then details on demand** — maps directly onto Power BI:

| Step | Power BI equivalent | What your visual must do |
| --- | --- | --- |
| Overview | The visual at normal size | Show the main pattern, not every detail |
| Zoom / filter | Slicers, cross-filtering, drill-down | React to `options.jsonFilters`, highlights, and drill state |
| Details on demand | Tooltip, focus mode, context menu | Carry `selectionId` into tooltip `identities` and context menu |

Practical rules:

- Progressive disclosure: overview → tooltip → drill → filter. Never put everything on screen.
- Focus + context: dim what is not selected; do not remove it (see [data-binding-principles.md](data-binding-principles.md#5-cross-filtering-is-opt-in-and-must-be-honored)).
- Animation is for state transitions, not decoration. Respect reduced motion.

## Informative vs decision-making

Three levels, and most visuals only reach the first:

1. **Descriptive** — what happened (a value, a trend).
2. **Diagnostic** — why (breakdown, comparison, correlation).
3. **Decision** — what to do (variance to target, confidence, consequence).

To reach level 3, add: a reference point (target, prior period, peer, budget), direction and size of the gap, uncertainty or sample size where relevant, and an unambiguous label. Do not imply causality the data cannot support.

Quick test: if a reader cannot answer "is this good or bad, and what should I do next?" after 5 seconds, the visual is informative but not decision-ready.

## Color that adds value

Five rules, grounded in [Wong (2011)](https://www.nature.com/articles/nmeth.1618), [Okabe & Ito's Color Universal Design](https://jfly.uni-koeln.de/color/), [Crameri's scientific colour maps](https://www.fabiocrameri.ch/colourmaps/), and [WCAG 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html):

1. **Perceptually uniform scales** — equal data steps should look like equal color steps. Crameri's palettes are designed for this and read in greyscale too.
2. **Avoid red/green as the only distinction** — the most common color-vision deficiency. Use blue/orange or a published colorblind-safe set.
3. **Redundant coding** — pair color with shape, line style, label, or position. Color must never be the sole carrier of meaning.
4. **Semantic consistency** — one meaning → one color across the whole report; take values from `host.colorPalette` / `ColorHelper`.
5. **Restraint and contrast** — text ≥ 4.5:1, large text/UI graphics ≥ 3:1; limit categorical colors to roughly 6–8.

Worked example — a status column:

| Bad | Better |
| --- | --- |
| Red/green dots with no label | Blue/orange marker **plus** a "+4% / -3%" text label and an icon |
| Rainbow gradient by value | One perceptually uniform sequential scale, low→high |
| User's theme color reused for "bad" | A theme-derived color for data, a single reserved color for exceptions |

## One visual, many screens

Design for the smallest viewport first, then let larger ones reveal more.

| Viewport | Keep | Drop / simplify |
| --- | --- | --- |
| Small tile / mobile | Value, one primary mark, large touch target | Legends, secondary labels, fine axes |
| Medium | Primary marks + direct labels + short axis | Dense annotations |
| Large / Focus mode | Full marks, labels, annotations, secondary context | — |
| Portrait vs landscape | Re-flow rather than shrink text | Fixed pixel layouts |

Implementation recipe:

```typescript
// In update(): options.viewport is the source of truth
const compact = options.viewport.width < 320 || options.viewport.height < 200;
// compact -> direct labels on marks, hide legend, fewer ticks
// use ResizeEnd for final label/tick recalculation
```

```css
/* Container queries let components react to the visual's own box,
   not the browser window (MDN: CSS container queries). */
.visual-root { container-type: inline-size; }
@container (max-width: 320px) {
  .legend { display: none; }
  .mark-label { font-size: 11px; }
}
```

Add SVG `viewBox`, percentage/flex layout, and cached view models so resize is cheap. Handle touch equivalents (`touchstart`/`touchmove`/`touchend`) and long-press context menu. See [ui-responsive-and-performance.md](ui-responsive-and-performance.md) and [mobile development](https://learn.microsoft.com/en-us/power-bi/developer/visuals/mobile-development).

## Two concrete examples

**Decision KPI at three sizes** — small: `+4% vs target` with an arrow; medium: value + prior period + target line; large: value + 12-month sparkline + variance annotation. Same data, progressive disclosure.

**Category comparison with color** — small: four sorted bars, direct labels, theme accent, no legend; medium: eight bars, value labels; large: all categories, reference line for average, one reserved exception color with an icon. Color never carries meaning alone.

## References

- [Points of view: Color blindness — Wong, Nature Methods (2011)](https://www.nature.com/articles/nmeth.1618)
- [Color Universal Design / Okabe–Ito palette](https://jfly.uni-koeln.de/color/)
- [Scientific colour maps — Crameri](https://www.fabiocrameri.ch/colourmaps/)
- [WCAG 2.1 contrast minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [MDN: CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [IxDF: Information visualization](https://www.interaction-design.org/literature/topics/information-visualization)
- [Power BI mobile development](https://learn.microsoft.com/en-us/power-bi/developer/visuals/mobile-development)
- [Power BI resize optimization](https://learn.microsoft.com/en-us/power-bi/developer/visuals/custom-visuals-resize-optimization-guidelines)
