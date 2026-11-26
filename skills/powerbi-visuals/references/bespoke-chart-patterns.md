# Bespoke chart patterns

Power BI custom visuals exist because built-in charts are not enough. Use d3 modules and native SVG/canvas to build the shape the user actually drew, then make it theme-aware, accessible, and safe to certify.

## Choosing a rendering surface

| Surface | Use when | Watch-outs |
| --- | --- | --- |
| SVG | Marks are individually identifiable, need focus/tooltips, tens to hundreds of elements | DOM cost grows with mark count |
| Canvas | Thousands of marks, animation, particle/network layouts | Manual hit-testing, no per-mark DOM, text is manual |
| WebGL | 3D or very heavy rendering | Highest complexity; see [globemap](https://github.com/Microsoft/powerbi-visuals-globemap/) |

Prefer SVG first; move to canvas only when measurement shows a problem.

## d3 module map

| Need | Module | Typical calls |
| --- | --- | --- |
| Arcs, pies, lines, areas, curves, stacks | `d3-shape` | `pie()`, `arc()`, `line()`, `area()`, `stack()` |
| Scales | `d3-scale` | `scaleBand`, `scaleLinear`, `scaleTime`, `scaleSqrt` |
| Hierarchies, treemap, sunburst, icicle | `d3-hierarchy` | `hierarchy()`, `treemap()`, `partition()` |
| Chord diagrams | `d3-chord` | `chord()`, `ribbon()` |
| Force-directed networks | `d3-force` | `forceSimulation()`, `forceLink()`, `forceManyBody()` |
| Maps / geo projections | `d3-geo` | `geoPath()`, `geoMercator()` |
| Sankey / flow diagrams | `d3-sankey` (separate npm package) | `sankey()`, `sankeyLinkHorizontal()` |
| Brushing, zooming, dragging | `d3-brush`, `d3-zoom`, `d3-drag` | `brush()`, `zoom()`, `drag()` |
| Aggregation and binning | `d3-array` | `extent()`, `max()`, `group()`, `bin()` |
| DOM joins | `d3-selection` | `selectAll().data().join()` |

Install only the modules you use. See [ui-frameworks-and-charting.md](ui-frameworks-and-charting.md) for version and certification constraints.

## Pie family

| Variant | Use it for | Build notes | Caution |
| --- | --- | --- | --- |
| Standard pie | Composition, ≤5 slices | `pie().sort(null)` + `arc()`; direct labels | Angle comparison is weaker than length |
| Donut with center KPI | Composition plus a headline total | `arc().innerRadius(r * 0.6)`, centered `<text>` with total | Center value must be derived from the same data |
| Exploded donut | Emphasis on one slice | Offset one arc by translating its `<path>` | Keep direct labels; explosion hurts precise comparison |
| Rose / Nightingale (radial bar) | Comparing magnitudes with a circular layout | Equal angle per category, radius encodes value with `scaleSqrt` for area fidelity | Do not encode value by radius linearly if you imply area |
| Sunburst | Hierarchical part-to-whole | `d3-hierarchy.partition()` + `arc()` | More than 2–3 levels needs drill-down and labels |
| 3D pie | — | Avoid | Perspective distorts length and area; offer a flat version |

Code for the donut variant: [examples/bespoke-chart/](../examples/bespoke-chart/README.md).

## Custom shapes and marks

```typescript
import { arc } from "d3-shape";

const arcGen = arc<{ startAngle: number; endAngle: number }>()
  .innerRadius(inner)
  .outerRadius(outer)
  .cornerRadius(2);

const path = this.svg.append("path")
  .attr("d", arcGen)
  .attr("tabindex", "0")
  .attr("role", "button")
  .attr("aria-label", `${point.label}: ${point.value}`)
  .style("fill", point.color);
```

For shapes d3 does not provide, build SVG `<path>` geometry yourself or use a `<symbol>`/<pattern> referenced by `<use>`. Keep coordinates derived from `options.viewport`, never fixed pixels.

Texture instead of color-only:

```xml
<pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
  <line x1="0" y1="0" x2="0" y2="6" stroke="#767676" stroke-width="2" />
</pattern>
```

## Hardening bespoke visuals

- **Theme**: colors from `host.colorPalette` / `ColorHelper`; high contrast uses foreground/background/foreground-selected/hyperlink only.
- **Selection**: build `ISelectionId` per mark; pass it to tooltip `identities`, context menu, and format selectors.
- **Accessibility**: give each mark an accessible name and keyboard focus (`tabindex`, `role`, `aria-label`); provide `<title>`; never rely on color alone.
- **Safe DOM**: `text()` / `textContent`, never `innerHTML` with data. No external fonts, images, or scripts.
- **Certification**: no `fetch`/`XMLHttpRequest`/`eval`, `WebAccess` empty, support rendering events; use `pbiviz package --certification-audit`.
- **Performance**: cache the view model; on `Resize` do minimal work, recalculate layout on `ResizeEnd`; consider canvas for large mark counts.
- **Empty state**: no fields → instructions; fields but all null → "no data"; zeros → real marks.

## Reference implementations to copy from

- [Aster Plot](https://github.com/Microsoft/powerbi-visuals-asterplot) — dual encoding with legend.
- [Sunburst](https://github.com/Microsoft/powerbi-visuals-sunburst) — hierarchy and drill.
- [Chord](https://github.com/Microsoft/powerbi-visuals-chord) — relationships with `d3-chord`.
- [Force Graph](https://github.com/Microsoft/powerbi-visuals-forcegraph) — network layout.
- [Sankey](https://github.com/Microsoft/powerbi-visuals-sankey) — flows.
- [Globe Map](https://github.com/Microsoft/powerbi-visuals-globemap) — WebGL.
- [SampleBarChart](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart) — canonical d3 + selection + tooltip patterns.

See the [UI reference gallery](ui-reference-gallery.md) for the full list with screenshots, and [sketch-to-visual.md](sketch-to-visual.md) for turning a drawn idea into a data contract.

Sources: [d3-shape](https://d3js.org/d3-shape), [d3-hierarchy](https://d3js.org/d3-hierarchy), [d3-force](https://d3js.org/d3-force), [d3-geo](https://d3js.org/d3-geo), [d3-sankey](https://github.com/d3/d3-sankey), [Adding external libraries](https://learn.microsoft.com/en-us/power-bi/developer/visuals/adding-external-libraries).
