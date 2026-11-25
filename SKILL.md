---
name: powerbi-visuals
description: "Use when the user wants to create, build, debug, test, package, certify, or publish a Power BI custom visual. Covers pbiviz project setup, capabilities.json, data view mappings, the IVisual lifecycle, formatting model, selection and tooltips, accessibility, localization, and AppSource submission. Trigger on 'custom visual', 'pbiviz', 'Power BI visual', 'capabilities.json', 'dataView', 'AppSource visual'."
---

# Power BI Custom Visuals

A Power BI custom visual is a sandboxed TypeScript/JavaScript component that runs inside an iframe in Power BI, receives data as a `DataView` from the host, renders into a DOM element, and talks back to the host through services exposed on `IVisualHost`. The whole project is generated and packaged by the `pbiviz` CLI (`powerbi-visuals-tools`) and its API contracts come from `powerbi-visuals-api`.

## When to use this skill

- Starting a new visual from scratch (`pbiviz new`) or modifying an existing one.
- Designing data bindings (`dataRoles`, `dataViewMappings`), formatting properties, or interactions.
- Debugging with the developer visual, packaging, or publishing to AppSource/certification.
- Diagnosing "why is my visual blank / why don't my fields show up / why was my submission rejected".

Not for: building reports with built-in visuals, DAX/Power Query modeling, or embedding reports in apps (unless the question concerns a custom visual inside them).

## Quick start

```bash
npm install -g powerbi-visuals-tools        # CLI (aka pbiviz)
pbiviz new myVisual                          # scaffold
cd myVisual
npm install
pbiviz start                                 # dev server on https://localhost:8080
# In Power BI Desktop: enable Developer mode, add the "Developer visual", point it at localhost:8080
pbiviz package                               # produces dist/myVisual.pbiviz
```

Install the generated SSL certificate first (`pbiviz --install-cert` / docs on certificate setup), otherwise HTTPS preview will fail.

## The four things that must always agree

1. **Class name** — the single class implementing `IVisual` must match `visualClassName` in `pbiviz.json`.
2. **`apiVersion`** in `pbiviz.json` decides which APIs exist. Check it before recommending `getFormattingModel` (5.1+), `privileges` (required from 4.6.0), `fetchMoreData` (3.4+), licensing (4.7+), etc.
3. **`capabilities.json`** declares what the host may send and show. Code alone cannot create a field well or format-pane control.
4. **Formatting model descriptors** (objectName/propertyName, case-sensitive) must match objects/properties declared in `capabilities.json`.

## Reference map

Read the relevant reference before acting. Each file is self-contained and includes API-version notes and source links.

| Reference | Use it for |
| --- | --- |
| [setup-and-project-structure.md](references/setup-and-project-structure.md) | Environment setup, CLI commands, project tree, `pbiviz.json` metadata, `tsconfig.json`, certificates |
| [capabilities-and-data-binding.md](references/capabilities-and-data-binding.md) | `capabilities.json` root objects, `privileges`, data roles, all `dataViewMappings`, conditions, data reduction, expand/collapse |
| [visual-api-lifecycle.md](references/visual-api-lifecycle.md) | `constructor` / `update` / `getFormattingModel` / `destroy`, `IVisualHost` services, `VisualUpdateOptions`, formatting model vs. legacy objects |
| [interactions-and-features.md](references/interactions-and-features.md) | Selection/cross-filtering, filter API, tooltips, context menu, drill-down, bookmarks, slicer sync, URL launch, fetch more data |
| [styling-localization-accessibility.md](references/styling-localization-accessibility.md) | `visual.less`, theme colors, high contrast, localization, keyboard focus, mobile layout, safe DOM |
| [debugging-testing-validation.md](references/debugging-testing-validation.md) | Dev server, certs, DevTools debugging, common errors, validation/certification audits, performance |
| [packaging-publishing-certification.md](references/packaging-publishing-certification.md) | `pbiviz package`, AppSource assets and metadata, free vs IAP, licensing, logos, watermarks, certification requirements |
| [reference-map-and-pitfalls.md](references/reference-map-and-pitfalls.md) | Curated Learn links, repo topology, glossary, common invariants and failure modes |
| [data-binding-principles.md](references/data-binding-principles.md) | Data contract, view-model boundary, identity, selectors, highlights, honest reduction, empty states |
| [data-binding-patterns.md](references/data-binding-patterns.md) | Copy-paste transforms for each mapping, selection builders, format strings, sorting, segmented fetch |
| [future-and-decision-design.md](references/future-and-decision-design.md) | Decision-oriented design, Shneiderman interaction, color that adds value, one visual across screen sizes |

