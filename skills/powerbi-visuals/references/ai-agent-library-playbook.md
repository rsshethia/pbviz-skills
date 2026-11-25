# Library playbook for AI agents building Power BI visuals

An LLM writing custom visuals fails in predictable ways: it invents API names, guesses package names, mixes d3 major versions, and reaches for a heavyweight chart library because that is what most web examples use. This file defines an **evidence hierarchy** and a **verification loop** that removes those failure modes.

## Evidence hierarchy (use in this order)

1. **Type definitions** — `powerbi-visuals-api/src/visuals-api.d.ts`. Ground truth for `IVisual`, `VisualUpdateOptions`, `IVisualHost`, `ISelectionManager`, `ISandboxExtendedColorPalette`, `FormattingModel`, `IFilter`, `VisualUpdateType`, `IVisualLicenseManager`.
   <https://github.com/microsoft/powerbi-visuals-api/blob/main/src/visuals-api.d.ts>
2. **Capabilities schema** — `schema.capabilities.json`. Ground truth for every `capabilities.json` key.
   <https://github.com/microsoft/powerbi-visuals-api/blob/master/schema.capabilities.json>
3. **Official docs as markdown** — append `?accept=text/markdown` to any Learn URL. Clean text, less noise than HTML.
4. **Official sample repos** — complete, compiling projects with real `package.json` files. Best source for "what does a working visual actually install and import?"
5. **Official utils packages** — encode Power BI idioms; prefer them over hand-rolled equivalents.
6. **d3 granular modules** — stable, widely known APIs for scales/shapes/DOM joins.
7. **Third-party chart libraries** — last resort; see tradeoffs below.

Rule for the agent: **grep the `.d.ts` or schema before using any symbol**. Do not rely on recall.

## Verified dependency set (from the official SampleBarChart)

`package.json` of [PowerBI-visuals-sampleBarChart](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart) (as of this writing) uses:

```json
{
  "devDependencies": {
    "@types/d3-axis": "^3.0.4",
    "@types/d3-scale": "^4.0.5",
    "@types/d3-selection": "^3.0.7",
    "d3-axis": "^3.0.0",
    "d3-scale": "^4.0.2",
    "d3-selection": "^3.0.0",
    "eslint": "^8.50.0",
    "eslint-plugin-powerbi-visuals": "^0.8.1",
    "powerbi-visuals-api": "~5.8.0",
    "powerbi-visuals-tools": "^5.3.0",
    "powerbi-visuals-utils-dataviewutils": "^6.0.1",
    "powerbi-visuals-utils-formattingmodel": "6.0.0",
    "powerbi-visuals-utils-formattingutils": "^6.0.1",
    "powerbi-visuals-utils-interactivityutils": "^6.0.2",
    "powerbi-visuals-utils-tooltiputils": "^6.0.1",
    "typescript": "^5.1.6"
  },
  "dependencies": {
    "powerbi-visuals-utils-onobjectutils": "^6.0.1"
  }
}
```

Takeaway: **three d3 modules**, not all of d3, plus a handful of official utils. That is the minimal, proven stack.

## Real package names (commonly misspelled)

| Correct npm name | Do NOT write |
| --- | --- |
| `powerbi-visuals-utils-formattingmodel` | ~~`powerbi-visuals-utils-formatting-model`~~ |
| `powerbi-visuals-utils-formattingutils` | ~~`powerbi-visuals-utils-formatting`~~ |
| `powerbi-visuals-utils-interactivityutils` | ~~`powerbi-visuals-utils-interactivity`~~ |
| `powerbi-visuals-utils-colorutils` | — |
| `powerbi-visuals-utils-chartutils` | — |
| `powerbi-visuals-utils-svgutils` | — |
| `powerbi-visuals-utils-tooltiputils` | — |
| `powerbi-visuals-utils-dataviewutils` | — |
| `powerbi-visuals-utils-typeutils` | — |
| `powerbi-visuals-utils-testutils` | — |
| `powerbi-visuals-utils-onobjectutils` | — |

Verify with `npm view <name> version` before adding a dependency.

## Does d3 help an LLM? Yes — with constraints

