# Reference map, glossary, and pitfalls

## Official documentation (source of truth)

Base: <https://learn.microsoft.com/en-us/power-bi/developer/visuals/>

| Topic | Page |
| --- | --- |
| Project structure | `visual-project-structure` |
| Create your first visual (step by step) | `develop-circle-card` |
| Visual API / `IVisual` lifecycle | `visual-api` |
| Capabilities and properties | `capabilities` |
| Data view mappings | `dataview-mappings` |
| Objects and properties | `objects-properties` |
| Formatting model / format pane | `format-pane-general`, `format-pane-example`, `utils-formatting-model` |
| Selection API | `selection-api` |
| Tooltips | `add-tooltips` |
| Context menu | `context-menu` |
| Drill-down | `drill-down-support` |
| Filtering | `filter-api` |
| Advanced filter API | (sample slicer repo docs) |
| Fetch more data | `fetch-more-data` |
| Sorting | `sort-options` |
| Localization | `localization` |
| High contrast | `high-contrast-support` |
| Keyboard focus | `supportskeyboardfocus-feature` |
| Sync slicers | `enable-sync-slicers` |
| Advanced edit mode | `advanced-edit-mode` |
| Landing page | `landing-page` |
| File download | `file-download-api` |
| Local storage | `local-storage` |
| Display warning icon | `visual-display-warning-icon` |
| Rendering events | `event-service` |
| Certification | `power-bi-custom-visuals-certified` |
| Submission testing | `submission-testing` |
| Publishing to AppSource | `office-store` |
| Licensing API | `licensing-api` |
| Publishing guidelines | `guidelines-powerbi-visuals` |

Each page can be fetched as clean markdown with `?accept=text/markdown`, e.g. `https://learn.microsoft.com/en-us/power-bi/developer/visuals/capabilities?accept=text/markdown`.

## Repositories and samples

| Resource | Use |
| --- | --- |
| [microsoft/powerbi-visuals-api](https://github.com/microsoft/powerbi-visuals-api) | API `.d.ts` definitions and capabilities schema |
| [microsoft/PowerBI-visuals-sampleBarChart](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart) | Canonical sample: tooltips, selection, colors, high contrast, localization |
| [microsoft/powerbi-visuals-sampleslicer](https://github.com/Microsoft/powerbi-visuals-sampleslicer) | Slicer, advanced filter API, bookmarks, sync |
| [PowerBi-Projects/PowerBI-visuals](https://github.com/PowerBi-Projects/PowerBI-visuals) | Older community docs — **deprecated**, use <https://microsoft.github.io/PowerBI-visuals/> |
| [microsoft/powerbi-visuals-tools](https://github.com/microsoft/powerbi-visuals-tools) | `pbiviz` CLI |
| [microsoft/powerbi-visuals-utils](https://github.com/microsoft/powerbi-visuals-utils) | Helper packages |

## Glossary

- **Host** — Power BI itself; supplies data and services to the visual.
- **`pbiviz`** — CLI that scaffolds, builds, and packages custom visuals.
- **`IVisual`** — the interface your main class implements.
- **Capabilities** — `capabilities.json`: the visual's declaration of data, objects, and features.
- **Data role** — a field bucket in the Fields well (`Grouping`, `Measure`, `GroupingOrMeasure`).
- **Data view** — the data structure delivered to `update()` (`categorical`, `table`, `matrix`, `single`, `tree`).
- **Selection ID** — opaque identity for a data point, used for selection, tooltips, and context menus.
- **Formatting model** — 5.1+ declarative structure (cards/groups/slices) for the Format pane.
- **Object / property** — a persisted format setting declared in capabilities and bound via selectors.
- **Selector** — decides where a property value is stored: static, column, data point, or scope identity.
- **Highlights** — cross-highlight values alongside the base values.
- **IAP** — "additional purchase may be required"; a free visual with paid advanced features.
- **`.pbiviz`** — the packaged visual artifact uploaded to AppSource.
- **`.pbix`** — Power BI report file; a working offline sample is required for submission.

## Common pitfalls and invariants

1. **Class name mismatch** — `visualClassName` in `pbiviz.json` must exactly match the exported class. Otherwise the visual never starts.
2. **Feature used before its API version** — check `apiVersion` for `privileges` (4.6.0), `getFormattingModel` (5.1), licensing (4.7), tooltips enhancements (3.8.3), etc.
3. **Undeclared fields/controls** — code cannot create a Fields well field or Format pane control without `capabilities.json`.
4. **Case-sensitive descriptor names** — formatting model `objectName`/`propertyName` must match capabilities exactly.
5. **Assuming data view shape** — guard every nested property; an unmapped or empty `dataView` is normal. Table rows are not ordered.
6. **Missing `privileges` on 4.6.0+** — packaging/submission fails; include `"privileges": []` if none are needed.
7. **Local storage / web access without privileges** — silently blocked unless declared (and tenant admin allows it).
8. **`innerHTML`/`d3.html()` with data** — XSS risk and certification rejection; use `text()`/`textContent`.
9. **External calls in a certified visual** — `fetch`/`XMLHttpRequest`/WebSockets are forbidden; use host services or keep the visual uncertified.
10. **Context menu ignored** — all AppSource visuals must support both modes; pass `dataRoles` for drilldown/expandCollapse.
11. **Tooltips without selection IDs** — report page tooltips cannot resolve the hovered data point.
12. **Hard-coded sizes/colors** — breaks resize, themes, and high contrast; use `viewport` and `colorPalette`.
13. **Assuming `destroy()` always runs** — the host often just removes the iframe; do not depend on it for critical cleanup.
14. **GUID changes on update** — breaks existing reports; keep the GUID stable across versions.
15. **Localization in the developer visual** — not supported; test a packaged visual instead.
16. **Version with three digits** — must be four (`x.x.x.x`).
17. **`externalJS` in tools 3.x+** — unsupported; use npm dependencies.

## When stuck

- Inspect `options.dataViews[0]` in the console before changing mapping code.
- Compare your config against the capabilities schema and the sample visual repo.
- Check the API version table in [setup-and-project-structure.md](setup-and-project-structure.md#version-gating-quick-reference).
- Search the [Power BI Developer Forum](https://community.powerbi.com/t5/Developer/bd-p/Developer) or the CLI's GitHub issues.
