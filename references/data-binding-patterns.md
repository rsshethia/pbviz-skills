# Data binding patterns (code recipes)

Recipes for the boundary described in [data-binding-principles.md](data-binding-principles.md). All snippets assume `"use strict"` and `import powerbi from "powerbi-visuals-api"`. Verify exact signatures against [visuals-api.d.ts](https://github.com/microsoft/powerbi-visuals-api/blob/main/src/visuals-api.d.ts) when in doubt.

## Guard every update

```typescript
public update(options: VisualUpdateOptions): void {
  const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
  if (!dataView) { this.renderEmpty(); return; }
  // ... transform
}
```

`options.dataViews` can be absent or empty. Partial views are normal.

## Single mapping

```typescript
const value = dataView.single && dataView.single.value;
if (value === null || value === undefined) { this.renderEmpty(); return; }
this.model = { value: Number(value) };
```

## Categorical mapping (the common case)

```typescript
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import PrimitiveValue = powerbi.PrimitiveValue;

interface Point {
  label: string;
  value: number;
  highlighted: boolean | null;
  selectionId: powerbi.visuals.ISelectionId;
  formatString?: string;
}

function transformCategorical(
  dataView: DataView,
  host: powerbi.extensibility.visual.IVisualHost
): Point[] {
  const categorical = dataView.categorical;
  if (!categorical || !categorical.categories || !categorical.categories[0] ||
      !categorical.values || !categorical.values[0]) {
    return [];
  }

  const categories: DataViewCategoryColumn = categorical.categories[0];
  const values: DataViewValueColumn = categorical.values[0];
  const highlights: PrimitiveValue[] | undefined = values.highlights;
  const formatObjects = values.objects; // dynamic format strings (API 4.2+)
  const points: Point[] = [];

  for (let i = 0; i < categories.values.length; i++) {
    const raw = values.values[i];
    if (raw === null || raw === undefined || typeof raw !== "number") {
      continue; // never coerce null to zero
    }
    const highlight = highlights ? highlights[i] : undefined;
    points.push({
      label: String(categories.values[i]),
      value: raw,
      highlighted: highlights ? highlight !== null && highlight !== undefined : null,
      selectionId: host.createSelectionIdBuilder()
        .withCategory(categories, i)
        .createSelectionId(),
      formatString: formatObjects && formatObjects[i]
        ? (formatObjects[i] as any).general?.formatString
        : undefined
    });
  }
  return points;
}
```

Notes:

- `highlights` is **the same length as `values`**; unselected entries are `null`. Partial/multiple selections happen.
- `supportsHighlight: true` is required in capabilities, and `table` mapping does not support highlights.
- Avoid optional chaining on older TypeScript targets; the `?.` above is illustrative.

### Series/grouped values

```typescript
const groups = categorical.values.grouped(); // DataViewValueColumnGroup[]
groups.forEach(group => {
  const seriesId = host.createSelectionIdBuilder()
    .withSeries(categorical.values!, group)
    .createSelectionId();
  group.values.forEach((column, measureIndex) => {
    column.values.forEach((raw, categoryIndex) => {
      // combine with categories.values[categoryIndex] and seriesId as needed
    });
  });
});
```

## Table mapping

```typescript
import DataViewTable = powerbi.DataViewTable;
import DataViewTableRow = powerbi.DataViewTableRow;

function transformTable(dataView: DataView, host: powerbi.extensibility.visual.IVisualHost) {
  const table: DataViewTable | undefined = dataView.table;
  if (!table) return [];
  return table.rows.map((row: DataViewTableRow, rowIndex: number) => ({
    cells: row.slice(),
    selectionId: host.createSelectionIdBuilder().withTable(table, rowIndex).createSelectionId()
  }));
}
```

**Rows are not guaranteed to be ordered** — sort explicitly if sequence matters. Table mapping does not support highlights.

## Matrix mapping (hierarchy)

```typescript
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;

function walkMatrix(
  node: DataViewMatrixNode,
  levels: DataViewHierarchyLevel[],
  ancestors: DataViewMatrixNode[],
  host: powerbi.extensibility.visual.IVisualHost
): void {
  const chain = ancestors.concat(node);
  let builder = host.createSelectionIdBuilder();
  chain.forEach(n => { builder = builder.withMatrixNode(n, levels); });
  const id = builder.createSelectionId();

  // node.value, node.level, node.levelValues, node.isCollapsed, node.children
  if (node.children) {
    node.children.forEach(child => walkMatrix(child, levels, chain, host));
  }
}

const matrix = dataView.matrix;
if (matrix && matrix.rows && matrix.rows.root) {
  walkMatrix(matrix.rows.root, matrix.rows.levels, [], host);
}
```

- Build the ID through **every ancestor**, not just the leaf.
- `isCollapsed?: boolean` (undefined when the node cannot expand), `canBeExpanded?: boolean` on levels.
- Totals may be injected; a new data view after expand/collapse may drop previously visible nodes — do not assume identity continuity.

## Selection, highlights, cross-filtering

```typescript
this.selectionManager.select(point.selectionId, false); // false = replace selection

const isDimmed = point.highlighted === false; // dim, do not delete
```

Register for selection changes from elsewhere with `selectionManager.registerOnSelectCallback(ids => ...)` if the visual needs to react.

## The four formatting selectors

```typescript
// 1. static — one setting for the whole visual
selector: null

// 2. column — bound to a field by query name
selector: { metadata: "Sales" }

// 3. data point — bound to one mark
selector: point.selectionId.getSelector()

// 4. scope identity — bound to an intersection of groups
selector: { data: [categoryIdentity, seriesIdentity] as powerbi.DataViewScopeIdentity[] }
```

Same options apply whether you are using `getFormattingModel` (5.1+) or legacy `enumerateObjectInstances`. Names are case-sensitive and must match `capabilities.json`.

## Dynamic format strings (API 4.2+)

Capabilities:

```json
"objects": {
  "general": {
    "properties": {
      "formatString": { "type": { "formatting": { "formatString": true } } }
    }
  }
}
```

Read and format:

```typescript
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

const objects = categorical.values[0].objects; // one entry per value
const formatString = objects && objects[i]
  ? (objects[i] as any).general?.formatString
  : undefined;

const text: string = formatString
  ? valueFormatter.format(raw, formatString)
  : valueFormatter.format(raw, "#,0.00");
```

Honor display units and format strings from the report rather than inventing your own.

## Sorting

```json
"sorting": { "default": {} }
```
```json
"sorting": {
  "implicit": {
    "clauses": [
      { "role": "category", "direction": 1 },
      { "role": "measure", "direction": 2 }
    ]
  }
}
```
```json
"sorting": { "custom": {} }
```

Custom sort at runtime:

```typescript
const args: powerbi.CustomVisualApplyCustomSortArgs = {
  sortDescriptors: [
    { queryName: this.dataView.matrix.columns.levels[0].sources[0].queryName,
      sortDirection: powerbi.SortDirection.Ascending }
  ]
};
this.host.applyCustomSort(args);
```

`SortDirection.Ascending = 1`, `Descending = 2`. Use `queryName` from metadata, not display names.

## Safe reads and type helpers

```typescript
import { dataViewObjects, dataRoleHelper } from "powerbi-visuals-utils-dataviewutils";
import { double } from "powerbi-visuals-utils-typeutils";

const fill = dataViewObjects.getFillColor(
  dataView.metadata.objects,
  { objectName: "dataColors", propertyName: "fill" },
  "#01B8AA"
);
const hasCategory = dataRoleHelper.hasRoleInDataView(dataView, "category");
const equal = double.equalWithPrecision(a, b, 0.001);
```

`dataViewObjects.getValue<T>()`, `getObject()`, and `getFillColor()` supply defaults for missing properties — prefer them to raw property access.

## Fetch more data — aggregation mode

```typescript
if (dataView.metadata && dataView.metadata.segment) {
  const accepted = this.host.fetchMoreData(true); // true = accumulate all segments
  if (!accepted) { /* 100 MB limit reached */ }
}
```

```typescript
if (options.operationKind === powerbi.VisualDataChangeOperationKind.Create) { /* first segment */ }
if (options.operationKind === powerbi.VisualDataChangeOperationKind.Append) { /* subsequent */ }
```

Each update receives the accumulated data view. Disclose the limit in the UI.

## Fetch more data — incremental mode

```typescript
const accepted = this.host.fetchMoreData(false); // only the next window
if (options.operationKind === powerbi.VisualDataChangeOperationKind.Segment) {
  const offset = (dataView.table && dataView.table["lastMergeIndex"] !== undefined)
    ? (dataView.table["lastMergeIndex"] as number) + 1
    : 0;
  for (let i = offset; i < dataView.table!.rows.length; i++) {
    // process only new rows
  }
}
```

Consecutive windows overlap; `lastMergeIndex` tells you where the new rows begin.

## Empty / no-data state

Capabilities (API 3.6+):

```json
"supportsEmptyDataView": true,
"supportsLandingPage": true
```

Render an explicit state: no fields → instructions; fields but all null → "no data"; zeros → real values.

Sources: [Data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings), [Highlight](https://learn.microsoft.com/en-us/power-bi/developer/visuals/highlight), [Dynamic format](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dynamic-format), [Sorting](https://learn.microsoft.com/en-us/power-bi/developer/visuals/sort-options), [Data view utils](https://learn.microsoft.com/en-us/power-bi/developer/visuals/utils-dataview), [Formatting utils](https://learn.microsoft.com/en-us/power-bi/developer/visuals/utils-formatting), [Fetch more data](https://learn.microsoft.com/en-us/power-bi/developer/visuals/fetch-more-data), [visuals-api.d.ts](https://github.com/microsoft/powerbi-visuals-api/blob/main/src/visuals-api.d.ts).
