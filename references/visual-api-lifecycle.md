# Visual API and lifecycle

Every visual is **exactly one class implementing `IVisual`**. Its name must match `visualClassName` in `pbiviz.json`. The host constructs it, calls `update()` on every data or environment change, asks for the formatting model when the Format pane opens or a property changes, and may call `destroy()` on unload.

```typescript
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualObjectInstanceEnumeration = powerbi.extensibility.visual.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.extensibility.visual.EnumerateVisualObjectInstancesOptions;
import DataView = powerbi.DataView;

export class Visual implements IVisual {
  constructor(options: VisualConstructorOptions) { /* one-time setup */ }

  public update(options: VisualUpdateOptions): void { /* re-render */ }

  public getFormattingModel(): powerbi.visuals.FormattingModel { /* 5.1+ */ }

  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    /* deprecated from 5.1 */
  }

  public destroy(): void { /* cleanup (optional) */ }
}
```

## `constructor(options: VisualConstructorOptions)`

Called once when the visual is instantiated. Create the DOM skeleton, selection manager, tooltip wrapper, localization manager, and other long-lived services here.

`VisualConstructorOptions`:

- `element: HTMLElement` — the root DOM element owned by the visual; append everything here.
- `host: IVisualHost` — the bridge to Power BI services.

Common `IVisualHost` services:

| Service | Use |
| --- | --- |
| `createSelectionIdBuilder()` | Build `ISelectionId` for data points (category/series/matrix node/scope). |
| `createSelectionManager()` | Selection, cross-highlight, context menu. |
| `tooltipService` | `enabled()`, `show()`, `move()`, `hide()`. |
| `colorPalette` | Theme colors plus high-contrast colors. |
| `createLocalizationManager()` | `getDisplayName(key)` for localized strings. |
| `applyJsonFilter()` | Filter API. |
| `persistProperties()` | Persist settings with the visual definition. |
| `storageService` / `storageV2Service` | Local storage. |
| `downloadService` | File download results. |
| `eventService` | Rendering events (required for certification). |
| `licenseManager` | Licensing API (4.7+). |
| `drill` | Drill-up/drill-down. |
| `launchUrl` | Open URL in a new tab. |
| `openModalDialog()` | Host-provided dialog. |
| `webAccessService` | Remote-resource permission status. |
| `acquireAADTokenService` / `authenticationService` | Microsoft Entra ID tokens. |
| `fetchMoreData()` | Load large datasets in segments. |
| `refreshHostData()`, `hostCapabilities`, `hostEnv`, `instanceId`, `locale`, `telemetry`, `switchFocusModeState`, `displayWarningIcon`, `applyCustomSort` | Additional host facilities. |

