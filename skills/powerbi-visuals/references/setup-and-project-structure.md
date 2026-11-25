# Setup and project structure

## Prerequisites

- **Node.js + npm** (LTS recommended).
- **`powerbi-visuals-tools`** — the `pbiviz` CLI, installed globally: `npm install -g powerbi-visuals-tools`. Verify with `pbiviz --version`.
- **Power BI Desktop** (Windows) and a browser for the developer visual; or Power BI service with Developer mode enabled for a published report.
- **SSL certificate** for `https://localhost:8080` — the host iframe is HTTPS, so the dev server must be too. The CLI can create and install one; see the certificate setup docs.

## CLI workflow

| Command | Purpose |
| --- | --- |
| `pbiviz new <name>` | Scaffold a new visual folder |
| `pbiviz start` | Dev server with live reload (default `https://localhost:8080`) |
| `pbiviz package` | Build `dist/<name>.pbiviz` for import/submission |
| `pbiviz package --certification-audit` | Detect unsafe `fetch`/`XMLHttpRequest`/`eval` calls (tools 6.1.0+) |
| `pbiviz package --certification-fix` | Auto-fix unsafe calls in third-party libs (tools 6.1.0+); retest thoroughly |
| `pbiviz --install-cert` | Trust the local dev certificate (see docs for OS-specific steps) |

Enable **Developer mode** in Power BI Desktop (Options and settings → Options → Preview features → Developer mode), then add the **Developer visual** to a report and point it at the local server. Browser DevTools on the iframe is the primary debugging surface.

## Generated project tree

```
project
├── .vscode
│   ├── launch.json          # VS Code debug config
│   └── settings.json        # workspace settings
├── assets
│   └── icon.png             # 20 x 20 PNG shown in the Visualizations pane
├── node_modules
├── src
│   ├── settings.ts          # formatting property classes / formatting model helpers
│   └── visual.ts            # main source; class implementing IVisual
├── style
│   └── visual.less          # styles compiled and injected into the visual iframe
├── capabilities.json        # declares data roles, mappings, objects, feature flags
├── package-lock.json
├── package.json             # deps, scripts, author metadata
├── pbiviz.json              # visual metadata (name, guid, apiVersion, paths, author)
├── tsconfig.json            # TypeScript config; must point at the main visual .ts file
└── tslint.json              # legacy lint config (newer projects use eslint)
```

### File responsibilities

- **`.vscode/`** — editor workspace settings only; not packaged into the visual.
- **`assets/icon.png`** — must be a **PNG, 20×20 px**. This is the icon in the Visualizations pane, not the 300×300 marketplace logo.
- **`src/visual.ts`** — the visual's `IVisual` implementation. Exactly one class implements `IVisual`, and its class name must equal `visualClassName` in `pbiviz.json`.
- **`src/settings.ts`** — classes/helpers for formatting properties: defaults, getters/setters from `dataView.metadata.objects`, and (5.1+) building the formatting model.
- **`style/visual.less`** — LESS styles compiled to CSS and scoped to the visual's sandboxed DOM.
- **`capabilities.json`** — the contract with the host: `privileges`, `dataRoles`, `dataViewMappings`, `objects`, and optional feature flags. See [capabilities-and-data-binding.md](capabilities-and-data-binding.md).
- **`package.json`** / **`package-lock.json`** — npm dependencies and scripts. Certification requires `typescript`, `eslint`, and `eslint-plugin-powerbi-visuals`, plus an `"eslint": "npx eslint . --ext .js,.jsx,.ts,.tsx"` script.
- **`tsconfig.json`** — must contain the path to the `*.ts` file holding the main visual class, matching `visualClassName` in `pbiviz.json`.
- **`tslint.json`** — legacy TSLint config; newer projects use ESLint with `eslint-plugin-powerbi-visuals`.

## `pbiviz.json` metadata (annotated)

```jsonc
{
  "visual": {
    "name": "myVisual",                 // internal name
    "displayName": "My Visual",         // shown in the Visualizations pane
    "guid": "myVisual23D8B823CF134D3AA7CC0A5D63B20B7F", // unique; never change after publishing
    "visualClassName": "Visual",        // MUST match the class in src/visual.ts
    "version": "1.0.0.0",               // four digits: x.x.x.x
    "description": "",                  // required before packaging for AppSource
    "supportUrl": "",                   // https URL, required for AppSource
    "gitHubUrl": ""
  },
  "apiVersion": "5.1.0",                // gates which APIs/features are available
  "author": { "name": "", "email": "" },// required before packaging
  "assets": { "icon": "assets/icon.png" },
  "externalJS": null,                   // unsupported from tools 3.x.x onward
  "style": "style/visual.less",
  "capabilities": "capabilities.json",
  "dependencies": null,                 // R-package info for R visuals
  "stringResources": []                 // locales for localization
}
```

Notes:

- Version numbers must contain **four** digits; if you have three, append `.0`.
- `externalJS` was dropped in tools 3.x.x — add third-party libraries via npm imports instead.
- For localization, add locale entries to `stringResources` and create `stringResources/<locale>/resources.resjson` files.
- The `apiVersion` is the single most important compatibility lever: it decides whether `privileges` is mandatory (4.6.0+), whether `getFormattingModel` exists (5.1+), whether licensing is available (4.7+), and so on.

## Dependency conventions

- Import types from `powerbi-visuals-api` (`import powerbi from "powerbi-visuals-api";` plus type aliases such as `DataView`, `VisualUpdateOptions`).
- Use `powerbi-visuals-utils-*` packages for repeated work: `utils-datalabel`, `utils-formatting-model`, `utils-color`, `utils-interactivity`, `utils-tooltip`, `utils-type-validator`, `utils-event-service`.
- Typical rendering uses **d3** (`d3-selection`, `d3-scale`, `d3-shape`, etc.) against the DOM element supplied in `VisualConstructorOptions.element`.

## Version-gating quick reference

| Feature | Minimum `apiVersion` |
| --- | --- |
| Keyboard focus (`supportsKeyboardFocus`) | 2.1.0 |
| Context menu (`showContextMenu`) | 2.2.0 |
| Localization manager | 1.10.0 |
| Modern/enhanced tooltips | 3.8.3 |
| `fetchMoreData` | 3.4.0 (dynamic customization 5.2.0) |
| Expand/collapse matrix rows | 4.1.0 (whole level 4.2.0) |
| Licensing API | 4.7.0 |
| `privileges` required in capabilities | 4.6.0 |
| `getFormattingModel` / formatting model | 5.1.0 |
| `keepAllMetadataColumns` | 5.1.0 |

Sources: [Visual project structure](https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-project-structure), [Visual API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-api), [Certification requirements](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified).
