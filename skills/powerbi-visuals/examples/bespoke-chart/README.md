# Bespoke chart example: donut with center KPI

A copyable skeleton for a custom donut visual built from a sketch. It shows the parts that differ from a standard bar chart:

- `d3-shape` `pie()` + `arc()` for custom geometry
- a center KPI derived from the same data
- colors from `host.colorPalette`, with high-contrast handling
- selection IDs on each slice, plus tooltip and keyboard focus
- viewport-derived radius and direct labels

This is a **pattern skeleton**, not a tested project.

## Use it

```bash
pbiviz new myDonut
cd myDonut
npm install d3-shape @types/d3-shape --save-dev
# copy capabilities.json, src/visual.ts, style/visual.less over the generated files
pbiviz start
```

Then bind one category and one measure. See `references/sketch-to-visual.md` for the sketch intake protocol and `references/bespoke-chart-patterns.md` for other chart families.
