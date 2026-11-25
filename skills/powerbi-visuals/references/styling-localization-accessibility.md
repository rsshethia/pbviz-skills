# Styling, localization, and accessibility

A custom visual must look native in any report theme, work for keyboard users, and display correctly in Windows high-contrast mode. These are also common certification failure points.

## Styling (`style/visual.less`)

`visual.less` is compiled to CSS and injected into the visual's sandboxed iframe. Scope styles to a root class you create, so they apply only to your own elements. Use the root element passed to the constructor as your scoping boundary.

```less
.visual-root {
  font-family: "Segoe UI", sans-serif;

  .bar {
    transition: opacity 120ms ease;
  }
}
```

Set colors at runtime from `host.colorPalette` (inline style or a CSS variable you define) so report themes are respected.

- Use `options.viewport.width/height` for layout; support resize and very small tiles.
- Get colors from `host.colorPalette` so report themes are respected, rather than hard-coded hex values.
- The Format pane controls colors via objects/fill properties; read them from `dataView.metadata.objects`.
- Keep the visual readable on small screens — see mobile layout below.

## High contrast (API: `host.colorPalette`)

Detect and react during initialization or update:

```typescript
const palette = host.colorPalette; // ISandboxExtendedColorPalette
this.isHighContrast = palette.isHighContrast;
if (this.isHighContrast) {
  this.foreground = palette.foreground.value;
  this.background = palette.background.value;
  this.foregroundSelected = palette.foregroundSelected.value;
  this.hyperlink = palette.hyperlink.value;
}
```

Rules in high-contrast mode:

- Use **foreground** for lines, icons, text, and shape outlines/fills.
- Use **background** for backgrounds and outlined-shape fills.
- Use **foreground-selected** for active/selected elements (slicers, filters).
- Use **hyperlink** only for hyperlink text.
- If you need a secondary color, use foreground with ~40% opacity (what Power BI native visuals do) — sparingly.
- Draw thick shapes as outlines with at least 2px strokes and background fill.
- Distinguish series with different marker shapes or line dashing, not color.
- When highlighting, drop other elements to 40% opacity.

## Localization (API 1.10.0+)

Localization is **not available while debugging with the developer visual** — test with a packaged visual in a localized Power BI Desktop or service.

Steps:

1. Switch Power BI to another display language (localized Desktop install or Settings → General → Display language in the service).
2. Read `options.host.locale` (language of the installed Desktop). The visual is recreated when the language changes.
3. Add `displayNameKey` beside `displayName` on each `dataRoles` entry (and use keys for object/format labels):

```json
{ "displayName": "Category Data", "displayNameKey": "VisualCategoryDataNameKey1",
  "name": "category", "kind": "Grouping" }
```

4. Add a `stringResources` folder with one subfolder per locale, each containing `resources.resjson`:

```
stringResources/
├── ru-RU/resources.resjson
└── he-IL/resources.resjson
```

```json
{ "Role_Legend": "Обозначения", "Role_task": "Задача" }
```

5. Create a localization manager and translate:

```typescript
private localizationManager: powerbi.extensibility.visual.ILocalizationManager;
this.localizationManager = host.createLocalizationManager();
this.localizationManager.getDisplayName("Role_Legend");
```

6. For API 5.1+ formatting model, localize card/slice labels: `displayName: this.localizationManager.getDisplayName("Font_Color_DisplayNameKey")`.

Register the folders in `pbiviz.json`'s `stringResources` array.

## Keyboard accessibility

Basic behavior exists for every visual: **Esc** leaves the visual; **Tab** moves through tabbable elements and then out. Enhanced behavior requires API 2.1.0+:

```json
"supportsKeyboardFocus": true
```

This adds: **Enter** on the visual container moves focus inside; **Tab** cycles inside until **Esc**. Not available for image visuals.

Implementation notes:

- `div` and `span` are not focusable by default — add `tabindex="0"` and appropriate `role`/`aria-label` to interactive elements.
- After Enter, programmatically focus the first element if that is the expected starting point.
- Keep focus visible (do not remove outlines).
- Provide alternative text / accessible names for meaningful graphics.

## Safe DOM handling

Certification and security both require safe DOM use:

- Use `textContent` or d3 `.text()` for user data. **Never** use `innerHTML` or `d3.html()` with data/query strings.
- Sanitize any HTML you intentionally inject; prefer building elements with `document.createElement`.
- Avoid `eval()`, `Function()`, and dynamically scheduled user-provided functions.
- Avoid unhandled exceptions for any input data — show a friendly empty/error state instead.

## Mobile layout

Power BI has a mobile report layout. A visual should:

- Render usefully at small widths; use `viewport` rather than fixed sizes.
- Avoid tiny touch targets; keep interactive elements large enough for touch.
- Support long-press context menu behavior (the context menu is invoked on touch long-press).
- Test in Desktop's mobile layout view before publishing.

Sources: [High contrast support](https://learn.microsoft.com/en-us/power-bi/developer/visuals/high-contrast-support), [Localization](https://learn.microsoft.com/en-us/power-bi/developer/visuals/localization), [Keyboard navigation](https://learn.microsoft.com/en-us/power-bi/developer/visuals/supportskeyboardfocus-feature), [Guidelines](https://learn.microsoft.com/en-us/power-bi/developer/visuals/guidelines-powerbi-visuals).
