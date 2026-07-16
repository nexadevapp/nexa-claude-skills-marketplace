// Deterministic (code) graders for the entity-model skill.
//
// Each grader maps to a `code:<id>` reference in evals.json. A grader receives a
// context { output, requirements } and returns { passed, evidence }. These check the
// mechanical, objective rules from the skill's SKILL.md — the things an LLM judge
// would waste tokens on and grade less reliably. Coverage/accuracy assertions (which
// need judgement) are left to the LLM judge instead.

const REQUIRED_COLUMNS = ["Attribute", "Description", "Data Type", "Length/Precision", "Validation Rules"];

// Validation Rules vocabulary from the skill's reference table. A cell may combine
// these (e.g. "Not Null, Unique"); every comma-separated token must be recognised.
const KNOWN_RULE_TOKENS = [
  /^Primary Key$/,
  /^Sequence$/,
  /^Not Null$/,
  /^Unique$/,
  /^Optional$/,
  /^Foreign Key \([A-Z0-9_]+\.id\)$/,
  /^Min: .+$/,
  /^Max: .+$/,
  /^Values: .+$/,
  /^Format: \w+$/,
];

// ---- parsing helpers -------------------------------------------------------

function extractMermaid(output) {
  const m = /```mermaid\s*\n([\s\S]*?)```/.exec(output);
  return m ? m[1] : null;
}

// Entity tokens that appear in relationship lines of an erDiagram, e.g.
//   AUTHOR ||--o{ BOOK : "writes"
function entitiesInDiagram(mermaid) {
  const names = new Set();
  for (const line of mermaid.split("\n")) {
    const rel = /^\s*([A-Z0-9_]+)\s*[|}o{<>.-]{2,}\s*([A-Z0-9_]+)\s*:/.exec(line);
    if (rel) {
      names.add(rel[1]);
      names.add(rel[2]);
    }
  }
  return names;
}

// All `### NAME` section headings (the entity sections).
function entitySections(output) {
  const names = new Set();
  for (const line of output.split("\n")) {
    const h = /^###\s+([A-Z0-9_]+)\s*$/.exec(line);
    if (h) names.add(h[1]);
  }
  return names;
}

// Parse every markdown table; return array of { headers: [], rows: [[]] }.
function parseTables(output) {
  const tables = [];
  const lines = output.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!isTableRow(lines[i])) continue;
    if (i + 1 >= lines.length || !isSeparatorRow(lines[i + 1])) continue;
    const headers = splitRow(lines[i]);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && isTableRow(lines[j])) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    tables.push({ headers, rows });
    i = j - 1;
  }
  return tables;
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isSeparatorRow = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l) && l.includes("-");
const splitRow = (l) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

// Attribute tables are those whose header row is exactly the 5 required columns.
function attributeTables(output) {
  return parseTables(output).filter(
    (t) => t.headers.length === 5 && t.headers.every((h, idx) => h === REQUIRED_COLUMNS[idx]),
  );
}

// ---- graders ---------------------------------------------------------------

export const graders = {
  "output-exists": ({ output }) => ({
    passed: typeof output === "string" && output.trim().length > 0,
    evidence: output ? `entity_model.md present (${output.length} bytes)` : "entity_model.md missing or empty",
  }),

  "has-er-diagram": ({ output }) => {
    const mermaid = extractMermaid(output);
    const ok = !!mermaid && /\berDiagram\b/.test(mermaid);
    return { passed: ok, evidence: ok ? "found ```mermaid erDiagram block" : "no Mermaid erDiagram block found" };
  },

  "no-attributes-in-diagram": ({ output }) => {
    const mermaid = extractMermaid(output);
    if (!mermaid) return { passed: false, evidence: "no Mermaid block to check" };
    // Attribute blocks render as `ENTITY {` ... `}`. A block opens with `{` at the end
    // of a line and closes with `}` alone on a line — relationship cardinality tokens
    // like `o{` / `}o` never do either, so this distinguishes them reliably.
    const opensBlock = /\{\s*$/m.test(mermaid);
    const closesBlock = /^\s*\}\s*$/m.test(mermaid);
    const hasAttrBlock = opensBlock || closesBlock;
    return {
      passed: !hasAttrBlock,
      evidence: hasAttrBlock ? "diagram contains an attribute `{ ... }` block" : "diagram has relationships only, no attribute blocks",
    };
  },

  "entities-have-sections": ({ output }) => {
    const mermaid = extractMermaid(output);
    if (!mermaid) return { passed: false, evidence: "no Mermaid block to check" };
    const inDiagram = entitiesInDiagram(mermaid);
    const sections = entitySections(output);
    const missing = [...inDiagram].filter((e) => !sections.has(e));
    return {
      passed: missing.length === 0,
      evidence: missing.length === 0
        ? `all ${inDiagram.size} diagram entities have a ### section`
        : `entities in diagram with no ### section: ${missing.join(", ")}`,
    };
  },

  "tables-five-columns": ({ output }) => {
    const allTables = parseTables(output).filter((t) => {
      // Heuristic: a table sitting under an entity section is an attribute table if its
      // first column header is "Attribute". Reference tables (Data Types, etc.) are not.
      return t.headers[0] === "Attribute";
    });
    if (allTables.length === 0) return { passed: false, evidence: "no attribute tables found" };
    const bad = allTables.filter(
      (t) => t.headers.length !== 5 || !t.headers.every((h, idx) => h === REQUIRED_COLUMNS[idx]),
    );
    return {
      passed: bad.length === 0,
      evidence: bad.length === 0
        ? `all ${allTables.length} attribute tables have the 5 required columns`
        : `${bad.length} attribute table(s) have wrong columns; first bad headers: [${bad[0].headers.join(", ")}]`,
    };
  },

  "no-relationships-table": ({ output }) => {
    const ok = !/^#+\s+Relationships\b/m.test(output);
    return { passed: ok, evidence: ok ? "no 'Relationships' heading/table" : "found a 'Relationships' heading (forbidden)" };
  },

  "no-prose-attributes": ({ output }) => {
    const hit = /Key attributes\s*:/i.exec(output);
    return { passed: !hit, evidence: hit ? `found prose attribute list: "${hit[0]}"` : "no prose attribute lists" };
  },

  "fk-references-valid": ({ output }) => {
    const sections = entitySections(output);
    const fkRefs = [...output.matchAll(/Foreign Key \(([A-Z0-9_]+)\.id\)/g)].map((m) => m[1]);
    const dangling = [...new Set(fkRefs)].filter((e) => !sections.has(e));
    return {
      passed: dangling.length === 0,
      evidence: fkRefs.length === 0
        ? "no foreign keys declared"
        : dangling.length === 0
          ? `all ${fkRefs.length} foreign keys reference existing entities`
          : `foreign keys reference missing entities: ${dangling.join(", ")}`,
    };
  },

  "validation-rules-known": ({ output }) => {
    const tables = attributeTables(output);
    const offenders = [];
    for (const t of tables) {
      for (const row of t.rows) {
        const cell = row[4] ?? "";
        if (!cell) continue;
        for (const token of cell.split(",").map((s) => s.trim()).filter(Boolean)) {
          if (!KNOWN_RULE_TOKENS.some((re) => re.test(token))) offenders.push(token);
        }
      }
    }
    const unique = [...new Set(offenders)];
    return {
      passed: unique.length === 0,
      evidence: unique.length === 0
        ? "all Validation Rules values are from the reference vocabulary"
        : `unrecognised Validation Rules tokens: ${unique.slice(0, 5).join(" | ")}`,
    };
  },
};
