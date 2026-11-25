#!/usr/bin/env node
// Cross-platform validation for this Agent Skill repo. Node 18+, no dependencies.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const read = (p) => readFileSync(resolve(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const exists = (p) => existsSync(resolve(ROOT, p));

function frontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  return end === -1 ? null : text.slice(4, end);
}

function descriptionOf(fm) {
  const m = fm.match(/^description:[ \t]*(.+)$/m);
  if (!m) return "";
  const raw = m[1].trim();
  if (raw.startsWith('"')) {
    try { return JSON.parse(raw); } catch { return raw.replace(/^"|"$/g, ""); }
  }
  if (raw.startsWith("'")) return raw.replace(/^'|'$/g, "");
  return raw;
}

// Skills
const skillsRoot = resolve(ROOT, "skills");
const skills = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && exists(join("skills", d.name, "SKILL.md")))
  .map((d) => d.name);

if (skills.length === 0) errors.push("No skills found under skills/");

let totalDescriptionChars = 0;
for (const name of skills) {
  const path = `skills/${name}/SKILL.md`;
  const text = read(path);
  const fm = frontmatter(text);
  if (!fm) { errors.push(`${path}: missing or unclosed YAML frontmatter`); continue; }

  const nameMatch = fm.match(/^name:[ \t]*(.+)$/m);
  if (!nameMatch) errors.push(`${path}: missing 'name' field`);
  else {
    const n = nameMatch[1].trim();
    if (n !== name) errors.push(`${path}: name '${n}' does not match directory '${name}'`);
    if (!/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(n) || n.includes("--"))
      errors.push(`${path}: invalid name '${n}' (lowercase a-z, 0-9, single hyphens only)`);
  }

  const desc = descriptionOf(fm);
  totalDescriptionChars += desc.length;
  if (!desc) errors.push(`${path}: missing 'description' field`);
  else if (desc.length > 500) errors.push(`${path}: description is ${desc.length} chars (max 500)`);

  const lines = text.split("\n").length;
  if (lines >= 500) warnings.push(`${path}: ${lines} lines (keep SKILL.md under 500)`);

  // Every reference must be linked from SKILL.md or another reference.
  const refDir = resolve(ROOT, "skills", name, "references");
  const mdFiles = [resolve(ROOT, path)];
  if (existsSync(refDir)) {
    for (const f of readdirSync(refDir)) if (f.endsWith(".md")) mdFiles.push(join(refDir, f));
  }
  const allMd = mdFiles.map((f) => readFileSync(f, "utf8")).join("\n");
  const links = [...allMd.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1].split("#")[0]);
  if (existsSync(refDir)) {
    for (const f of readdirSync(refDir)) {
      if (!f.endsWith(".md")) continue;
      if (!links.some((l) => l.endsWith(f) || l.endsWith(basename(f))))
        errors.push(`${path}: references/${f} is not linked from any markdown file`);
    }
  }
}

if (totalDescriptionChars > 24000)
  errors.push(`Descriptions total ${totalDescriptionChars} chars (max 24000)`);

// Versions
const versionsMd = exists("VERSIONS.md") ? read("VERSIONS.md") : "";
const latestRepo = versionsMd.match(/^## (\d+\.\d+\.\d+)/m)?.[1] || null;
const table = Object.fromEntries(
  [...versionsMd.matchAll(/^\|\s*([a-z0-9-]+)\s*\|\s*(\d+\.\d+\.\d+)\s*\|/gm)].map((m) => [m[1], m[2]])
);

const manifestPaths = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".codex-plugin/plugin.json"
];
const manifestVersions = [];
for (const p of manifestPaths) {
  if (!exists(p)) { errors.push(`${p}: missing`); continue; }
  const j = JSON.parse(read(p));
  manifestVersions.push(j.version ?? j.metadata?.version);
}
if (new Set(manifestVersions).size > 1)
  errors.push(`Plugin manifest versions disagree: ${manifestVersions.join(", ")}`);
if (latestRepo && manifestVersions[0] !== latestRepo)
  errors.push(`Manifests say ${manifestVersions[0]} but VERSIONS.md says ${latestRepo}`);

for (const name of skills) {
  const text = read(`skills/${name}/SKILL.md`);
  const v = frontmatter(text)?.match(/^metadata:\s*\n(?:[ \t]+.*\n)*?[ \t]+version:[ \t]*([\d.]+)/m)?.[1];
  if (!v) errors.push(`skills/${name}/SKILL.md: missing metadata.version`);
  else if (table[name] !== v)
    errors.push(`skills/${name}/SKILL.md is ${v} but VERSIONS.md says ${table[name] || "nothing"}`);
}

// Report
console.log("Validating Agent Skill repo");
console.log(`  skills: ${skills.length}`);
console.log(`  description chars: ${totalDescriptionChars}`);
for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);
if (errors.length) {
  console.error(`\nFAILED: ${errors.length} error(s)`);
  process.exit(1);
}
console.log("\nPASS: all checks passed");
