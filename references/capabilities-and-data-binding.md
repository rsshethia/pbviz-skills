# Capabilities and data binding

`capabilities.json` is the host contract. It tells Power BI what data the visual accepts, which fields appear in the Fields well, which controls appear in the Format pane, and which optional features are enabled. Code cannot create a data role or a format control that is not declared here.

> From API **4.6.0**, **all properties on the capabilities model are optional except `privileges`, which is required**. Earlier versions omit it.

```jsonc
{
  "privileges": [ ... ],
  "dataRoles": [ ... ],
  "dataViewMappings": [ ... ],
  "objects": { ... },
  "supportsHighlight": true,
  "advancedEditModeSupport": 0,
  "sorting": { ... }
}
```

Full schema: [schema.capabilities.json](https://github.com/microsoft/powerbi-visuals-api/blob/master/schema.capabilities.json).

## Root objects

| Key | Meaning |
| --- | --- |
| `privileges` | Required (4.6.0+). Special permissions: web access, export/download, local storage. |
| `dataRoles` | Fields that appear in the Fields well; user drags data into them. |
| `dataViewMappings` | How roles map into a `DataView`; each valid mapping produces a data view. |
| `objects` | Format-pane objects and their properties. |
| `supportsHighlight` | Enables cross-highlighting data (the `highlights` array on values). |
| `sorting` | Custom sort options. |
| `drilldown` | Roles that support drill-down. |
| `expandCollapse` | Matrix row expansion (4.1.0+). |
| `tooltips` | Report page / modern tooltip support. |
| `supportsKeyboardFocus` | Enhanced keyboard navigation (2.1.0+). |
| `supportsSynchronizingFilterState` | Sync slicers. |
| `advancedEditModeSupport` | Advanced edit mode (0/1/2). |
| `supportsLandingPage`, `supportsEmptyDataView` | Landing page behavior. |
| `supportsMultiVisualSelection` | Multi-visual selection. |
| `subtotals` | Total/subtotal API. |
| `keepAllMetadataColumns` | 5.1.0+; receive metadata for all columns, not just projected ones. |
| `migration` | Identity filter API migration. |

## `privileges`

Each entry has `name` (string), `essential` (boolean), and optional `parameters` (string array).

```json
"privileges": [
  { "name": "WebAccess", "essential": true, "parameters": ["https://*.microsoft.com", "http://example.com"] },
  { "name": "ExportContent", "essential": false },
  { "name": "LocalStorage", "essential": true }
]
```

- **WebAccess** — allowed external URLs; wildcards can cover subdomains.
- **ExportContent** — enables export to `.txt`, `.csv`, `.json`, `.tmplt`, `.xml`, `.pdf`, `.xlsx`.
- **LocalStorage** — browser local storage.
- No privileges: `"privileges": []`.
- Granting a privilege in the visual is not enough: tenant admin settings can still block it.
- **Certified visuals must not access external services** — keep WebAccess empty/omitted for certification.

## `dataRoles`

Array of role objects; these become the Fields well fields.

| Property | Meaning |
| --- | --- |
| `name` | Internal name, must be unique; used in mappings and code. |
| `displayName` | Label shown to users. |
| `kind` | `Grouping`, `Measure`, or `GroupingOrMeasure`. |
| `description` | Optional help text. |
| `requiredTypes` | Allowed data types; non-matching values become null. |
| `preferredTypes` | Preferred data types. |
| `displayNameKey` | Localization key for `displayName`. |

Valid types for `requiredTypes`/`preferredTypes`: `bool`, `integer`, `numeric`, `text`, `geography`.

```json
"dataRoles": [
  { "displayName": "Category", "name": "category", "kind": "Grouping",
    "requiredTypes": [{ "text": true }, { "numeric": true }],
    "preferredTypes": [{ "text": true }] },
  { "displayName": "Values", "name": "measure", "kind": "Measure",
    "requiredTypes": [{ "integer": true }, { "numeric": true }] }
]
```

## `dataViewMappings`

Mapping keys: `conditions`, `categorical`, `single`, `table`, `matrix`. Power BI only produces a mapping of a given type if it is declared here — e.g. a declared `categorical` mapping does not mean `table` will be populated.

### Conditions

Min/max number of fields bound to a role. If a role is omitted from a condition, it can have any number of fields. Multiple conditions are OR-ed. **Only one role per condition may have `min >= 1`.**

```json
"conditions": [
  { "category": { "min": 1, "max": 1 }, "measure": { "min": 0, "max": 2 } },
  { "category": { "min": 2, "max": 2 }, "measure": { "min": 0, "max": 1 } }
]
```

### Single mapping

One measure reduced to a single number (sum if numeric, distinct count otherwise). Cannot be combined with other mappings; add a condition with `max: 1` or no view is generated when a second field is assigned.

```json
"dataViewMappings": [{ "conditions": [{ "Y": { "max": 1 } }], "single": { "role": "Y" } }]
```

Read as `options.dataViews[0].single.value`.

### Categorical mapping

Most common for charts. `for...in` includes **all** fields in a role; `bind...to` behaves the same but expects a condition restricting the role to a **single** field.

```json
"dataViewMappings": [{
  "categorical": {
    "categories": { "for": { "in": "category" } },
    "values": { "select": [{ "bind": { "to": "measure" } }] }
  }
}]
```

Group values by a role (series) and build hierarchies for drill-down:

```json
"values": {
  "group": { "by": "series", "select": [{ "for": { "in": "measure" } }] }
}
```

Read `dataView.categorical.categories[0].values`, `dataView.categorical.values.grouped()`, `values[i].values[j]`. Each grouped value column includes `source`, `values`, `identity`, and may carry `highlights`.

### Table mapping

A flat list of rows; numeric columns can be aggregated by the user. **Do not assume row order.**

```json
"dataViewMappings": [{
  "table": {
    "rows": { "select": [{ "for": { "in": "column" } }, { "for": { "in": "value" } }] }
  }
}]
```

Read `dataView.table.columns` (metadata) and `dataView.table.rows` (array of `PrimitiveValue[]`).

### Matrix mapping

Hierarchical rows/columns with values at the leaves.

```json
"dataViewMappings": [{
  "matrix": {
    "rows": { "for": { "in": "Category" } },
    "columns": { "for": { "in": "Column" } },
    "values": { "select": [{ "for": { "in": "Measure" } }] }
  }
}]
```

`dataView.matrix.rows.root.children[]` is a tree of `DataViewTreeNode` (`level`, `levelValues`, `value`, `identity`, `children`, `values`). `columns.root.children[]` holds column headers.

### Expand/collapse (4.1.0+, whole level 4.2.0+)

```json
"expandCollapse": {
  "roles": ["Rows"],
  "addDataViewFlags": { "defaultValue": true }
},
"drilldown": { "roles": ["Rows"] }
```

- `DataViewTreeNode.isCollapsed?: boolean` — undefined when the node cannot expand (e.g. subtotal).
- `DataViewHierarchyLevel.canBeExpanded?: boolean`.
- `ISelectionManager.toggleExpandCollapse(selectionId, entireLevel?)`.
- `showContextMenu(selectionId, position, dataRoles?)` — pass `dataRoles` when the visual supports drilldown/expandCollapse.
- Build node selection IDs with `host.createSelectionIdBuilder().withMatrixNode(node, levels)` for each ancestor.
- Limitations: only row headers expand (not columns); totals may appear even if not requested; a new data view may drop previously visible nodes.

### `keepAllMetadataColumns` (5.1.0+)

```json
"keepAllMetadataColumns": {
  "type": "boolean",
  "description": "Receive all metadata columns regardless of active projections"
}
```

`true` includes metadata from collapsed columns.

## Data reduction

Default: `top` with `count: 1000`. Maximum count: **30,000** (R visuals up to 150,000). Algorithms:

- `top` — first *count* values.
- `bottom` — last *count* values.
- `sample` — first and last plus evenly spaced values.
- `window` — one window of *count* values (currently equivalent to `top`; used with `fetchMoreData`).

```json
"dataReductionAlgorithm": { "top": { "count": 1000 } }
```

Place it under `categorical.categories`, under `categorical.values.group`, under `table.rows`, or under `matrix.rows`/`matrix.columns`.

## `objects` (format pane properties)

```json
"objects": {
  "myCustomObject": {
    "properties": {
      "show": { "type": { "bool": true } },
      "fill": { "type": { "fill": { "solid": { "color": true } } } }
    }
  }
}
```

- `show` is a special boolean property that renders an on/off toggle for the object.
- **ValueTypeDescriptor** (`text`, `numeric`, `integer`, `bool`) — static/primitive values.
- **StructuralTypeDescriptor** (e.g. `fill`) — used for data-bound object values; also `fillRule`, `gradient`.
- `displayName`/`description` on capabilities objects are **deprecated from 5.1**; supply localized labels in the formatting model instead.
- A `fillRule` can substitute a `fill` color based on a data role (e.g. color saturation):
  `"rule": { "inputRole": "Gradient", "output": { "property": "fill", "selector": ["Category"] } }`.

Every formatting model property descriptor must reference an object/property pair defined here with exactly matching, case-sensitive names.

## other feature flags

- `tooltips`: `{ "supportedTypes": { "default": true, "canvas": true }, "roles": ["tooltips"], "supportEnhancedTooltips": true }`
- `supportsHighlight`: true to get `highlights` arrays for cross-filtering.
- `sorting`: custom sort definitions.
- `supportsSynchronizingFilterState`: slicer sync.
- `advancedEditModeSupport`: 0/1/2, used with `editMode` in `VisualUpdateOptions`.

Sources: [Capabilities and properties](https://learn.microsoft.com/en-us/power-bi/developer/visuals/capabilities), [Data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings), [Objects and properties](https://learn.microsoft.com/en-us/power-bi/developer/visuals/objects-properties).