Interfaces are updated per API version — check [visuals-api.d.ts](https://github.com/microsoft/powerbi-visuals-api/blob/main/src/visuals-api.d.ts) for the exact current shape.

## `update(options: VisualUpdateOptions)`

Called whenever data or the host environment changes. Always guard against empty/partial data views and re-render idempotently (the same DOM may be updated many times).

`VisualUpdateOptions`:

| Property | Meaning |
| --- | --- |
| `viewport: IViewport` | Available width/height — render to this, not to fixed pixels. |
| `dataViews: DataView[]` | Usually use `dataViews[0]`; contains `metadata`, `categorical`, `table`, `matrix`, `single`, `tree`. |
| `type: VisualUpdateType` | Flags: `Data`, `Resize`, `ViewMode`, `Style`, `ResizeEnd`. |
| `viewMode: ViewMode` | `View`, `Edit`, `InFocusEdit`. |
| `editMode: EditMode` | `Default` or `Advanced`; render advanced UI only when `Advanced` and `advancedEditModeSupport` is enabled. |
| `operationKind?` | `Create` (first segment) or `Append` (subsequent) for `fetchMoreData`. |
| `jsonFilters?` | Active `IFilter[]`. |
| `isInFocus?` | Whether focus mode is active. |
| `pendingChanges?` | Local filter changes not yet applied (slicers with "Apply all"). |

Typical shape:

```typescript
public update(options: VisualUpdateOptions): void {
  const dataView: DataView = options.dataViews && options.dataViews[0];
  if (!dataView || !dataView.categorical || !dataView.categorical.categories ||
      !dataView.categorical.categories[0] || !dataView.categorical.values) {
    // render an empty state / placeholder
    return;
  }
  const width = options.viewport.width;
  const height = options.viewport.height;
  // recalc scales, join data to DOM with d3, apply theme colors, rebind events
}
```

Rules of thumb:

- Mutate/clear existing DOM elements rather than blindly appending duplicates.
- Read formatting values from `dataView.metadata.objects[<objectName>][<propertyName>]` (or the settings helpers).
- Apply `options.viewport` on every update to support resize.
- Do not throw; guard nulls. An unhandled exception fails certification and shows an error icon to users.

## Formatting model (`getFormattingModel`, API 5.1+)

Called each time the Format/Analytics pane opens or a property is edited. Returns a `FormattingModel` hierarchy of **cards → groups → slices** (properties). `displayName` and `description` live here (they are deprecated in `capabilities.json` from 5.1).

```typescript
public getFormattingModel(): powerbi.visuals.FormattingModel {
  return {
    cards: [{
      displayName: this.localization.getDisplayName("Card_Label"),
      uid: "card_uid",
      groups: [{
        uid: "group_uid",
        slices: [{
          uid: "fill_color_uid",
          displayName: "Fill color",
          control: {
            type: powerbi.visuals.FormattingComponent.ColorPicker,
            properties: {
              descriptor: {
                objectName: "myCustomObject",   // must match capabilities.json
                propertyName: "fill",
                selector: null                  // optional
              },
              value: { value: "#000000" }
            }
          }
        }]
      }]
    }]
  };
}
```

Use `powerbi.visuals.FormattingComponent` for control types (e.g. `ColorPicker`, `TextInput`, `ToggleSwitch`, `Slider`, `DropDown`). The `descriptor.selector` decides where the value is stored in the data view:

| Selector | Binding |
| --- | --- |
| `null` | Static: `dataView.metadata.objects` |
| `{ metadata: 'QueryName' }` | Column with matching query name |
| `selectionId.getSelector()` | The specific data point |
| `{ data: <DataViewScopeIdentity[]>identities }` | Intersection of group values |

The `powerbi-visuals-utils-formattingmodel` package simplifies constructing models and reading values.

## Legacy objects (`enumerateObjectInstances`, deprecated from 5.1)

For older API versions, implement `enumerateObjectInstances` to populate the Format pane and bind objects:

```typescript
public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
  const objectName = options.objectName;
  const enumeration: powerbi.VisualObjectInstance[] = [];
  switch (objectName) {
    case "customColor":
      enumeration.push({
        objectName,
        displayName: "Custom Color",
        properties: { fill: { solid: { color: this.settings.fillColor } } },
        selector: null
      });
      break;
  }
  return enumeration;
}
```

Same four selector options apply. New visuals on API 5.1+ should use `getFormattingModel`.

## `destroy()`

Called when the visual is unloaded; remove listeners/timers there. Note the host usually removes the whole iframe, so `destroy()` may not run — prefer not to rely on it for essential cleanup.

## Rendering and utilities

- Use `d3-selection` data joins (`selectAll().data().join()`) keyed by `selectionId` for stable updates.
- Use `powerbi-visuals-utils-*` for colors, labels, tooltips, formatting model, type validation, and event services.
- Use `textContent` / `text()` for user-provided strings. Never pass data into `innerHTML` or `d3.html()` — certification rejects it and it is an XSS risk.
- Support the Rendering Events API (`host.eventService`) so the host knows when rendering starts/finishes; certified visuals must support it.

For the data side of `update()` — guarded transforms, identity, highlights, and segmented fetch — see [data-binding-patterns.md](data-binding-patterns.md) and [data-binding-principles.md](data-binding-principles.md).

Sources: [Visual API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-api), [Objects and properties](https://learn.microsoft.com/en-us/power-bi/developer/visuals/objects-properties), [powerbi-visuals-api on GitHub](https://github.com/microsoft/powerbi-visuals-api).
