---
name: powerbi-visuals
description: "Use when the user wants to build, debug, bind data for, improve, package, or publish a Power BI custom visual, or asks why the visual is blank, which data mapping to use, how to theme it, or whether it will pass certification. Verify API names against powerbi-visuals-api and check apiVersion before version-gated features. For reports using built-in visuals or DAX, this skill does not apply."
metadata:
  version: 1.0.0
---

# Power BI Custom Visuals

You are a Power BI custom visual expert. A custom visual is a sandboxed TypeScript/JavaScript component that runs inside an iframe in Power BI, receives data as a `DataView` from the host, renders into a DOM element, and talks back through services on `IVisualHost`. The `pbiviz` CLI (`powerbi-visuals-tools`) scaffolds and packages it; API contracts come from `powerbi-visuals-api`.

## When to use this skill

- Starting a new visual (`pbiviz new`) or modifying an existing one.
- Designing data bindings (`dataRoles`, `dataViewMappings`), formatting properties, or interactions.
- Debugging with the developer visual, packaging, or publishing to AppSource/certification.
- Diagnosing "why is my visual blank / why don't my fields show up / why was my submission rejected".
- Judging chart choice, color, accessibility, or how a visual behaves at different screen sizes.

Not for: reports built with built-in visuals, DAX/Power Query modeling, or embedding reports in apps (unless the question concerns a custom visual inside them).

## How an agent should use this skill

1. Load the full file when the description matches, or when the user says "use the powerbi-visuals skill" (or `/powerbi-visuals` where slash commands exist).
2. State the situation in one line before acting: new visual, broken visual, UI improvement, data-binding question, or publishing question.
3. Route with the table below and open **only** the reference the question needs. Do not load everything at once.
4. Read bundled files from the **installed skill directory** using the relative paths below. Do not substitute a remote repository URL. If a file is missing, say which one and continue with the core workflow.
5. Treat `examples/` as skeletons to adapt, not finished code.
6. Verify API names and version-gated features against `powerbi-visuals-api` and Microsoft Learn before recommending them.

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

## Question → Reference routing

Read the relevant reference before acting. Each is self-contained, with API-version notes and source links.

| User question | Read this reference |
| --- | --- |
| "How do I set up my environment? What files does `pbiviz` create?" | [setup-and-project-structure.md](references/setup-and-project-structure.md) |
| "What fields can my visual accept? How do I declare data or conditional formatting?" | [capabilities-and-data-binding.md](references/capabilities-and-data-binding.md) |
| "What methods must my visual implement? How does `update()` work?" | [visual-api-lifecycle.md](references/visual-api-lifecycle.md) |
| "How do I add selection, tooltips, context menu, drill-down, or load more rows?" | [interactions-and-features.md](references/interactions-and-features.md) |
| "How do I style it, localize it, support high contrast, or keyboard focus?" | [styling-localization-accessibility.md](references/styling-localization-accessibility.md) |
| "Why is my visual blank / broken? How do I debug or validate it?" | [debugging-testing-validation.md](references/debugging-testing-validation.md) |
| "How do I package, publish to AppSource, or get certified?" | [packaging-publishing-certification.md](references/packaging-publishing-certification.md) |
| "What else can go wrong? Where are the official docs?" | [reference-map-and-pitfalls.md](references/reference-map-and-pitfalls.md) |
| "Which chart should I use? Is this an honest representation?" | [data-visualization-principles.md](references/data-visualization-principles.md) |
| "How should I think about the data contract, identity, and settings?" | [data-binding-principles.md](references/data-binding-principles.md) |
| "Show me code to read each data shape." | [data-binding-patterns.md](references/data-binding-patterns.md) |
| "How do I make this decision-ready? How should it look on mobile?" | [future-and-decision-design.md](references/future-and-decision-design.md) |
| "Where can I copy a real visual's UI pattern?" | [ui-reference-gallery.md](references/ui-reference-gallery.md) |
| "How do theme colors and palettes work?" | [ui-theming-and-color.md](references/ui-theming-and-color.md) |
| "Should I use d3, React, or a chart library?" | [ui-frameworks-and-charting.md](references/ui-frameworks-and-charting.md) |
| "How do I handle resize, small screens, and performance?" | [ui-responsive-and-performance.md](references/ui-responsive-and-performance.md) |
| "Is my visual accessible to keyboard and screen-reader users?" | [ui-accessibility-checklist.md](references/ui-accessibility-checklist.md) |
| "As an AI, which libraries and package names should I trust?" | [ai-agent-library-playbook.md](references/ai-agent-library-playbook.md) |

Copyable starting points: [examples/ui-starter/](examples/ui-starter/README.md) — SVG bar chart with theming, selection, tooltip, context menu, keyboard focus, resize-aware updates; [examples/data-binding/](examples/data-binding/README.md) — `viewmodel.ts` with guarded transforms, stable selection IDs, highlights, and dynamic format strings.

## Workflow at a glance

0. **Principles gate** — identify the reader's question and the encoding that answers it. Apply [data-visualization-principles.md](references/data-visualization-principles.md): position over angle/area, honest baselines, disclosed data reduction, color used sparingly, context for every value.
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
