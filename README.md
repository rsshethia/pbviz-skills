# Power BI Visuals — Skill Notes

## What is this?

This folder is a simple guide for building **custom visuals for Power BI**.

A custom visual is your own chart or control that you add to a Power BI report. Instead of using only the charts that come with Power BI, you can build one that looks and works the way you want.

Think of this folder as a **cheat sheet for an AI helper**. If you ask an AI to build a Power BI visual, it can read these notes and know what to do.

## Who is it for?

- People building their first Power BI custom visual.
- Developers who want a clear checklist instead of reading hundreds of web pages.
- Anyone using an AI assistant to help with Power BI visuals.

## What is inside?

| File | Plain-English description |
| --- | --- |
| `SKILL.md` | The main guide. A short summary plus links to the detailed notes. |
| `references/setup-and-project-structure.md` | How to install the tools and what each file in a new project does. |
| `references/capabilities-and-data-binding.md` | How to tell Power BI what data your visual needs. |
| `references/visual-api-lifecycle.md` | The four main functions every visual needs and when Power BI calls them. |
| `references/interactions-and-features.md` | Clicking, hovering, right-clicking, tooltips, drill-down, and loading lots of data. |
| `references/styling-localization-accessibility.md` | Colors, languages, keyboard use, and high-contrast mode. |
| `references/debugging-testing-validation.md` | How to find and fix problems while building. |
| `references/packaging-publishing-certification.md` | How to turn your work into a file, share it, and get it approved. |
| `references/reference-map-and-pitfalls.md` | Useful links, word definitions, and common mistakes to avoid. |
| `references/ui-reference-gallery.md` | Real Microsoft visual examples to copy UI ideas from, with pictures. |
| `references/ui-theming-and-color.md` | Making colors match the report theme and stay readable. |
| `references/ui-frameworks-and-charting.md` | Choosing between plain code, React, and chart libraries. |
| `references/ui-responsive-and-performance.md` | Making the visual look good at any size and stay fast. |
| `references/ui-accessibility-checklist.md` | Making the visual usable with a keyboard and by everyone. |
| `examples/ui-starter/` | A small starter you can copy and edit instead of starting from zero. |

## How to use it

1. Start with `SKILL.md`.
2. Pick the detailed note that matches what you are doing.
3. If you are working on how the visual **looks or feels**, start with the five `ui-...` notes and the starter in `examples/ui-starter/`.
4. Follow the examples and check the links for the full official documentation.

## The short version of building a visual

1. Install the tool: `npm install -g powerbi-visuals-tools`
2. Create a project: `pbiviz new myVisual`
3. Write your visual in `src/visual.ts`.
4. Describe your data in `capabilities.json`.
5. Test it in Power BI Desktop using the Developer visual.
6. Build the final file: `pbiviz package`
7. Share it or publish it to AppSource.

## Where the information came from

The notes are based on the official Microsoft Power BI documentation:

- <https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-project-structure>
- <https://learn.microsoft.com/en-us/power-bi/developer/visuals/guidelines-powerbi-visuals>

An older community repository was also used as a topic list: <https://github.com/PowerBi-Projects/PowerBI-visuals>. It is now deprecated, so the Microsoft docs are the source of truth.

This project lives at <https://github.com/rsshethia/pbviz-skills>.