### UI references (start here for appearance and feel)

| Reference | Use it for |
| --- | --- |
| [ui-reference-gallery.md](references/ui-reference-gallery.md) | Official sample visuals as a UI pattern library, with screenshots and source repos |
| [ui-theming-and-color.md](references/ui-theming-and-color.md) | Theme colors, `ColorHelper`, conditional formatting, palettes, typography, high contrast |
| [ui-frameworks-and-charting.md](references/ui-frameworks-and-charting.md) | d3 vs React vs chart libraries vs canvas/WebGL, and certification constraints on UI dependencies |
| [ui-responsive-and-performance.md](references/ui-responsive-and-performance.md) | Resize bit flags, mobile/touch equivalents, Focus mode, rendering performance |
| [ui-accessibility-checklist.md](references/ui-accessibility-checklist.md) | WCAG contrast, keyboard/focus, screen readers, reduced motion, states, 10-step audit |
| [data-visualization-principles.md](references/data-visualization-principles.md) | Chart selection, perceptual encoding, graphical integrity, honest data reduction, context |
| [ai-agent-library-playbook.md](references/ai-agent-library-playbook.md) | Evidence hierarchy, verified package names, d3/React choices, and a self-verification loop for LLMs |

Copyable starting points: [examples/ui-starter/](examples/ui-starter/README.md) — SVG bar chart skeleton with theming, selection, tooltip, context menu, keyboard focus, and resize-aware updates; [examples/data-binding/](examples/data-binding/README.md) — `viewmodel.ts` skeleton with guarded transforms, stable selection IDs, highlights, and dynamic format strings.

## Workflow at a glance

0. **Principles gate** — before choosing a chart type, identify the reader's question and the encoding that answers it. Apply [data-visualization-principles.md](references/data-visualization-principles.md): position over angle/area, honest baselines, disclosed data reduction, color used sparingly, context for every value.
0.5. **Data contract gate** — decide the mapping, conditions, view-model shape, identity, selector scopes, highlight behavior, and data-reduction disclosure before touching rendering code. Apply [data-binding-principles.md](references/data-binding-principles.md).
1. **Confirm the API version** in `pbiviz.json` before using a version-gated feature.
2. **Declare** data roles, mappings, objects, and feature flags in `capabilities.json`.
3. **Implement** the `IVisual` class: create DOM once in the constructor, re-render from `options.dataViews[0]` in `update`, clean up in `destroy`.
4. **Bind formatting** with `getFormattingModel` (5.1+) or legacy `enumerateObjectInstances` (deprecated from 5.1).
5. **Add interactions**: selection IDs → selection manager → host services (tooltips, context menu, filters).
6. **Harden**: high contrast, keyboard focus, localization, no unhandled exceptions, no unsafe DOM writes.
7. **Debug** with the developer visual, then `pbiviz package`.
8. **Publish** via Partner Center; certify only if the visual can pass the no-external-access rules.

## Hard constraints worth remembering

- No `innerHTML` or `d3.html()` with user data — sanitize, or use `text()` / safe DOM APIs.
- UI colors and fonts come from `host.colorPalette` / format properties — never hard-coded or loaded from a CDN.
- Certified visuals cannot make HTTP/WebSocket calls; `WebAccess` privilege must be empty/omitted, and `fetch` / `XMLHttpRequest` are forbidden.
- `destroy()` is called when the visual unloads, but the host often just removes the iframe; do not rely on it as the only cleanup path.
- Table data views are **not ordered** — do not assume row order.
- Version numbers in `pbiviz.json` have **four** parts (`x.x.x.x`); never change the GUID of a published visual.
- Localization does not work in the developer visual while debugging; test with a packaged visual in a localized Power BI Desktop/service.

## Sources

Primary documentation: [Power BI custom visuals docs](https://learn.microsoft.com/en-us/power-bi/developer/visuals/). The older community repo [PowerBi-Projects/PowerBI-visuals](https://github.com/PowerBi-Projects/PowerBI-visuals) is deprecated and redirects readers to <https://microsoft.github.io/PowerBI-visuals/>; it is useful only as a topic map.
