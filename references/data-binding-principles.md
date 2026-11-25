# Data binding principles

This is the judgment layer for data binding. The mechanics live in [capabilities-and-data-binding.md](capabilities-and-data-binding.md); this file explains *how to think* about the contract between Power BI and your visual so the data stays trustworthy.

## 1. The contract comes first

`dataRoles` + `dataViewMappings` + `conditions` decide what the host can send. You cannot fix a binding problem in rendering code.

- Choose the mapping from the reader's question (see [data-visualization-principles.md](data-visualization-principles.md)): `single` for one number, `categorical` for most charts, `table` for flat rows, `matrix` for hierarchy.
- In a condition, **only one role may have `min >= 1`**. An omitted role can have any number of fields.
- `for...in` includes *all* fields in a role; `bind...to` behaves the same but expects that role to be limited to one field by a condition. Use the right one deliberately.
- Multiple `dataViewMappings` produce multiple data views — usually you want one.
- Use `requiredTypes` / `preferredTypes` so incompatible fields are rejected (non-matching values become null) instead of silently misread.
- If a role is optional, design the empty state before you design the chart.

## 2. The view-model boundary

Never let a `DataView` shape leak into rendering code.

```
DataView  --transform()-->  ViewModel  --render()-->  DOM
```

- `transform()` owns every assumption about `categorical`/`table`/`matrix` shapes.
- `render()` receives plain data: labels, numbers, colors, selection IDs, viewport.
- Cache the view model. On `Resize`, reuse it; only recompute on `Data`/`Style`/`ViewMode`.
- Treat `DataView` as **read-only** — never mutate what the host gave you.
- Guard every nested access: `dataViews[0]`, `categorical`, `categories[0]`, `values[0]`. A partial or empty view is normal, not an error.
- **Table rows are not ordered.** Sort explicitly if order matters.
- Use safe helpers: `dataViewObjects.getValue/getFillColor`, `dataRoleHelper.hasRole`, `utils-typeutils` for precision comparisons.

## 3. Identity is the backbone

`ISelectionId` is the opaque identity of a data point. Build it once and carry it through the view model.

- Build with `withCategory`, `withSeries`, `withMeasure`, `withMatrixNode`, or scope identities depending on the mapping.
- Reuse the same ID for: selection/cross-filtering, tooltip `identities`, context menu, and formatting selectors.
- For matrix nodes, build IDs through **all ancestors** so the node is uniquely identified.
- Never key identity by a localized display label — labels change with language and can duplicate.
- Keep IDs stable across updates where possible; rebuilding them every update can break selection state.

## 4. Settings bind through selectors

A Format pane setting is useless until it is bound to the right scope. Four options:

| Selector | Scope | Use when |
| --- | --- | --- |
| `null` | `dataView.metadata.objects` | One setting for the whole visual |
| `{ metadata: 'QueryName' }` | A column | Setting applies to a field |
| `selectionId.getSelector()` | One data point | Per-bar/per-node color |
| `{ data: DataViewScopeIdentity[] }` | Intersection of groups | Cross-tab cell |

Mismatched selector names (case-sensitive `objectName`/`propertyName`) are the most common cause of "the control shows but nothing happens".

## 5. Cross-filtering is opt-in and must be honored

- Without `supportsHighlight`, selecting a point **filters the `values` array** — other categories disappear.
- With `supportsHighlight: true`, `values` stays complete and a parallel `highlights` array of the **same length** holds `null` for unselected points.
- `table` mapping **does not support** highlights.
- Multiple/partial selections are possible — never assume exactly one highlighted point.
- Dim non-highlighted marks rather than deleting them; deletion destroys comparison context.

## 6. Data reduction is a truth claim

Power BI silently applies `top` with `count: 1000` by default. Maximum is 30,000 rows (R visuals up to 150,000).

- Set `dataReductionAlgorithm` deliberately (`top`, `bottom`, `sample`, `window`). Know which one your visual is using.
- **Disclose truncation** in the visual when data is sampled or limited. A chart that looks complete but isn't is misleading.
- Use `fetchMoreData` when the analysis truly needs more data; understand aggregation vs incremental modes and handle the 100 MB cap.
- Never let a reduction mode change apparent ranking without telling the reader.

## 7. Metadata and format are data

- `dataView.metadata.columns` carries display names and type info — use it for axis labels and units instead of hard-coding.
- **Dynamic format strings** (API 4.2+): declare `objects.general.properties.formatString`, read per-value formats from `categorical.values[0].objects[i].general.formatString`, and format with `valueFormatter.format(value, format)` from `powerbi-visuals-utils-formattingutils`.
- Respect display units and format strings from the report; do not invent your own number formatting when the host provides one.
- Sorting: `default` (user picks field/direction), `implicit` (developer-defined clauses), `custom` + `host.applyCustomSort`. Use `powerbi.SortDirection` and `queryName` from metadata.
- `keepAllMetadataColumns` (5.1+) when you need metadata for collapsed columns.

## 8. Empty is a first-class state

- `supportsEmptyDataView` + `supportsLandingPage` (3.6+) let the visual update and show formatting even with no data bound.
- Distinguish: no fields bound → landing/instructions; fields bound but all null → "no data"; zeros → real values.
- An empty state should still look designed, not like a crash.

## 9. Test with hostile data

A binding is not verified until it survives:

- no fields, one field, many fields, multiple measures, grouped/series data;
- empty data view, all-null values, zeros, negatives, extreme outliers;
- duplicate labels, very long labels, long translated labels;
- cross-highlighting from another visual, filters, slicers, pending changes;
- segmented fetch (first and subsequent updates), matrix expand/collapse;
- resize during data change, theme switch, high contrast.

Use the official [sample report assets](https://github.com/PowerBi-Projects/PowerBI-visuals/tree/gh-pages/assets) plus your own edge-case data.

## Data contract checklist

Before writing render code, answer:

- [ ] Which mapping and why? Are `conditions` right?
- [ ] Which fields are required/optional, and what is the empty state?
- [ ] What type guards apply (`requiredTypes`/`preferredTypes`)?
- [ ] What is the view-model shape, and what stays cached across resize?
- [ ] How is each data point's identity built and reused?
- [ ] Which selector binds each Format pane setting?
- [ ] Is `supportsHighlight` needed? How are `highlights` read?
- [ ] What is the data reduction policy, and is it disclosed?
- [ ] Which format strings/units/sort order are honored?
- [ ] What test data proves the contract holds?

See [data-binding-patterns.md](data-binding-patterns.md) for implementation recipes and [examples/data-binding/](../examples/data-binding/README.md) for a copyable `viewmodel.ts`.

Sources: [Data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings), [Capabilities](https://learn.microsoft.com/en-us/power-bi/developer/visuals/capabilities), [Highlight data](https://learn.microsoft.com/en-us/power-bi/developer/visuals/highlight), [Dynamic format strings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dynamic-format), [Sorting options](https://learn.microsoft.com/en-us/power-bi/developer/visuals/sort-options), [Data view utils](https://learn.microsoft.com/en-us/power-bi/developer/visuals/utils-dataview), [Fetch more data](https://learn.microsoft.com/en-us/power-bi/developer/visuals/fetch-more-data).
