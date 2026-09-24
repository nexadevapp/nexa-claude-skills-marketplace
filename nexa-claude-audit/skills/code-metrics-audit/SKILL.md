---
name: code-metrics-audit
description: >
  Writes a dated code metrics audit report for the current repository: cyclomatic complexity,
  duplicated code percentage, coupling between objects (CBO), and depth of inheritance tree
  (DIT), each with a pass / warn / fail status against a fixed threshold. Static analysis only;
  runs no tests and no builds. Works on any repository and any tech stack. Writes only
  docs/audit/code-metrics-audit/code-metrics-audit-YYYY-MM-DD-<hash>.md. This skill must only be
  invoked explicitly via /code-metrics-audit — never inferred from user messages.
disable-model-invocation: true
---

# Code Metrics Audit

## When to use

- The user types `/code-metrics-audit`.
- Never run this skill on your own initiative, and never from another skill.

This skill owns the static code metrics. It does not run tests, and it does not measure coverage
or mutation score; `/test-efficacy-audit` does that.

## Scope exception

This skill may run static analysers (`lizard`, `jscpd`, CK) with an ephemeral runner: `uvx`,
`pipx run`, `npx`, or a JAR in a temporary folder. Put every analyser output in a temporary folder
outside the repository. All other contract scope rules apply: no tests, no builds, no installs into
the repository, and the report is the only file that the skill writes.

Before the first ephemeral run, tell the user which analysers you will run and ask for approval.
When the user declines, or the runner is not available, write `Not measured` and the reason for
each affected metric.

## Thresholds

| Metric | Unit | Pass | Warn | Fail |
|--------|------|------|------|------|
| Cyclomatic complexity (CCN) | function | ≤ 10 | 11–20 | > 20 |
| Duplicated lines | repository | ≤ 3 % | > 3 % and ≤ 5 % | > 5 % |
| CBO (efferent) | class or module | ≤ 9 | 10–14 | > 14 |
| DIT | class | ≤ 4 | 5–6 | > 6 |

The complexity limit of 10 is the same limit as `/code-quality` in the stack plugins.

The status of a per-unit metric is the status of its worst unit. Also give the count of units in
each status.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `code-metrics-audit`.
Title: `Code Metrics Audit`.

### 2. Select the production source

1. Start from the source folders of each detected language (`src/`, `app/`, `lib/`, `internal/`,
   `pkg/`, `cmd/`, `src/main/`, the package folders in `pyproject.toml`).
2. Exclude the contract folders, test files (the patterns of `/qa-audit`), generated code
   (`*_templ.go`, `*.pb.go`, `*.gen.*`, sqlc output, `__generated__/`, files with a
   `Code generated … DO NOT EDIT` header), migrations, and fixtures.
3. Create the temporary folder for analyser output: `TMP="$(mktemp -d)"`. Remove it at the end.
4. Record the included folders and the exclude patterns. The report lists them in `Tools used`.

### 3. Measure the cyclomatic complexity

1. Run `lizard` on the included folders, for example
   `uvx lizard --csv -x "<exclude glob>" <folders> > "$TMP/lizard.csv"`, with one `-x` for each
   exclude pattern. `lizard` supports most
   languages (C/C++, C#, Go, Java, JavaScript, TypeScript, Kotlin, PHP, Python, Ruby, Rust, Swift).
2. From the CCN column, compute the function count, the average, the P90, and the maximum.
3. Count the functions in each status. Record the 20 functions with the highest CCN.

### 4. Measure the duplication

1. Run `jscpd` on the included folders, for example
   `npx jscpd --silent --min-tokens 50 --reporters json --output "$TMP/jscpd" --ignore "<exclude globs>" <folders>`.
2. Read `statistics.total.percentage` (duplicated lines, percent) from `jscpd-report.json`.
3. Record the 20 largest clones: both locations and the line count.

### 5. Measure CBO and DIT

This skill measures efferent CBO: the number of distinct other classes or modules that one class
or module uses. DIT is the number of ancestor classes, without the language root class
(`Object`, `object`). A class with no base class has DIT 0.

Select the method by language, and record it in each row:

- **Java:** run CK (`com.github.mauricioaniche:ck`, the `jar-with-dependencies` artifact from
  Maven Central, in a temporary folder):
  `java -jar "$TMP/ck.jar" <source folder> false 0 false "$TMP/ck/"`. Read `cbo` and `dit` from
  `class.csv`. CK counts `java.lang.Object`, so subtract 1 from `dit`. Method: `tool: CK`.
- **Go:** the unit is the package. CBO = the count of distinct packages of this module that the
  package imports. DIT = `Not applicable`: Go has no class inheritance. Method:
  `computed from source`.
- **Other languages (TypeScript, JavaScript, Python, C#, Kotlin, PHP, Ruby, Rust):**
  - CBO: the unit is the file. CBO = the count of distinct project files or modules that the
    file imports (`import`, `require`, `from … import`, `using`, `use`). Exclude third-party
    packages and the standard library. Method: `computed from source`.
  - DIT: find each class declaration and its base class (`extends`, `class A(B)`, `class A : B`,
    `< B`). Follow the chain inside the repository. When the chain reaches a class outside the
    repository, write `≥ n` and name that base class. Rust has no class inheritance: write
    `Not applicable`. Method: `computed from source`.

Record the 20 units with the highest CBO and the 20 classes with the highest DIT.

### 6. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include every
metric with a warn or fail status, every `Not measured` metric, and every metric with weak
evidence (for example a DIT chain that leaves the repository).

```markdown
## Tools used

| Metric | Tool or method | Version | Command | Included folders | Exclude patterns |
|--------|----------------|---------|---------|------------------|------------------|

## Metrics and thresholds

| Metric | Value | Threshold (pass) | Status | Units: pass / warn / fail |
|--------|-------|------------------|--------|---------------------------|
| Cyclomatic complexity | avg <n>, P90 <n>, max <n> | ≤ 10 per function | | |
| Duplicated lines | <n> % | ≤ 3 % | | — |
| CBO (efferent) | avg <n>, max <n> | ≤ 9 per unit | | |
| DIT | avg <n>, max <n> | ≤ 4 per class | | |

## Complexity hotspots

| Function | File#line | CCN | Status |
|----------|-----------|-----|--------|

## Duplicate blocks

| Location A | Location B | Lines |
|------------|------------|-------|

## Coupling (CBO)

| Unit | Kind (class / file / package) | CBO | Method | Status |
|------|-------------------------------|-----|--------|--------|

## Inheritance depth (DIT)

| Class | File#line | DIT | Chain | Method | Status |
|-------|-----------|-----|-------|--------|--------|
```

## Verification

Confirm the contract checklist, then:

- [ ] Each metric in `Metrics and thresholds` has a value and a status, or `Not measured` with
      the reason.
- [ ] Each status agrees with the threshold table.
- [ ] Each row in `Coupling (CBO)` and `Inheritance depth (DIT)` names its method.
- [ ] No analyser output is in the repository. Only the report changed.
