# Debugging, testing, and validation

## Development loop

1. `pbiviz start` — dev server on `https://localhost:8080`.
2. Install/trust the generated SSL certificate; otherwise the browser blocks the iframe.
3. In Power BI Desktop, enable **Developer mode** (Options → Preview features) and add the **Developer visual** to a report.
4. Bind fields to it; open browser DevTools on the iframe to inspect DOM, console, and breakpoints.
5. Edit TypeScript; the dev server rebuilds and reloads the visual.

Common setup failures:

| Symptom | Likely cause |
| --- | --- |
| Visual shows a certificate error | SSL cert not created/installed or not trusted |
| Developer visual not available | Developer mode not enabled in Desktop |
| Fields well is empty | `dataRoles` missing/incorrect in `capabilities.json`, or no matching `dataViewMappings` |
| Visual is blank | `update()` returned early because a guarded `dataView.*` property was missing; check console |
| Format pane control missing | Object declared in code but not in `capabilities.json`; descriptor names mismatched (case-sensitive) |

## Debugging with DevTools

- Open DevTools, select the visual's iframe, set breakpoints in the bundled `visual.js` (source maps help).
- Log `options.dataViews[0]` in `update()` to inspect the actual shape Power BI sent — this is the fastest way to resolve mapping confusion.
- Log `options.type`, `options.viewMode`, `options.editMode`, and `options.operationKind` when behavior differs between edit/view, resize, or segmented fetch.
- Use `powerbi-visuals-utils-diagnostics` / `host.displayWarningIcon()` for user-visible warnings instead of silent failures.

## Types of update to test

- **Data changes**: no fields, one field, many fields, null/blank values, very large values.
- **Resize**: tiny tile, wide tile, and resize while selected.
- **View modes**: View, Edit, Focus, Advanced edit mode.
- **Cross-highlighting**: click a different visual and confirm highlighting/sync.
- **Theme changes**: switch report theme and high-contrast mode.
- **Filter/slicer changes**: including pending changes and sync slicers.
- **Data segmentation**: first and subsequent `fetchMoreData` updates.
- **Localization**: packaged visual in a non-English locale.
- **Export**: PDF/PowerPoint export (visual is rendered in a different context — no external calls allowed).

## Validation and certification audits

For tools 6.1.0+:

```bash
pbiviz package --certification-audit   # reports unsafe fetch, XMLHttpRequest, eval
pbiviz package --certification-fix      # auto-fix unsafe calls from third-party libs
```

`--certification-fix` is intended only for unsafe calls inside libraries you do not control; rewrite your own code manually. After either command, re-run and retest the visual. Keep `npm run package` in sync with your final build command so the compiled package hash matches what you submit.

Other checks required for certification:

```bash
npm install          # must succeed
pbiviz package       # must succeed
npm audit            # no high or moderate warnings
npx eslint . --ext .js,.jsx,.ts,.tsx   # no lint errors
```

Required in `package.json`: `typescript`, `eslint`, `eslint-plugin-powerbi-visuals`, and the `eslint` script above.

## Test data

Use the [sample report assets](https://github.com/PowerBi-Projects/PowerBI-visuals/tree/gh-pages/assets) referenced by the certification docs as a test dataset, plus your own edge-case data.

## Performance and hygiene

- Cap data with `dataReductionAlgorithm` and use `fetchMoreData` when you genuinely need more rows.
- Keep DOM updates incremental (d3 data joins); avoid clearing and rebuilding everything when only selection/opacity changes.
- Avoid heavy work in `update()`; cache scales and settings where safe.
- Remove listeners/timers in `destroy()` where possible, but do not rely on it being called.
- No console errors or unhandled exceptions for any input — this is a hard certification rule.

Sources: [Debugging guide (community docs)](https://github.com/PowerBi-Projects/PowerBI-visuals/blob/master/tools/debugging.md), [Certification requirements](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified), [Submission testing](https://learn.microsoft.com/en-us/power-bi/developer/visuals/submission-testing).
