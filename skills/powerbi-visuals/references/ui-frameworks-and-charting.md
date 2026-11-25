# UI frameworks and charting choices

There is no official "Fluent UI for custom visual content" design system. The Format pane is host-rendered (and its components come from the formatting model); **the content inside your visual is yours**, and must theme itself from `host.colorPalette`. Choose the smallest tool that produces the UI you need.

## Decision matrix

| Approach | When to use | Strengths | Watch-outs |
| --- | --- | --- | --- |
| **Plain TypeScript + d3** | Most charts; precise control over marks, axes, interaction | Small bundle, fully themeable, easiest to certify, official samples use it | You build axes/legends/tooltips yourself (use `utils-chart`, `utils-formatting`) |
| **React** | Complex component state, forms, multi-panel visuals, design-system reuse | Official tutorial + sample; declarative UI; component testing | Bigger bundle; React DOM writes must stay inside the supplied element; don't load remote assets |
| **d3 + React** | React shell with d3-generated scales/shapes, React owns DOM | Best of both; d3 for math, React for rendering | Avoid both libraries fighting over the same DOM nodes |
| **Charting library** (Chart.js, ECharts, Plotly, Highcharts, etc.) | Standard chart types with heavy built-in behavior (zoom, legends, export) | Fast feature coverage; mature accessibility options sometimes available | Large bundle, fixed styling that may fight themes, often uses `innerHTML`/canvas and remote resources — check certification rules carefully |
| **Canvas / WebGL** | Thousands of points, animation, network graphs, 3D | Performance scales with pixels rather than DOM nodes | Harder accessibility (no per-mark DOM), hit-testing must be manual, text rendering is manual |
| **powerbi-visuals-utils-*** | Repeated Power BI-specific work | Official, API-compatible helpers for formatting, colors, axes, SVG, tooltips, selections | Adds dependencies; prefer only what you use (tree-shake) |

## Official building blocks

- `powerbi-visuals-utils-formattingmodel` — build Format pane models. Recommended over hand-writing them.
- `powerbi-visuals-utils-colorutils` — theme/high-contrast colors, `ColorHelper`.
- `powerbi-visuals-utils-chartutils` — axis tick counts, label margins, scales, `getRecommendedNumberOfTicksForXAxis/YAxis`, `getTickLabelMargins`.
- `powerbi-visuals-utils-svgutils` — `createClassAndSelector`, `manipulation.translate`, `Rect` helpers.
- `powerbi-visuals-utils-formattingutils` — text measurement (`TextMeasurementService`), value formatting.
- `powerbi-visuals-utils-tooltiputils` — tooltip wrapper.
- `powerbi-visuals-utils-interactivityutils` — selection behavior.
- `powerbi-visuals-utils-dataviewutils` — safe `DataView` object reads.
- `powerbi-visuals-utils-testutils` — unit-test mocks.

Rule: adopt the helper that removes a real class of bugs; don't import a package for a one-line utility.

## React path (official)

Tutorial: [Create a React-based visual](https://learn.microsoft.com/en-us/power-bi/developer/visuals/create-react-visual). Sample: [powerbi-visuals-circlecard-react](https://github.com/Microsoft/powerbi-visuals-circlecard-react).

```bash
npm i react react-dom
npm i @types/react @types/react-dom
```

```typescript
// visual.ts — the host-facing shell
export class Visual implements IVisual {
  private target: HTMLElement;
  private reactRoot: React.ComponentElement<any, any>;

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
    this.reactRoot = React.createElement(ReactCircleCard, {});
    ReactDOM.render(this.reactRoot, this.target);
  }

  public update(options: VisualUpdateOptions): void {
    // pass view model + viewport + palette into the React component via props/state
  }
}
```

Keep `IVisual` as a thin adapter; put rendering in components. Pass theme colors and viewport down as props rather than reading host services deep in the tree. Adapt size on `update()` — React does not know about Power BI's viewport.

## Third-party chart libraries: what to verify before choosing

Certification and the sandbox impose real constraints. Before committing to a library:

1. **Bundle size** — check the packaged `.pbiviz` size; large libraries slow first render (see `performance-tips`).
2. **No external requests** — fonts, icons, map tiles, CDN scripts are out for certified visuals; `WebAccess` must be empty.
3. **No `innerHTML`/`d3.html()` with user data** — many libraries use them internally; that is a certification blocker.
4. **No `fetch`/`XMLHttpRequest`** — including inside bundled libraries. Use `pbiviz package --certification-audit`.
5. **No `eval`/dynamic code** — template engines and some chart config evaluators trip this.
6. **Theme integration** — can you inject theme colors, fonts, and high-contrast colors? If the library hard-codes its own look, it will feel foreign in a report.
7. **Accessibility** — can you add focusable marks, labels, and keyboard interaction? Canvas-only libraries need extra work.
8. **Resize** — does it honor frequent resize events without reprocessing data (see [ui-responsive-and-performance.md](ui-responsive-and-performance.md))?

If several answers are "no", prefer d3/React with official utils.

## SVG vs canvas vs WebGL

| Need | Pick |
| --- | --- |
| Dozens to a few hundred marks, hover/selection per mark, text labels | SVG (d3) |
| Thousands of marks, animation, small marks | Canvas |
| 3D / heavy visualization | WebGL (sample: [globemap](https://github.com/Microsoft/powerbi-visuals-globemap/)) |

SVG gives accessible per-mark DOM nodes and easy CSS theming; canvas needs manual hit-testing and manual text. Mix deliberately — e.g. SVG axes + canvas marks.

## Keeping the bundle honest

- Import only the d3 modules you use (`d3-scale`, `d3-shape`, `d3-selection`) rather than all of `d3`.
- Avoid jQuery; official performance guidance recommends native JS.
- Remove unused code, rely on tree-shaking, and measure again after adding a dependency.
- Use `npm audit`; certification rejects high/moderate findings.

Sources: [React visual tutorial](https://learn.microsoft.com/en-us/power-bi/developer/visuals/create-react-visual), [Adding external libraries](https://learn.microsoft.com/en-us/power-bi/developer/visuals/adding-external-libraries), [Performance tips](https://learn.microsoft.com/en-us/power-bi/developer/visuals/performance-tips), [Chart utils](https://learn.microsoft.com/en-us/power-bi/developer/visuals/utils-chart), [SVG utils](https://learn.microsoft.com/en-us/power-bi/developer/visuals/utils-svg), [Certification requirements](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified).
