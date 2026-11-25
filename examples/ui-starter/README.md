# UI starter skeleton

A small, copy-paste reference for the **UI scaffolding** of a custom visual: SVG rendering, theme colors, high contrast, selection, tooltip, context menu, keyboard focus, and resize-aware updates.

This is a **pattern skeleton**, not a tested project. The fastest way to use it:

```bash
pbiviz new myVisual
# copy these files over the generated ones:
#   capabilities.json -> project root
#   src/visual.ts      -> src/visual.ts
#   style/visual.less  -> style/visual.less
npm install
pbiviz start
```

What it deliberately does:

- Keeps a **view model** (`transform`) separate from **rendering** (`render`), so resize can reuse processed data.
- Uses bitwise `VisualUpdateType` checks: full render on data/style changes, minimal work on `Resize`, final layout on `ResizeEnd`.
- Gets colors from `host.colorPalette` and obeys the four allowed high-contrast colors.
- Uses safe DOM/SVG APIs and `textContent` — no `innerHTML`.
- Makes bars focusable and gives the SVG an accessible name.
- Passes the selection ID to tooltips and the context menu.

What it intentionally omits (add when you need them): formatting model, localization, drill-down, bookmarks, fetch more data. See the `references/` folder in this repo for those.

## Files

| File | Purpose |
| --- | --- |
| `capabilities.json` | One category + one measure, highlight, keyboard focus, tooltips, color object |
| `src/visual.ts` | `IVisual` implementation with the patterns listed above |
| `style/visual.less` | Scoped, theme-friendly styles and interaction states |
