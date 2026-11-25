# UI theming, color, and visual identity

A custom visual should look like it belongs to the report. That means colors, fonts, and surfaces come from the report theme at runtime — not from constants in your LESS file.

## Where theme values come from

`host.colorPalette` (`IColorPalette` / `ISandboxExtendedColorPalette`) is the source of truth:

```typescript
const palette = options.host.colorPalette;
const themeColor: string = palette.getColor("myCategory").value; // stable per key
```

- `getColor(key)` gives a **stable color per key**, so the same category keeps the same color across updates and other visuals.
- The palette also exposes high-contrast colors (`isHighContrast`, `foreground`, `background`, `foregroundSelected`, `hyperlink`) — see [styling-localization-accessibility.md](styling-localization-accessibility.md).
- Use `powerbi-visuals-utils-colorutils` for theme colors and conversion:

```typescript
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

const colorHelper = new ColorHelper(
  this.colorPalette,
  { objectName: "dataColors", propertyName: "fill" }, // must match capabilities.json
  "#01B8AA"                                          // default fallback
);
const color = colorHelper.getColorForSeriesValue(grouping.objects, grouping.name);
colorHelper.getThemeColor();            // theme color by semantic name
colorHelper.getHighContrastColor();     // high-contrast-aware color
```

`ColorHelper` respects a user-set fill from the Format pane (`getColorForSeriesValue` / `getColorForMeasure` read the bound object first, then fall back to the theme palette). That is the correct precedence: **user override → theme color → your default**.

## Recommended color pipeline

1. Declare a `dataColors` object with a `fill` property in `capabilities.json`.
2. Build the Format pane control for it with the formatting model (`ColorPicker`, or a theme-aware color picker).
3. Resolve each data point's color with `ColorHelper` (or `colorPalette.getColor(key)` if you have no user override).
4. Read it in `update()` into your view model; apply it as `fill`/`stroke` on marks.
5. In high-contrast mode, ignore categorical colors and use the four allowed high-contrast colors (or `getHighContrastColor`).

## Conditional formatting

For rules like "color by measure value", declare a `fillRule` in capabilities and let the host substitute the `fill` property:

```json
"fillRule": {
  "type": { "fillRule": {} },
  "rule": {
    "inputRole": "Gradient",
    "output": { "property": "fill", "selector": ["Category"] }
  }
}
```

The `inputRole` names the data role that triggers the substitution; `output.property` names the fill to replace. See [Objects and properties](https://learn.microsoft.com/en-us/power-bi/developer/visuals/objects-properties) and [Conditional formatting](https://learn.microsoft.com/en-us/power-bi/developer/visuals/conditional-format).

## Palette recipes (design guidance, not API)

- **Categorical**: use theme colors via `getColor(key)`. If you supply a fallback set, pick colors with clearly different lightness, not just hue.
- **Sequential**: one hue, increasing lightness/darkness for magnitude.
- **Diverging**: two hues meeting at a neutral midpoint; keep the midpoint visually quiet.
- **Status**: use shape/icon plus color so meaning survives grayscale and color-vision deficiency.
- **Color-blind safety** (WCAG-oriented): avoid red/green as the only distinction; check contrast with a simulator. Aim for ≥ **4.5:1** for normal text and ≥ **3:1** for large text and UI graphics.

## Typography and font controls

- Prefer the report's font. `dataView.metadata.objects` may carry `fontFamily`, `fontSize`, `fontBold`, `fontItalic`, `fontUnderline` from a `FontControl` slice.
- Default to a system font stack (e.g. `"Segoe UI", system-ui, sans-serif`). **Do not load web fonts from a CDN** — external requests fail certification and may be blocked in the sandbox.
- Keep a small type scale (e.g. 12/14/18/24) and use weight/spacing, not many sizes, to establish hierarchy.
- Truncate long labels with ellipsis and expose the full value in a tooltip rather than wrapping unpredictably.

## Theme-aware CSS structure

Keep visual constants in LESS, runtime values in inline styles or CSS variables you define yourself:

```less
.pbiviz-root {
  font-family: "Segoe UI", system-ui, sans-serif;
  .mark { transition: opacity 120ms ease; }
  .label { font-size: 12px; }
}
```

```typescript
svg.style("--pbiviz-accent", accentFromPalette); // your own variable, set at runtime
```

## Anti-patterns

- Hard-coded hex colors that ignore the report theme.
- External fonts, icon fonts, CSS, or images from a CDN.
- `innerHTML` to inject colored markup with data — XSS risk and certification rejection.
- Encoding meaning only in color; use labels, shapes, or patterns too.
- Reusing a theme color for a semantic meaning that conflicts with the report (e.g. always green = good when the theme uses green for a category).

Sources: [Add colors to your visual](https://learn.microsoft.com/en-us/power-bi/developer/visuals/add-colors-power-bi-visual), [Color utils](https://learn.microsoft.com/en-us/power-bi/developer/visuals/utils-color), [High contrast support](https://learn.microsoft.com/en-us/power-bi/developer/visuals/high-contrast-support), [Conditional formatting](https://learn.microsoft.com/en-us/power-bi/developer/visuals/conditional-format), [Format pane example](https://learn.microsoft.com/en-us/power-bi/developer/visuals/format-pane-example).
