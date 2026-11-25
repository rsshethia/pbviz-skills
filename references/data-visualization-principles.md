# Data visualization principles (the experienced-practitioner layer)

The rest of this skill answers *how* to build a visual. This file answers *whether the visual says the truth, and whether it says it efficiently*. An AI agent should apply this **before** choosing a chart type or writing a line of rendering code.

Foundations: Cleveland & McGill's ranked perceptual channels, Edward Tufte's data-ink ratio and graphical integrity, Stephen Few's "show the data" and "meaningful context", and Jacques Bertin's semiology of graphics. The rules below are the field-tested version, translated into Power BI custom visual decisions.

## 1. Start with the question, not the chart

Classify the reader's question first. Then pick the encoding. Do not start from "I want a sunburst".

| Question | Best encoding | Typical Power BI mapping | Common mistake |
| --- | --- | --- | --- |
| How much / ranking? | Position on a common scale (sorted bar, dot plot) | `categorical` with one category + one measure | Pie/donut; alphabetical order |
| Change over time? | Position along a time axis (line) | `categorical` with a date category, or `table` | Bar chart for many time points; truncated axis |
| Part-to-whole? | Stacked bar (few parts) or 100% stacked; treemap only for rough size | `categorical` with grouping | Pie with >5 slices; exploded slices |
| Distribution? | Histogram, box plot, dot plot | `table` or `categorical` + local binning | Average-only KPI |
| Relationship / correlation? | Scatter plot | `table` with two measures | Dual-axis line chart implying causation |
| Hierarchy / drill? | Small multiples or treemap/sunburst with clear navigation | `matrix` or hierarchical `categorical` | Sunburst with too many levels and no labels |
| Single value vs target? | Bullet chart / KPI card with reference line | `single` mapping + objects for target | Big number with no context |
| Many categories? | Sorted bar, top-N with explicit "other", or small multiples | `categorical` + data reduction | Cramming 200 labels into one axis |

Rule: **if the question is comparison, use position.** Position on a common scale is the most accurate visual channel; angle, area, color intensity, and 3D depth are progressively worse.

## 2. Graphical integrity (non-negotiable)

- **Bars start at zero.** Never truncate a bar axis — the length *is* the value.
- Lines may use a non-zero baseline only when the range is explicitly labeled and the context is clear; consider an indexed comparison instead.
- **No dual axes** for implying correlation. Two independent scales can be made to cross anywhere. Use small multiples or index both series to a common baseline.
- **No 3D, no perspective, no gratuitous gradients/shadows.** Depth distorts length and area.
- **Area is not linear**: doubling a radius quadruples area. Size marks by area, not diameter, and say so.
- Ratios and percentages need their **denominator**; show the raw number alongside the rate.
- Distinguish **zero from missing**. Never silently coerce `null` to `0` — that is a data lie. Render an explicit "no data"/empty state.
- Say what the data cannot support: **correlation is not causation**. Titles and tooltips should not imply causality the data cannot establish.

## 3. Data reduction must be honest

Power BI silently caps data views (default `top` 1000, max 30,000). That is a design decision you own, not an implementation detail.

