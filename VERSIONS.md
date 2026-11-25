# Versions

Repo release version: **1.0.0** — shared by `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `.codex-plugin/plugin.json`.

## Skills

| Skill | Version |
| --- | --- |
| powerbi-visuals | 1.0.0 |

## Version rules

- **Repo version `x.y.z`**: `x` for restructures or breaking changes, `y` for a new skill, `z` for content updates to an existing skill.
- **Skill version**: lives in `SKILL.md` frontmatter under `metadata.version` and is mirrored above. Bump it on every shipped change to that skill; installed users are not notified otherwise.
- Keep `metadata.version`, all three plugin manifests, and the newest `### x.y.z` block in this file in sync.

## 1.0.0

- Initial release: one `powerbi-visuals` skill with 18 references and two example skeletons.
- Agent Skills layout under `skills/powerbi-visuals/`.
- Claude Code and Codex plugin manifests.
- Cross-platform installers and a validation script.
