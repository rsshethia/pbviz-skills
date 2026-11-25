# Power BI Visuals Skill

A small pack of notes that teaches an AI how to build **custom visuals for Power BI**. It works with any AI that understands `SKILL.md` files (Claude Code, ChatGPT/Codex, Cursor, and similar agents).

Repo: <https://github.com/rsshethia/pbviz-skills>

---

## Install in 30 seconds

### Claude Code (most common)

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

### Any other agent (ChatGPT, Codex, Cursor, Windsurf, etc.)

These tools use the same simple format: a folder with a `SKILL.md` file.

```powershell
.\install.ps1 -Target custom -Path "C:\path\to\your\skills\powerbi-visuals"
```

or just copy this whole folder into your agent's skills folder and remove the `.git` folder.

- OpenAI Codex / ChatGPT skills guide: <https://developers.openai.com/codex/build-skills>
- Cursor skills: <https://docs.cursor.com/docs/skills>

### No install at all

Download the ZIP from <https://github.com/rsshethia/pbviz-skills>, unzip it, and tell your AI:

> Read `SKILL.md` in this folder and help me build a Power BI custom visual.

You can also upload `SKILL.md` and the `references/` files into a ChatGPT project or custom GPT's knowledge.

---

## Check that it works

Ask your AI:

> I want a bar chart custom visual with colors from the report theme. What should I do?

It should mention `pbiviz`, `capabilities.json`, `dataRoles`, `IVisual.update`, and `host.colorPalette`.

---

## What is inside (kept simple on purpose)

| Path | What it is |
| --- | --- |
| `SKILL.md` | The short entry point. AI reads this first. |
| `AGENTS.md` | A tiny pointer for agents that use AGENTS.md. |
| `references/` | The detailed notes (UI, data, color, publishing, etc.). |
| `examples/` | Copyable starter files. |
| `install.ps1`, `install.sh` | One-command installers. |

### Notes in `references/`

| File | Plain-English description |
| --- | --- |
| `setup-and-project-structure.md` | Installing tools and what each project file does. |
| `capabilities-and-data-binding.md` | Telling Power BI what data the visual needs. |
| `visual-api-lifecycle.md` | The four functions every visual has. |
| `interactions-and-features.md` | Clicks, tooltips, menus, drill-down, big datasets. |
| `styling-localization-accessibility.md` | Colors, languages, keyboards, high contrast. |
| `debugging-testing-validation.md` | Finding and fixing problems. |
| `packaging-publishing-certification.md` | Building the file and getting it approved. |
| `reference-map-and-pitfalls.md` | Links, definitions, common mistakes. |
| `ui-reference-gallery.md` | Real Microsoft visuals to copy UI ideas from. |
| `ui-theming-and-color.md` | Making colors match the report theme. |
| `ui-frameworks-and-charting.md` | Choosing plain code, React, or a chart library. |
| `ui-responsive-and-performance.md` | Looking good at any size and staying fast. |
| `ui-accessibility-checklist.md` | Usable by keyboard and by everyone. |
| `data-visualization-principles.md` | Choosing the right chart and showing data honestly. |
| `data-binding-principles.md` | Thinking about the data contract and identity. |
| `data-binding-patterns.md` | Ready-to-adapt code for reading Power BI data. |
| `future-and-decision-design.md` | Helping people decide, color, and multiple screen sizes. |
| `ai-agent-library-playbook.md` | Which libraries and sources an AI should trust. |

Starters: `examples/ui-starter/` (a simple chart) and `examples/data-binding/` (a view-model file).

---

## Update or remove

```powershell
git pull
.\install.ps1         # copies the new files over the old ones
```

To remove: delete the installed `powerbi-visuals` folder from your skills directory.

---

## Where the information came from

Official Microsoft docs: <https://learn.microsoft.com/en-us/power-bi/developer/visuals/>

The older community repo <https://github.com/PowerBi-Projects/PowerBI-visuals> is deprecated; Microsoft docs are the source of truth.