- Set `dataReductionAlgorithm` deliberately; don't accept the default by accident.
- If data is sampled or truncated (`top`, `sample`, `window`), **say so in the visual** — a label such as "Top 1,000" or "Sampled" prevents false conclusions.
- Use `fetchMoreData` when the analysis genuinely needs the full set; handle the 100 MB limit explicitly.
- Never let a reduction mode change the apparent ranking without telling the reader.
- See [capabilities-and-data-binding.md](capabilities-and-data-binding.md#data-reduction) and [interactions-and-features.md](interactions-and-features.md#fetch-more-data-api-34).

## 4. Make the data easy to read

- **Direct-label marks** where possible; every legend lookup costs the reader a eye movement. Remove legends when labels fit.
- **Sort by the data**, not by name — unless the task is lookup.
- **Small multiples** beat one overloaded chart. Keep scales identical across panels so comparison is valid.
- **Remove chartjunk**: gridlines, borders, backgrounds, and decorations that carry no information (Tufte's data-ink ratio).
- Establish a clear reading order: title states the takeaway ("Revenue fell 12% in Q3"), axis labels state units, annotations explain anomalies.
- **One idea per visual.** If you need three sentences to explain the chart, split it.
- Keep a consistent type scale (≈12/14/18/24) and use weight for hierarchy.

## 5. Color is a scarce resource

- Use color to **encode a variable** or to **direct attention** — not both at once, and not as decoration.
- Limit categorical colors (~6–8); beyond that, group, sort, or use small multiples.
- Match palette type to data: categorical (nominal), sequential (magnitude), diverging (deviation from a baseline).
- Never encode meaning by color alone — add shape, label, or pattern. Check with a color-vision simulator.
- Take colors from `host.colorPalette` / `ColorHelper`; same meaning → same color across the whole report.
- In high-contrast mode, the four allowed colors override your palette.
- See [ui-theming-and-color.md](ui-theming-and-color.md).

## 6. Context and comparison

A number without a reference is almost meaningless. Give the reader something to compare against:

- previous period, target/budget, peer group, or a distribution — not just the current value.
- Use reference lines, bullets, or deltas with clear direction.
- Show **change in absolute and relative terms** when both matter.
- When filtering/slicing, make the active filter visible in the visual so the reader knows the scope of what they are seeing.

## 7. Progressive disclosure

Overview first, detail on demand:

1. The visual shows the main pattern at a glance.
2. Tooltip reveals exact values and breakdowns.
3. Drill-down / focus mode reveals detail.
4. Filters and cross-highlighting let the reader ask new questions.

Do not put everything on screen. Do not use animation to convey data that is available statically; motion is for state transitions, not decoration. Respect `prefers-reduced-motion`.

## 8. Interaction serves the question

- Selection should do something understandable (cross-filter, highlight, reveal detail).
- Cross-highlighting should **dim** alternatives, not delete them — deleting changes the context.
- Tooltips should answer "what exactly is this point?" with units and identities, not repeat the label.
- Context menu, drill, bookmarks, and sync slicers exist to support exploration; adding them without a reason adds noise.
- See [interactions-and-features.md](interactions-and-features.md).

## 9. Test with hostile data

A visual is not done because it works on the demo dataset. Test:

- empty, one value, all equal values, extreme outlier, negative values;
- nulls vs zeros; very long labels and long translated strings;
- many categories, huge counts, rapid resize;
- filter combinations and cross-highlighting from other visuals;
- high contrast, dark theme, small tile, Focus mode.

If the design only works with tidy data, it is not a finished design.

## 10. Principles audit (run before declaring a visual done)

- [ ] The chart answers a specific question; the title states the finding.
- [ ] Encoding uses position/length for comparison; no pie for ranking, no 3D, no dual axis.
- [ ] Bar baselines are zero; non-zero line axes are labeled.
- [ ] Data reduction/sampling is disclosed; nulls are not silently zero.
- [ ] Marks are directly labeled where possible; sort order is meaningful.
- [ ] Color encodes one thing, is theme-derived, and is not the only carrier of meaning.
- [ ] Every value has context (target, prior period, peer, or distribution).
- [ ] Details live in tooltips/drill, not all on screen.
- [ ] Interaction changes something the reader understands.
- [ ] It survives hostile data, resize, themes, and high contrast.

## How this is wired into the skill

- `SKILL.md` — "Principles gate" step before implementation.
- [ui-accessibility-checklist.md](ui-accessibility-checklist.md) — step 0 of the audit covers question/encoding and graphical integrity.
- [ui-reference-gallery.md](ui-reference-gallery.md) — official samples demonstrate these conventions in real code.
- [capabilities-and-data-binding.md](capabilities-and-data-binding.md) — where honest data reduction is configured.
- [ui-theming-and-color.md](ui-theming-and-color.md) — the color rules in code.

Sources: Cleveland & McGill, *Graphical Perception and Graphic Design of Statistical Graphics* (1984); Edward Tufte, *The Visual Display of Quantitative Information*; Stephen Few, *Show Me the Numbers* and *Information Dashboard Design*; Jacques Bertin, *Semiology of Graphics*. Power BI specifics: [Data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings), [Sort data](https://learn.microsoft.com/en-us/power-bi/developer/visuals/sort-options), [Highlight data](https://learn.microsoft.com/en-us/power-bi/developer/visuals/highlight).
