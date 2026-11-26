# From a sketch to a Power BI visual

A paper sketch, whiteboard photo, or Figma mock is a valid brief. This file tells an agent how to convert it into a real custom visual instead of ignoring it or building a generic bar chart.

## Image intake protocol

If the user provides a sketch image (photo, screenshot, scan):

1. **Describe what you see before writing code.** List: marks and their shapes, approximate proportions, labels and titles, layout regions (center, edges, legend), colors/patterns, and any arrows or connectors.
2. **State what is ambiguous.** Say which elements could encode more than one thing.
3. **Ask what each element means.** For each mark: "what does the size/angle/position/color represent?" and "what fields do you have?"
4. **Confirm the data contract.** Only after that, choose `dataRoles`, `dataViewMappings`, and a rendering approach.
5. If the user has no data yet, build a static mock with placeholder data and expose format controls so it can be bound later.

Example opening line:

> "I see a ring with four unequal segments, a large number in the middle, and labels outside. I'll assume the ring shows parts of a whole and the center shows the total — tell me if the ring is a ranking instead."

## Sketch element → Power BI vocabulary

| Sketch element | Encoding | Power BI construct | Build with |
| --- | --- | --- | --- |
| Bars of different length | Position/length | `categorical` + one measure | `d3-scale` `scaleBand`, SVG `rect` |
| Pie/donut slices | Angle/area | `categorical` + one measure | `d3-shape` `pie()`, `arc()` |
| Nested rings | Hierarchy | hierarchical `categorical` or `matrix` | `d3-hierarchy` `partition()` |
| Center number / callout | Text | `single` or aggregate of the same measure | SVG `text`, `valueFormatter.format` |
| Legend list | Categories | values in the categorical data view | direct labels or `<ul>`/SVG text |
| Color-coded marks | Nominal encoding | `objects` fill property + `colorPalette` | `ColorHelper`, `getColor(key)` |
| Arrow / connector | Relationship | `table` with source + target columns | `d3-chord`, `d3-sankey`, SVG paths |
| Node-link cloud | Network | `table` with node + edge rows | `d3-force` |
| Map pins / regions | Geography | `geography` data role | `d3-geo`, `geoPath` |
| Small repeated panels | Small multiples | multiple categories or `matrix` | repeated SVG groups with shared scales |
| Texture / hatch | Redundant coding | format property (pattern) | SVG `<pattern>` fills |
| Dashed vs solid line | Redundant coding | format property (line style) | `stroke-dasharray` |

## Feasibility stance: "yes, and"

Bespoke visuals are the point of custom visuals. Support the design, then add only **specific** corrections:

- **Accept** unusual chart types — radial bars, rose charts, sankey, chord, treemaps, network graphs, custom KPI tiles. Use d3 modules rather than forcing them into standard charts.
- **Flag only concrete problems**:
  - 3D depth or perspective distorts length/area — offer a flat version of the same design.
  - Exploded slices make part-to-whole comparison harder — keep the explode if it is decorative, but add direct labels so comparison does not depend on angle alone.
  - Many slices (more than ~8) make angle comparison unreliable — group into "Other" or use a sorted bar of the same data.
  - Color-only meaning fails for color-blind readers — add a label, pattern, or shape.
- **Never replace the user's design by default.** Offer the alternative and let them choose. One sentence of reasoning is enough.

## Worked example

Sketch (text wireframe):

```
   ___________________
  /   7 4 2 1 \        <- four donut segments
 |    $12,480   |      <- center total
  \_____________/
   A  B  C  D           <- legend / direct labels
```

Agent response sequence:

1. "Ring = four parts of a whole; center = total; labels = categories. Confirm?"
2. Capabilities: one `Grouping` role (`category`), one `Measure` role (`measure`), `categorical` mapping, `dataColors` object, `supportsHighlight`.
3. View model: `{ label, value, color, selectionId }[]` plus `total`.
4. Render: `d3-shape.pie().sort(null)` → `d3-shape.arc().innerRadius(r * 0.6).outerRadius(r)`; append SVG `<path>` per slice; append centered `<text>` with the formatted total; direct labels beside slices.
5. Add selection IDs, tooltip with `identities`, high-contrast colors, keyboard focus on paths.

Full code: [examples/bespoke-chart/](../examples/bespoke-chart/README.md).

## Clarifying questions worth asking

- "What does the size/angle of each mark represent?"
- "Is the center number the total, or an independent measure?"
- "Should segments be sorted by value or kept in the source order?"
- "Do you want direct labels or a legend?"
- "Does this need to work on a phone-sized tile?"
- "Are there any states (selected, highlighted, no data) you want reflected?"

See [bespoke-chart-patterns.md](bespoke-chart-patterns.md) for the rendering recipes and [data-visualization-principles.md](data-visualization-principles.md) for the honesty rules.

Sources: [Power BI samples gallery](https://learn.microsoft.com/en-us/power-bi/developer/visuals/samples), [SampleBarChart](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart), [d3-shape](https://d3js.org/d3-shape).
