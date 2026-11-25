# UI reference gallery — learn from the official visuals

The fastest way to make a custom visual look and behave like a native Power BI visual is to copy patterns from Microsoft's own sample visuals. The [Examples of Power BI visuals](https://learn.microsoft.com/en-us/power-bi/developer/visuals/samples) page is a screenshot-backed gallery with links to full source repositories. Use it as a **UI pattern library**, not just a code library.

## How to mine a sample for UI

For any sample below:

1. Look at the screenshot first — spacing, label hierarchy, color usage, legend, tooltip.
2. Read `capabilities.json` to see which format controls the UI exposes.
3. Read `src/visual.ts` (often a `visualTransform` + d3 render split) for layout and interaction patterns.
4. Read `style/visual.less` for typography and spacing conventions.
5. Copy the *pattern*, not the whole visual.

Canonical starting point: [SampleBarChart](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart) — [barChart.ts](https://github.com/microsoft/PowerBI-visuals-sampleBarChart/blob/master/src/barChart.ts). It demonstrates tooltips, selection, colors, highlighting, high contrast, localization, and d3 data joins in one readable file.

## Gallery: visual → UI pattern worth studying

| Sample | UI pattern to learn | Repository | Screenshot |
| --- | --- | --- | --- |
| Chiclet Slicer | Button-like selectable tiles, pressed/selected states, touch targets | [chicletslicer](https://github.com/Microsoft/powerbi-visuals-chicletslicer/) | — |
| Timeline slicer | Date-range brush/handles, compact axis | [timeline](https://github.com/Microsoft/powerbi-visuals-timeline/) | — |
| Slicer sample | Filter UI, list states, sync slicers, advanced filter API | [sampleslicer](https://github.com/Microsoft/powerbi-visuals-sampleslicer/) | — |
| Bullet chart | Context markers and banded background; dense information in a small tile | [bulletchart](https://github.com/Microsoft/powerbi-visuals-bulletchart/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/bullet-chart.png) |
| Dot plot | Distribution display with minimal chrome | [dotplot](https://github.com/Microsoft/powerbi-visuals-dotplot/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/dot-plot.png) |
| Chord | Relationship visualization, curved links, hover emphasis | [chord](https://github.com/Microsoft/powerbi-visuals-chord/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/chord.png) |
| Gantt | Timeline labels, resource rows, compact bars | [gantt](https://github.com/Microsoft/powerbi-visuals-gantt/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/gantt.png) |
| Histogram | Binned axis and readable tick labels | [histogram](https://github.com/Microsoft/powerbi-visuals-histogram/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/histogram-chart.png) |
| Table Heatmap | Conditional color scales in a dense grid | [heatmap](https://github.com/Microsoft/powerbi-visuals-heatmap/) | — |
| Multi KPI | KPI + sparklines; typography hierarchy in a compact card | [MultiKPI](https://github.com/microsoft/PowerBI-visuals-MultiKPI/) | — |
| Power KPI | Large value, trend line, variance labels | [PowerKPI](https://github.com/microsoft/PowerBI-visuals-PowerKPI/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/powerkpi.png) |
| Power KPI Matrix | Scoring lists, aligned numbers, small-multiple rhythm | [PowerKPIMatrix](https://github.com/microsoft/PowerBI-visuals-PowerKPIMatrix/) | — |
| Sunburst | Hierarchical navigation and drill affordance | [sunburst](https://github.com/Microsoft/powerbi-visuals-sunburst/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/sunburst.png) |
| Sankey | Flow widths, node labels, hover focus | [sankey](https://github.com/Microsoft/powerbi-visuals-sankey/) | — |
| Word Cloud | Text sizing, collision avoidance, truncation | [wordcloud](https://github.com/Microsoft/powerbi-visuals-wordcloud/) | [png](https://learn.microsoft.com/en-us/power-bi/developer/visuals/media/samples/word-cloud.png) |
| Pulse chart | Annotations over time; event markers | [pulsechart](https://github.com/Microsoft/powerbi-visuals-pulsechart/) | — |
| Aster Plot | Dual-encoding (radius + angle) with legend | [asterplot](https://github.com/Microsoft/powerbi-visuals-asterplot/) | — |
| Force Graph | Canvas/SVG node interaction, drag, hover emphasis | [forcegraph](https://github.com/Microsoft/powerbi-visuals-forcegraph/) | — |
| Globe Map | WebGL/canvas rendering in a visual | [globemap](https://github.com/Microsoft/powerbi-visuals-globemap/) | — |
| React circle card | Official React integration, adaptive size, themed border | [circlecard-react](https://github.com/Microsoft/powerbi-visuals-circlecard-react) | — |

## UI rules these samples consistently follow

- They render into the supplied `HTMLElement` and size from `options.viewport`, not fixed pixels.
- They get colors from `host.colorPalette` / `ColorHelper`, so report themes flow through.
- They expose formatting through `capabilities.json` objects and (in newer versions) the formatting model.
- They keep a `visualTransform`-style separation: turn `DataView` into a view model, then render the view model. This makes UI code testable and prevents data-shape assumptions leaking into layout code.
- They provide hover/selection states and tooltips — a chart without those feels "un-Power-BI".

## Other UI references worth keeping

| Resource | Why |
| --- | --- |
| [Circle card tutorial](https://learn.microsoft.com/en-us/power-bi/developer/visuals/develop-circle-card) | Smallest end-to-end visual with formatting and adaptive size |
| [Bar chart tutorial](https://learn.microsoft.com/en-us/power-bi/developer/visuals/create-bar-chart) | Step-by-step d3 chart construction |
| [React visual tutorial](https://learn.microsoft.com/en-us/power-bi/developer/visuals/create-react-visual) | Official React integration path |
| [Format pane example](https://learn.microsoft.com/en-us/power-bi/developer/visuals/format-pane-example) | Real formatting-model cards/groups/slices |
| [Formatting component pages](https://learn.microsoft.com/en-us/power-bi/developer/visuals/format-pane-general) | Color picker, slider, font control, alignment group, margin/padding |
| [Mobile development](https://learn.microsoft.com/en-us/power-bi/developer/visuals/mobile-development) | Touch/mouse event equivalence and focus-mode expectations |
| [Resize optimization](https://learn.microsoft.com/en-us/power-bi/developer/visuals/custom-visuals-resize-optimization-guidelines) | Responsive rendering under continuous resize |
