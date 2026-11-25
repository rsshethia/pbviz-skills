# Interactions and features

Interactions turn a static chart into a Power BI visual that participates in reports: clicking a data point filters other visuals, hovering shows tooltips, right-clicking opens the host context menu, and drill-down/bookmarks work as users expect.

## Selection and cross-filtering

Create a selection ID for every selectable data point, then use the selection manager to communicate with the host.

```typescript
// In the constructor
this.selectionManager = host.createSelectionManager();

// While binding data, build an ID per data point
const builder: powerbi.extensibility.visual.ISelectionIdBuilder =
  host.createSelectionIdBuilder().withCategory(dataView.categorical.categories[0], index);
const selectionId: powerbi.extensibility.visual.ISelectionId = builder.createSelectionId();

// On click
this.selectionManager.select(selectionId, /* multiSelect: */ false).then((ids) => {
  // ids contains the currently selected IDs; update opacity/visuals accordingly
});
```

`withCategory`, `withSeries`, `withMeasure`, `withMatrixNode(node, levels)`, and `withValue` cover the common data shapes. For matrix nodes, push IDs for each ancestor before creating the ID (see [capabilities-and-data-binding.md](capabilities-and-data-binding.md#expandcollapse-410-whole-level-420)).

Enable `supportsHighlight: true` in `capabilities.json` and read `values[i].highlights` to apply cross-highlighting: dim non-highlighted points instead of removing them.

## Filter API

`host.applyJsonFilter(filter, dataRole, action)` applies filters back to the report. Use `powerbi.data.create` helpers (or `powerbi-visuals-utils-interactivity`) to build filters, and respect `options.jsonFilters` to reflect filters created elsewhere.

Never keep a separate, private copy of filter state that conflicts with `options.jsonFilters` — the host is the source of truth.

## Tooltips

`ITooltipService` is reached through `host.tooltipService`:

```typescript
interface ITooltipService {
  enabled(): boolean;
  show(options: TooltipShowOptions): void;
  move(options: TooltipMoveOptions): void;
  hide(options: TooltipHideOptions): void;
}
```

Typical implementation uses a `TooltipServiceWrapper` that listens to d3 `mouseover`, `mousemove`, and `mouseout` on rendered elements:

```typescript
tooltipServiceWrapper.addTooltip(
  this.bars,
  (event) => [{
    displayName: event.data.category,
    value: event.data.value.toString(),
    color: event.data.color,
    header: "Sales"
  }],
  (event) => event.data.selectionId
);
```

- Always check `host.tooltipService.enabled()` before subscribing.
- `TooltipShowOptions` contains `coordinates`, `isTouchEvent`, `dataItems: VisualTooltipDataItem[]`, and `identities: ISelectionId[]`.
- Pass the data point's selection ID in `identities` so **report page tooltips** know which data to show.
- Multiple `VisualTooltipDataItem`s produce multiple lines (useful for stacked charts).

Capabilities:

```json
"tooltips": {
  "supportedTypes": { "default": true, "canvas": true },
  "roles": ["tooltips"],
  "supportEnhancedTooltips": true
}
```

- `default` — automatic tooltips via data fields.
- `canvas` — report page tooltips.
- `supportEnhancedTooltips` — modern tooltips with drill actions and theme-matched styling (API 3.8.3+).

## Context menu

Required for all AppSource visuals. Use `selectionManager.showContextMenu()` on `contextmenu` (right-click or long-press). Two modes must work:

1. **Empty space** — basic visual menu (analyze, summarize, copy).
2. **Data point** — includes *Show data point as a table*, *Include*, *Exclude*.

```typescript
private handleContextMenu(): void {
  this.root.on("contextmenu", (event: PointerEvent, dataPoint) => {
    this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {}, {
      x: event.clientX,
      y: event.clientY
    });
    event.preventDefault();
  });
}
```

- Available from API 2.2.0.
- If the visual supports drilldown or expand/collapse, pass the optional `dataRoles` argument: `showContextMenu(selectionId, position, "Rows")`. Omitting it logs a console error in debug mode.

## Drill-down

Declare roles in capabilities:

```json
"drilldown": { "roles": ["Rows"] }
```

Host services: `host.drill.drillDown(selectionId, drillAll?)`, `drillUp()`, and `getDrillState?()`. Root nodes show a drill indicator; clicking should call `drillDown` with that node's selection ID. Keep the visual's drill state consistent across updates. Combine with matrix `expandCollapse` for large hierarchies.

## Bookmarks

Bookmarks capture filter/selection state and visual properties. To participate:

- Use host services (`selectionManager`, `applyJsonFilter`, `persistProperties`) rather than private state only.
- Reflect state in `update()` from `dataViews` and `options.jsonFilters` so a restored bookmark renders correctly.
- Do not persist bookmark-relevant data in module-level variables that survive visual re-creation.

## Sync slicers

Capabilities: `"supportsSynchronizingFilterState": true`. Read and apply filters from `options.jsonFilters`; call `host.applyJsonFilter()` with the correct `targets` and `action`. When slicer changes are pending, `options.pendingChanges` marks filters not yet applied to the report — show the visual accordingly.

## URL launcher

`host.launchUrl(url)` opens a URL in a new tab (use for links in tooltips or labels). The host may block some destinations in certified/embedded scenarios.

## Fetch more data (API 3.4+)

Default data views are capped (30k rows; data reduction default 1000). `fetchMoreData` bypasses the hard 30k row limit by loading windows. Dynamic window size via `dataReductionCustomization` is 5.2+.

1. Define a `window` in capabilities:

```json
"dataViewMappings": [{
  "table": {
    "rows": { "for": { "in": "values" },
      "dataReductionAlgorithm": { "window": { "count": 100 } } }
  }
}]
```

2. Check for more data with `dataView.metadata.segment`, then request it:

```typescript
if (dataView.metadata.segment) {
  const accepted: boolean = this.host.fetchMoreData(true); // true = aggregate segments (default)
  if (!accepted) { /* 100 MB limit reached */ }
}
```

- **Aggregation mode** (`aggregateSegments = true`): each `update()` receives all data accumulated so far; subsequent updates have `operationKind === Append`.
- **Incremental mode** (`false`): each update receives only the next window; use `operationKind === Segment` and skip overlap with `dataView.table['lastMergeIndex']`.
- Total fetched data is limited to **100 MB**; handle `false` from `fetchMoreData`.
- Pairs well with matrix expand/collapse for large hierarchies.

## Advanced edit mode

Capabilities: `"advancedEditModeSupport": 0 | 1 | 2`. When enabled, render advanced UI controls only when `options.editMode === EditMode.Advanced`.

Sources: [Selection API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/selection-api), [Add tooltips](https://learn.microsoft.com/en-us/power-bi/developer/visuals/add-tooltips), [Context menu](https://learn.microsoft.com/en-us/power-bi/developer/visuals/context-menu), [Drill down](https://learn.microsoft.com/en-us/power-bi/developer/visuals/drill-down-support), [Fetch more data](https://learn.microsoft.com/en-us/power-bi/developer/visuals/fetch-more-data).
