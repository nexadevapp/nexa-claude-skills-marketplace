#!/usr/bin/env node
//
// validate-skills.mjs — Tier 1 static validation for the Nexa skills marketplace.
//
// This is the cheap, deterministic, blocking gate: it checks that every SKILL.md is
// well-formed and that the repo's own conventions (from CLAUDE.md) hold — WITHOUT
// running any skill. It catches the regressions that actually happen when a SKILL.md
// is edited: a dropped/renamed field, a broken ${CLAUDE_PLUGIN_ROOT} reference, a
// stray version bump, a hardcoded cache path.
//
// It deliberately does NOT re-check what other guards already cover:
//   - byte-identical cross-plugin shared copies  -> scripts/sync-shared.sh --check
//   - skill OUTPUT quality (does running it produce a good artifact) -> Tier 2 evals
//
// Design rule: zero false positives. Every ERROR must be a real, mechanical defect.
// Heuristics that can't be made precise (e.g. dead /slash-command references in prose,
// which collide with file names and package names) are intentionally omitted rather
// than emitted as noisy warnings — a linter is only useful if its red is trusted.
//
// Usage:
//   node scripts/validate-skills.mjs            # validate the whole marketplace
//   node scripts/validate-skills.mjs --json     # machine-readable report on stdout
//
// Exit codes: 0 = no errors (warnings allowed), 1 = one or more errors.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DESCRIPTION_HARD_LIMIT = 1024; // injected into the system prompt; keep it bounded
const DESCRIPTION_SOFT_LIMIT = 900; // warn before the hard cap
const PINNED_PLUGIN_VERSION = "1.0.0"; // CLAUDE.md: never bump plugin.json version

// Frontmatter keys we recognise. Unknown keys are warned about (likely a typo, e.g.
// `descripton:` or `user-invocable:`), never hard-failed — new keys may be legitimate.
const KNOWN_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "context",
  "user_invocable",
  "arguments",
  "allowed-tools",
  "model",
  "license",
  "hint",
  "disable-model-invocation",
]);

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push({ file, msg });
const warn = (file, msg) => warnings.push({ file, msg });

const rel = (p) => p.replace(`${ROOT}/`, "");

// ---------------------------------------------------------------------------
// Minimal frontmatter reader — no YAML dependency. We only need the top-level
// scalar keys and the (possibly folded) description text, so a small hand parser
// keeps this script dependency-free and runnable with bare `node`.
// ---------------------------------------------------------------------------
function parseFrontmatter(raw, file) {
  if (!raw.startsWith("---")) {
    err(file, "missing YAML frontmatter (file must start with `---`)");
    return null;
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    err(file, "frontmatter block is not closed with a `---` line");
    return null;
  }
  const block = raw.slice(3, end).replace(/^\n/, "");
  const lines = block.split("\n");

  const keys = []; // top-level keys, in order, for unknown-key detection
  const values = {}; // key -> single-line scalar value (raw, may be empty for folded)
  const folded = {}; // key -> joined folded/literal block text

  let currentKey = null;
  let foldedLines = null;
  let foldedIndent = null;

  const flushFolded = () => {
    if (currentKey && foldedLines) {
      folded[currentKey] = foldedLines.join(" ").replace(/\s+/g, " ").trim();
    }
    foldedLines = null;
    foldedIndent = null;
  };

  for (const line of lines) {
    const topLevel = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    const isIndented = /^\s+\S/.test(line);

    if (topLevel && !isIndented) {
      flushFolded();
      const key = topLevel[1];
      const rest = topLevel[2].trim();
      keys.push(key);
      currentKey = key;
      if (rest === ">" || rest === "|" || rest === ">-" || rest === "|-") {
        values[key] = ""; // folded/literal scalar; body collected from indented lines
        foldedLines = [];
        foldedIndent = null;
      } else {
        values[key] = rest;
      }
    } else if (foldedLines && (isIndented || line.trim() === "")) {
      if (line.trim() === "") {
        foldedLines.push("");
      } else {
        if (foldedIndent === null) foldedIndent = line.match(/^\s*/)[0].length;
        foldedLines.push(line.slice(foldedIndent));
      }
    }
    // Other continuation lines (e.g. block scalars on a key we don't fold) are ignored.
  }
  flushFolded();

  return { keys, values, folded };
}