d3 is a toolkit, not a chart library. That is exactly why it suits LLM-generated code: each piece has a narrow, stable contract.

| Module | LLM-friendly use |
| --- | --- |
| `d3-scale` | `scaleBand`, `scaleLinear`, `scaleTime` — domain → pixels; recompute from `options.viewport` |
| `d3-shape` | `line`, `area`, `arc`, `stack` — path generation; avoid hand-writing geometry |
| `d3-selection` | `selectAll().data().join()` — keyed updates instead of append/clear loops |
| `d3-axis` | Axis generation; pair with `utils-chartutils` for tick counts and margins |
| `d3-array` | `extent`, `max`, `group`, `bin` — safe aggregation |

Constraints to encode in prompts/code review:

- **Pin the major version.** d3 v6+ passes the event as the first handler argument (`(event, d) => ...`); older docs use `d3.event`. Mixing them is a classic LLM error. The official bar chart sample still demonstrates the v5 `enter().merge()` pattern.
- **Import modules individually** (`d3-scale`, not `d3`) to keep the bundle small.
- **Never use `d3.html()` or `selection.html()` with data**; use `.text()` / `textContent`. Certification rejects it.
- **Never let d3 own the root element** the host gave you — append a child SVG and work inside it.
- If you want to dodge d3 version ambiguity entirely, use the plain-DOM pattern in [examples/ui-starter/](../examples/ui-starter/README.md).

## Other libraries that genuinely help an LLM

- **React** — official path: [create-react-visual](https://learn.microsoft.com/en-us/power-bi/developer/visuals/create-react-visual) and [circlecard-react](https://github.com/Microsoft/powerbi-visuals-circlecard-react). Good when the visual is really a small app (panels, forms, multiple views). Keep `IVisual` a thin adapter and pass viewport/palette as props.
- **Official utils** — the single biggest reduction in hallucinated API calls. Use `formattingmodel` for the Format pane, `colorutils` for themes/high contrast, `chartutils` for axes/labels, `tooltiputils` for hover handling, `interactivityutils` for selection, `dataviewutils` for safe object reads, `testutils` for tests.
- **TypeScript + ESLint** — the LLM's feedback loop, not just hygiene. `npx tsc --noEmit` and `npx eslint . --ext .js,.jsx,.ts,.tsx` catch invented APIs immediately.
- **Chart libraries (Chart.js, ECharts, Plotly, Highcharts)** — useful for standard charts with built-in zoom/legend/export, but risky for an agent: large API surface, version drift, hard-coded styling, frequent `innerHTML`/`fetch` use inside the library, and big bundles. Only choose when a requirement genuinely needs them, and run `pbiviz package --certification-audit`.

## Verification loop for an agent

Run after every meaningful change:

```bash
npx tsc --noEmit                              # invented API names fail here
npx eslint . --ext .js,.jsx,.ts,.tsx           # powerbi-visuals rules
pbiviz package --certification-audit           # unsafe fetch/XHR/eval
npm audit                                     # no high/moderate findings
pbiviz package                                # real artifact + hash
```

Then behavioral checks: empty data, one value, nulls, resize drag, theme switch, high contrast, keyboard-only pass, localization with a long-string locale.

## What does NOT help

- Inventing a "Power BI Fluent design system" for visual content — it does not exist; the Format pane is host-rendered.
- Copying generic D3/React web examples verbatim: they assume a full page,_remote fonts, and no sandbox.
- Using all of d3, jQuery, or a charting framework "just in case" — bundle size and certification both suffer.
- Trusting remembered API signatures without checking the `.d.ts`.

Sources: [visuals-api.d.ts](https://github.com/microsoft/powerbi-visuals-api/blob/main/src/visuals-api.d.ts), [capabilities schema](https://github.com/microsoft/powerbi-visuals-api/blob/master/schema.capabilities.json), [SampleBarChart package.json](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/blob/main/package.json), [React circle card package.json](https://github.com/Microsoft/powerbi-visuals-circlecard-react/blob/master/package.json), [Adding external libraries](https://learn.microsoft.com/en-us/power-bi/developer/visuals/adding-external-libraries).
