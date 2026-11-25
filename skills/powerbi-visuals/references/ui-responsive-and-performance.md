# Responsive UI and rendering performance

Resize is a UI problem. Power BI sends many `update()` calls while a report author drags the visual's corner; treating each one as a full data rebuild makes the interaction feel broken.

## `VisualUpdateType` is a bit flag

`options.type` can contain several flags at once. Always use bitwise checks, never equality.

| Flag | Meaning | What to do |
| --- | --- | --- |
| `Data` | Data or data view changed | Full render |
| `Resize` | Resize in progress (repeated) | Minimal viewport work only |
| `ResizeEnd` | Resize finished | Recalculate final layout-dependent elements |
| `ViewMode` | View/edit/focus changed | Full render |
| `Style` | Theme/style changed | Full render |

```typescript
public update(options: VisualUpdateOptions): void {
  const resizeFlags = VisualUpdateType.Resize | VisualUpdateType.ResizeEnd;
  const isResize = (options.type & VisualUpdateType.Resize) !== 0;
  const isResizeEnd = (options.type & VisualUpdateType.ResizeEnd) !== 0;
  const hasOnlyResizeFlags = (options.type & ~resizeFlags) === 0;

  if (!hasOnlyResizeFlags) { this.fullRender(options); return; }
  if (isResizeEnd) { this.recalculateLayout(options.viewport); return; }
  if (isResize) { this.adjustViewport(options.viewport); return; }
  this.fullRender(options);
}
```

### During `Resize`

- Do: update SVG `viewBox`, container size, CSS transform/scale, store the new viewport.
- Don't: reprocess `dataViews`, rebuild axes/legends/marks, measure every label, run force/treemap layouts.

### During `ResizeEnd`

- Recompute axis tick counts, label wrapping/truncation, legend position.
- Rerender elements that cannot scale proportionally.
- Persist viewport-dependent state if needed.

## Responsive techniques

| Technique | When |
| --- | --- |
| SVG `viewBox` + `preserveAspectRatio` | Content scales proportionally; browser does the work |
| CSS percentages / flexbox | Containers, legends, simple marks |
| CSS `transform` scaling | Cheap intermediate scaling while dragging |
| Debounce layout math on `ResizeEnd` | Avoid repeated expensive recalc |
| Cached processed data | Data processing independent of viewport |

Keep a view model separate from layout: transform `DataView` → view model on `Data`, then render view model → pixels on resize. That is what makes the resize path cheap.

## Mobile and touch

A visual must render on supported mobile devices, in reports/dashboards, and in **Focus mode** (portrait and landscape). Desktop events need touch equivalents:

| Mouse | Touch |
| --- | --- |
| `click` | `click` |
| `mousemove` | `touchmove` |
| `mousedown` | `touchstart` |
| `mouseup` | `touchend` |
| `mouseover` / `mouseout` | `touchmove` (or a helper library) |
| `contextmenu` | external library / long-press |
| `wheel` | not available |
| `dblclick` | external library |

- Handle both mouse and touch; some devices do not emit mouse events.
- Make touch targets comfortably large; don't rely on hover to discover interactivity.
- Add format options to adjust label/element sizes for small tiles.
- If rendering genuinely fails, show a **descriptive** error rather than a blank box.

## Performance checklist

From the official performance guidance:

- Measure first: Power BI Desktop **View → Performance Analyzer**; also `console.time()`/`timeEnd()` and the User Timing API.
- Test first render, thousands of points, a single measure (baseline overhead), filtering, slicing, and resizing.
- Reduce plugin size: remove unused code, tree-shake, avoid oversized libraries.
- Don't rerender the whole visual; store the previous data view and update only changed marks.
- Cache DOM nodes (e.g. hold `this.xAxis` from the constructor) instead of re-querying in every update.
- Minimize insert operations (`append`, `prepend`, `after`); build once and join.
- Avoid jQuery; prefer native JS.
- For repeated animation or very large datasets, consider canvas/WebGL instead of SVG.

## Interaction responsiveness

- Selection and highlight changes should update opacity/stroke, not rebuild marks.
- Tooltips should subscribe once in the constructor and only receive data on hover.
- Defer heavy layout to `ResizeEnd`; keep `Resize` under a frame budget.

Sources: [Resize optimization guidelines](https://learn.microsoft.com/en-us/power-bi/developer/visuals/custom-visuals-resize-optimization-guidelines), [Performance tips](https://learn.microsoft.com/en-us/power-bi/developer/visuals/performance-tips), [Mobile development](https://learn.microsoft.com/en-us/power-bi/developer/visuals/mobile-development), [Visual API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-api).
