# AGENTS.md

Guidelines for AI agents working in this repository.

## Repository overview

This repo is a single **Agent Skill** for building Power BI custom visuals. It follows the [Agent Skills spec](https://agentskills.io/specification.md).

```
pbviz-skills/
├── skills/powerbi-visuals/
│   ├── SKILL.md          # required entry point
│   ├── references/       # detailed notes, linked from SKILL.md
│   ├── examples/         # copyable skeletons
│   └── evals/triggers/   # trigger prompts
├── .claude-plugin/       # Claude Code plugin + marketplace manifests
├── .codex-plugin/        # Codex plugin manifest
├── scripts/validate.mjs  # no-dependency validation
├── install.ps1 / install.sh
├── VERSIONS.md
└── LICENSE               # MIT
```

## Rules

- Read `skills/powerbi-visuals/SKILL.md` before making changes; keep it under 500 lines.
- `name` in frontmatter must match the directory name (`powerbi-visuals`); description must be ≤500 characters and name the questions the skill answers.
- Every file in `references/` must be linked from `SKILL.md` or another reference.
- Put depth in `references/`, not in `SKILL.md`.
- Microsoft Learn and `powerbi-visuals-api` are the source of truth for APIs; verify before using a version-gated feature.
- Bump `metadata.version` in `SKILL.md`, the row in `VERSIONS.md`, and the plugin manifest versions together on any shipped change.

## Verify before committing

```bash
node scripts/validate.mjs
```

See `evals/triggers/prompts.json` for trigger checks when changing the description.