// Effective text of a key whether it was inline or a folded/literal block.
function valueText(fm, key) {
  if (fm.folded[key] !== undefined && fm.folded[key] !== "") return fm.folded[key];
  const v = fm.values[key];
  if (v === undefined) return undefined;
  return v.replace(/^["']|["']$/g, "");
}

// ---------------------------------------------------------------------------
// Per-skill validation
// ---------------------------------------------------------------------------
function validateSkill(skillDir, pluginRoot) {
  const dirName = skillDir.split("/").pop();
  const skillFile = join(skillDir, "SKILL.md");
  const fileLabel = rel(skillFile);

  if (!existsSync(skillFile)) {
    err(rel(skillDir), "skill directory has no SKILL.md");
    return;
  }

  const raw = readFileSync(skillFile, "utf8");
  const fm = parseFrontmatter(raw, fileLabel);
  if (!fm) return;

  // Required fields.
  const name = valueText(fm, "name");
  const description = valueText(fm, "description");

  if (!name) {
    err(fileLabel, "frontmatter is missing required field `name`");
  } else if (name !== dirName) {
    err(fileLabel, `frontmatter name "${name}" must match directory name "${dirName}"`);
  }

  if (!description) {
    err(fileLabel, "frontmatter is missing required field `description`");
  } else {
    if (description.length > DESCRIPTION_HARD_LIMIT) {
      err(
        fileLabel,
        `description is ${description.length} chars; must be ≤ ${DESCRIPTION_HARD_LIMIT} (it is injected into the system prompt)`,
      );
    } else if (description.length > DESCRIPTION_SOFT_LIMIT) {
      warn(
        fileLabel,
        `description is ${description.length} chars, approaching the ${DESCRIPTION_HARD_LIMIT} hard cap`,
      );
    }
  }

  // Unknown frontmatter keys (likely typos).
  for (const key of fm.keys) {
    if (!KNOWN_FRONTMATTER_KEYS.has(key)) {
      warn(fileLabel, `unrecognised frontmatter key \`${key}\` (typo? expected one of: ${[...KNOWN_FRONTMATTER_KEYS].join(", ")})`);
    }
  }

  // Body checks.
  const body = raw.slice(raw.indexOf("\n---", 3) + 4);
  if (!/^#\s+\S/m.test(body)) {
    err(fileLabel, "body has no H1 title (`# ...`)");
  }

  // Hardcoded plugin cache paths must never be committed (CLAUDE.md: always use
  // ${CLAUDE_PLUGIN_ROOT}). Match the cache layout, not the env-var form.
  const cacheHit = raw.match(/[^\n]*(?:\.claude\/plugins|plugins\/cache\/)[^\n]*/);
  if (cacheHit) {
    err(fileLabel, `hardcoded plugin cache path — use \${CLAUDE_PLUGIN_ROOT} instead: "${cacheHit[0].trim()}"`);
  }

  // Every ${CLAUDE_PLUGIN_ROOT}/<path> reference must resolve to a real file or dir
  // inside this skill's own plugin. This precisely catches typo'd shared-gate refs,
  // dead skill references, and missing templates.
  const refRe = /\$\{CLAUDE_PLUGIN_ROOT\}((?:\/[A-Za-z0-9_.-]+)+)\/?/g;
  const seen = new Set();
  let m;
  while ((m = refRe.exec(raw)) !== null) {
    let refPath = m[1];
    if (seen.has(refPath)) continue;
    seen.add(refPath);
    const target = join(pluginRoot, refPath);
    if (!existsSync(target)) {
      err(fileLabel, `\${CLAUDE_PLUGIN_ROOT}${refPath} does not resolve (expected at ${rel(target)})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Marketplace + plugin manifest validation
// ---------------------------------------------------------------------------
function validatePlugin(pluginRoot) {
  const manifest = join(pluginRoot, ".claude-plugin", "plugin.json");
  if (!existsSync(manifest)) {
    err(rel(pluginRoot), "plugin has no .claude-plugin/plugin.json");
    return null;
  }
  let json;
  try {
    json = JSON.parse(readFileSync(manifest, "utf8"));
  } catch (e) {
    err(rel(manifest), `invalid JSON: ${e.message}`);
    return null;
  }
  if (json.version !== PINNED_PLUGIN_VERSION) {
    err(rel(manifest), `version is "${json.version}"; CLAUDE.md pins it at "${PINNED_PLUGIN_VERSION}"`);
  }
  if (!json.name) {
    err(rel(manifest), "plugin.json is missing `name`");
  }

  // Validate every skill in this plugin.
  const skillsDir = join(pluginRoot, "skills");
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir)) {
      const skillDir = join(skillsDir, entry);
      if (statSync(skillDir).isDirectory()) validateSkill(skillDir, pluginRoot);
    }
  }
  return json;
}

function validateMarketplace() {
  const mpPath = join(ROOT, ".claude-plugin", "marketplace.json");
  if (!existsSync(mpPath)) {
    err(".claude-plugin/marketplace.json", "marketplace manifest not found");
    return;
  }
  let mp;
  try {
    mp = JSON.parse(readFileSync(mpPath, "utf8"));
  } catch (e) {
    err(rel(mpPath), `invalid JSON: ${e.message}`);
    return;
  }

  for (const plugin of mp.plugins ?? []) {
    const src = plugin.source?.replace(/^\.\//, "");
    if (!src) {
      err(rel(mpPath), `plugin entry "${plugin.name}" has no source`);
      continue;
    }
    const pluginRoot = join(ROOT, src);
    if (!existsSync(pluginRoot)) {
      err(rel(mpPath), `plugin "${plugin.name}" source "${plugin.source}" does not exist`);
      continue;
    }
    const json = validatePlugin(pluginRoot);
    if (json && json.name !== plugin.name) {
      err(rel(mpPath), `marketplace name "${plugin.name}" ≠ plugin.json name "${json.name}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Run + report
// ---------------------------------------------------------------------------
validateMarketplace();

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify({ errors, warnings }, null, 2));
} else {
  const RED = "\x1b[31m";
  const YELLOW = "\x1b[33m";
  const GREEN = "\x1b[32m";
  const DIM = "\x1b[2m";
  const RESET = "\x1b[0m";

  for (const w of warnings) console.log(`${YELLOW}warning${RESET}  ${DIM}${w.file}${RESET}  ${w.msg}`);
  for (const e of errors) console.log(`${RED}error${RESET}    ${DIM}${e.file}${RESET}  ${e.msg}`);

  console.log("");
  if (errors.length === 0) {
    console.log(`${GREEN}✔${RESET} skills valid — ${errors.length} errors, ${warnings.length} warnings`);
  } else {
    console.log(`${RED}✘${RESET} ${errors.length} error(s), ${warnings.length} warning(s)`);
  }
}

process.exit(errors.length === 0 ? 0 : 1);
