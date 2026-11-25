# Power BI Visuals Skill

**A ready-to-install guide that teaches any AI agent how to build, debug, and publish Power BI custom visuals.** It uses the open Agent Skills format (`SKILL.md`), so it works in Claude Code, ChatGPT/Codex, Cursor, and similar tools.

Repo: <https://github.com/rsshethia/pbviz-skills> · Last updated: 2026-11-25

---

## What you get

- **Fewer wrong answers.** The skill tells the agent to verify API names against `powerbi-visuals-api` and Microsoft Learn instead of guessing.
- **Working structure.** It knows the project files, `capabilities.json`, the `IVisual` lifecycle, and how to bind data — the parts agents most often get wrong.
- **Better visuals.** Built-in guidance on theming, color, accessibility, honest data reduction, and decision-oriented design.
- **One-command install.** Clone, run one script, restart your agent.

---

## Install the skill in 30 seconds

| Method | Best for | Command |
| --- | --- | --- |
| Claude Code personal | Every project | `.\install.ps1` |
| Claude Code project | One project only | `.\install.ps1 -Target claude-project` |
| Any other agent | Codex, ChatGPT, Cursor, Windsurf | `.\install.ps1 -Target custom -Path "...\skills\powerbi-visuals"` |
| No install | Just reading or uploading files | Download the ZIP and read `SKILL.md` |

### Claude Code

Personal — works in every project:

```powershell
git clone https://github.com/rsshethia/pbviz-skills.git
cd pbviz-skills
.\install.ps1
```

Project — works only in the current folder:

```powershell
.\install.ps1 -Target claude-project
```

On macOS/Linux:

```bash
git clone https://github.com/rsshethia/pbviz-skills.git
cd pbviz-skills
chmod +x install.sh
./install.sh            # or: ./install.sh claude-project
```

Then **restart your AI tool**.

### Other agents

```powershell
.\install.ps1 -Target custom -Path "C:\path\to\your\skills\powerbi-visuals"
```

Or copy the whole folder into your agent's skills directory and delete `.git`.

- OpenAI Codex / ChatGPT skills: <https://developers.openai.com/codex/build-skills>
- Cursor skills: <https://docs.cursor.com/docs/skills>

### No install

Download the ZIP from <https://github.com/rsshethia/pbviz-skills>, unzip it, and ask your AI:

> Read `SKILL.md` in this folder and help me build a Power BI custom visual.

You can also upload `SKILL.md` and `references/` into a ChatGPT project or custom GPT knowledge.

---

## Example prompts

| Ask your agent | What the skill makes it do |
| --- | --- |
| "Build a bar chart custom visual with theme colors." | Scaffold with `pbiviz`, declare `dataRoles` + `categorical` mapping, read colors from `host.colorPalette`, wire tooltips and selection. |
| "My visual is blank. Why?" | Check `capabilities.json`, guard `options.dataViews[0]`, inspect the actual `DataView` shape, look for null values. |
| "How do I show variance against a target?" | Use a bullet-style layout, read the target from an object property, show direction and gap size, label the baseline. |
| "Make it work on mobile." | Handle touch events, use `options.viewport`, hide legends at small sizes, test Focus mode portrait and landscape. |
| "Get my visual certified." | Run the certification audit, remove `fetch`/`innerHTML`, add context menu and rendering events, prepare AppSource assets. |

### What an example run looks like

You ask: *"Build a simple category bar chart with theme colors."*

The agent should produce the same contract every time:

```jsonc
// capabilities.json (excerpt)
"privileges": [],
"dataRoles": [
  { "name": "category", "displayName": "Category", "kind": "Grouping" },
  { "name": "measure",  "displayName": "Value",    "kind": "Measure" }
],
"dataViewMappings": [{
  "categorical": {
    "categories": { "for": { "in": "category" } },
    "values": { "select": [{ "bind": { "to": "measure" } }] }
  }
}]
```

```typescript
// visual.ts (excerpt)
public update(options: VisualUpdateOptions): void {
  const dv = options.dataViews && options.dataViews[0];
  if (!dv || !dv.categorical) { return; }
  const categories = dv.categorical.categories[0];
  const values = dv.categorical.values[0];
  const points = categories.values.map((label, i) => ({
    label: String(label),
    value: Number(values.values[i]),
    selectionId: this.host.createSelectionIdBuilder()
      .withCategory(categories, i).createSelectionId()
  }));
  this.render(points, options.viewport);
}
```

A weak agent skips `privileges`, hard-codes colors, and assumes `dataViews[0]` exists. This skill prevents all three.

---

## How agents use it

The skill uses **progressive disclosure**, so it stays quiet until needed:

1. **Discovery** — the agent sees only `name` and `description` from `SKILL.md`. Triggers include *custom visual, pbiviz, Power BI visual, capabilities.json, dataView, AppSource visual*.
2. **Loading** — on a match, it loads the full `SKILL.md`. Force it with *"Use the powerbi-visuals skill"* or `/powerbi-visuals` where slash commands exist.
3. **Work** — it follows the workflow and opens only the `references/` files needed for your task. `examples/` files are skeletons, not finished code.
4. **Sources** — it checks Microsoft Learn for APIs and version-gated features.

Keep the installed folder intact: `SKILL.md` uses relative links to `references/` and `examples/`.

### Skill format

A valid skill folder is simply:

```
powerbi-visuals/
├── SKILL.md          # required: name + description frontmatter, then instructions
└── references/ ...   # optional supporting files
```

This repo's frontmatter:

```yaml
---
name: powerbi-visuals
description: "Use when the user wants to create, build, debug, test, package, certify, or publish a Power BI custom visual ..."
---
```

The folder name matches `name`. The installers handle that for you.

---

## Check that the skill loaded

Ask:

> I want a bar chart custom visual with colors from the report theme. What should I do?

A working install mentions `pbiviz`, `capabilities.json`, `dataRoles`, `IVisual.update`, and `host.colorPalette`.

Verify the frontmatter:

```powershell
Get-Content "$HOME\.claude\skills\powerbi-visuals\SKILL.md" -TotalCount 4
```

### FAQ

**Why isn't the skill listed?** Restart the agent and check that the file is at `<skills-dir>/powerbi-visuals/SKILL.md`.

**Why doesn't the folder name matter?** It does — it must match `name: powerbi-visuals`. Rename it if needed.

**What if links to references fail?** Keep `references/` and `examples/` beside `SKILL.md`; do not copy the entry file alone.

**Can ChatGPT use it?** Yes. Add the folder to your agent's skills directory, or upload `SKILL.md` and `references/` into a ChatGPT project or custom GPT knowledge base.

---

## What is inside

| Path | What it is |
| --- | --- |
| `SKILL.md` | The short entry point the agent reads first. |
| `AGENTS.md` | A pointer for agents that use AGENTS.md. |
| `references/` | Detailed notes: UI, data, color, publishing. |
| `examples/` | Copyable starter files. |
| `install.ps1`, `install.sh` | One-command installers. |

### Reference notes

| File | What it covers |
| --- | --- |
| `setup-and-project-structure.md` | Tools and every project file. |
| `capabilities-and-data-binding.md` | Declaring data for the visual. |
| `visual-api-lifecycle.md` | The four functions every visual has. |
| `interactions-and-features.md` | Clicks, tooltips, menus, drill-down, large data. |
| `styling-localization-accessibility.md` | Colors, languages, keyboards, high contrast. |
| `debugging-testing-validation.md` | Finding and fixing problems. |
| `packaging-publishing-certification.md` | Building and getting approved. |
| `reference-map-and-pitfalls.md` | Links, terms, common mistakes. |
| `ui-reference-gallery.md` | Official Microsoft visuals to copy from. |
| `ui-theming-and-color.md` | Theme colors and palettes. |
| `ui-frameworks-and-charting.md` | Plain code, React, or chart libraries. |
| `ui-responsive-and-performance.md` | Any screen size, fast rendering. |
| `ui-accessibility-checklist.md` | Keyboard and screen-reader use. |
| `data-visualization-principles.md` | Right chart, honest data. |
| `data-binding-principles.md` | Data contracts and identity. |
| `data-binding-patterns.md` | Code for each data shape. |
| `future-and-decision-design.md` | Decisions, color, multiple screens. |
| `ai-agent-library-playbook.md` | Libraries and sources an AI should trust. |

Starters: `examples/ui-starter/` (chart) and `examples/data-binding/` (view model).

---

## Concrete details the skill encodes

| Detail | Value | Source |
| --- | --- | --- |
| Visual icon | PNG, 20 × 20 px | [Project structure](https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-project-structure) |
| Marketplace logo | PNG, 300 × 300 px | [Publishing](https://learn.microsoft.com/en-us/power-bi/developer/visuals/office-store) |
| `privileges` required | API 4.6.0+ | [Capabilities](https://learn.microsoft.com/en-us/power-bi/developer/visuals/capabilities) |
| Formatting model `getFormattingModel` | API 5.1+ | [Visual API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-api) |
| Default data limit | 1,000 rows (top reduction) | [Data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings) |
| Text contrast target | 4.5:1 (WCAG AA) | [WCAG](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) |

---

## Update or remove

```powershell
git pull
.\install.ps1         # copies new files over the old ones
```

Remove by deleting the installed `powerbi-visuals` folder.

---

## Sources

Official docs: <https://learn.microsoft.com/en-us/power-bi/developer/visuals/>

The older community repo <https://github.com/PowerBi-Projects/PowerBI-visuals> is deprecated; Microsoft Learn is the source of truth.
