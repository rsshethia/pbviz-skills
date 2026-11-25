# Power BI Visuals Skill

**A ready-to-install Agent Skill that teaches any AI to build, debug, bind data for, style, and publish Power BI custom visuals.** It works with Claude Code, ChatGPT/Codex, Cursor, Windsurf, and any agent that supports the [Agent Skills spec](https://agentskills.io/specification.md).

Repo: <https://github.com/rsshethia/pbviz-skills> · License: MIT · Last updated: 2026-11-25

---

## What you get

- **Fewer wrong answers.** It tells the agent to verify API names against `powerbi-visuals-api` and check `apiVersion` before using a version-gated feature.
- **The full workflow.** Project setup, `capabilities.json`, data binding, `IVisual` lifecycle, formatting model, interactions, accessibility, publishing.
- **Judgment, not just mechanics.** Chart choice, honest data reduction, color that adds value, and how to make a visual decision-ready at any screen size.
- **18 reference notes and two copyable skeletons** the agent opens only when needed.

---

## Install

### 1. CLI — one command (recommended)

```bash
npx skills add rsshethia/pbviz-skills
```

The CLI detects your agents and asks where to install. Claude Code gets `.claude/skills/`; universal agents share `.agents/skills/`.

> If you run this from inside an agent session, it may install only to `.agents/skills/`, which Claude Code does not read. Pass the agent explicitly: `npx skills add rsshethia/pbviz-skills -a claude-code`.

Multi-agent alternative:

```bash
npx skillkit install rsshethia/pbviz-skills
```

### 2. Claude Code plugin

```bash
/plugin marketplace add rsshethia/pbviz-skills
/plugin install powerbi-visuals@pbviz-skills
```

`/plugin` works in an interactive Claude Code CLI session. In non-interactive environments use:

```bash
claude plugin marketplace add rsshethia/pbviz-skills
claude plugin install powerbi-visuals@pbviz-skills
```

### 3. OpenAI Codex plugin

```bash
codex plugin marketplace add rsshethia/pbviz-skills
```

Then open `/plugins` inside a Codex session and select **powerbi-visuals**.

### 4. Clone and copy (any agent)

```bash
git clone https://github.com/rsshethia/pbviz-skills.git
cp -r pbviz-skills/skills/powerbi-visuals .agents/skills/
```

The folder name must stay `powerbi-visuals` — it matches `name` in the frontmatter.

### 5. Our installers

```powershell
git clone https://github.com/rsshethia/pbviz-skills.git
cd pbviz-skills
.\install.ps1                          # ~/.claude/skills/powerbi-visuals
.\install.ps1 -Target claude-project   # ./.claude/skills/powerbi-visuals
.\install.ps1 -Target agents-project   # ./.agents/skills/powerbi-visuals
```

macOS/Linux:

```bash
./install.sh                    # or: ./install.sh agents-project
```

Then **restart your agent**.

### 6. No install

Download the ZIP, unzip it, and ask your AI to read `skills/powerbi-visuals/SKILL.md`. You can also upload that folder's `SKILL.md` and `references/` into a ChatGPT project or custom GPT knowledge base.

---

## Usage

Just ask:

```
"Build a bar chart custom visual with colors from the report theme"
→ uses powerbi-visuals

"Why is my visual blank?"
→ uses powerbi-visuals

"Publish my visual to AppSource and get it certified"
→ uses powerbi-visuals
```

You can also invoke it directly with `/powerbi-visuals`, or say "use the powerbi-visuals skill".

### Example run

Ask: *"Build a simple category bar chart with theme colors."*

The skill produces the contract first:

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

Then the `IVisual` implementation, with guarded `dataViews[0]`, selection IDs, and colors from `host.colorPalette`. A weak agent skips `privileges`, hard-codes colors, and assumes data always exists — this skill prevents all three.

---

## How the agent uses it

1. It sees only `name` + `description` first. The description names the questions: *why is the visual blank, which mapping should I use, will it pass certification*.
2. On a match it loads `SKILL.md`, states the situation, and follows the workflow.
3. A **Question → Reference** table routes it to the one note it needs. It reads bundled files from the installed directory, not a remote URL.
4. `examples/` files are skeletons to adapt, not finished code.

Keep the folder intact: `SKILL.md` uses relative links to `references/` and `examples/`.

---

## Repository layout

```
pbviz-skills/
├── skills/powerbi-visuals/
│   ├── SKILL.md                  # entry point
│   ├── references/               # 18 detailed notes
│   ├── examples/                 # ui-starter + data-binding skeletons
│   └── evals/triggers/prompts.json
├── .claude-plugin/               # Claude Code plugin + marketplace
├── .codex-plugin/                # Codex plugin
├── scripts/validate.mjs          # no-dependency validation
├── install.ps1 / install.sh
├── AGENTS.md
├── VERSIONS.md
├── LICENSE
└── README.md
```

### Reference notes

| File | Covers |
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

---

## Check it works

Ask: *"I want a bar chart custom visual with colors from the report theme. What should I do?"*

A working install mentions `pbiviz`, `capabilities.json`, `dataRoles`, `IVisual.update`, and `host.colorPalette`.

| Problem | Fix |
| --- | --- |
| Skill not listed | Restart the agent; check the folder is `<skills-dir>/powerbi-visuals/SKILL.md` |
| Folder named differently | Rename it to `powerbi-visuals` |
| Links to references fail | Keep `references/` and `examples/` beside `SKILL.md` |
| Can ChatGPT use it? | Yes — upload `SKILL.md` + `references/` into a project or custom GPT knowledge |

For contributors:

```bash
node scripts/validate.mjs
```

This checks frontmatter, name/directory match, description length, reference links, and version consistency. Trigger prompts are in `evals/triggers/prompts.json`.

---

## Update or remove

```bash
git pull
npx skills add rsshethia/pbviz-skills      # or rerun your installer
```

Remove by deleting the installed `powerbi-visuals` folder, or `npx skills remove powerbi-visuals`.

---

## Sources

Official docs: <https://learn.microsoft.com/en-us/power-bi/developer/visuals/>

The older community repo <https://github.com/PowerBi-Projects/PowerBI-visuals> is deprecated; Microsoft Learn is the source of truth.
