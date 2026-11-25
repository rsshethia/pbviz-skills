# Data-binding example: view model

A copyable `src/viewmodel.ts` that demonstrates the boundary described in `references/data-binding-principles.md`:

- defensive `DataView` guards;
- one place that owns all data-shape assumptions;
- stable selection IDs built once per data point;
- highlight arrays read correctly (null = unselected);
- dynamic format strings respected;
- explicit distinction between "no fields" and "no data".

It works alongside `examples/ui-starter/` — drop this file into a `pbiviz new` project's `src/` folder and call `transformCategorical(options.dataViews[0], host)` from `update()`, caching the result for resize-only updates.

This is a **reference skeleton**, not a tested project. Adapt types and fields to your own `capabilities.json`.
