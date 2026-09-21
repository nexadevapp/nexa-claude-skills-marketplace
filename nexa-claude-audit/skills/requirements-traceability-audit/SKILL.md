---
name: requirements-traceability-audit
description: >
  Writes a dated requirements traceability audit report for the current repository: the use case
  catalog, a matrix of which tests are linked to which use case by an explicit ID, candidate
  links, the gaps, and the external references (Jira keys, issue numbers, URLs) found in the
  repository. Works on any repository and any tech stack. Writes only
  docs/audit/requirements-traceability-audit/requirements-traceability-audit-YYYY-MM-DD-<hash>.md.
  This skill must only be invoked explicitly via /requirements-traceability-audit — never
  inferred from user messages.
disable-model-invocation: true
---

# Requirements Traceability Audit

## When to use

- The user types `/requirements-traceability-audit`.
- Never run this skill on your own initiative, and never from another skill.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `requirements-traceability-audit`.
Title: `Requirements Traceability Audit`.

Search the repository only. Commit messages are not a source.

### 2. Find the existing traceability documentation

Look for a traceability matrix or a coverage map: file names with `traceab`, `matrix`, `rtm`,
`coverage`; `docs/overview/manifest.json` in a Nexa project. Summarize what each one covers.
Do not regenerate it. When it disagrees with the code, say so.

### 3. Build the use case catalog

1. Search the use case documents and requirement catalogs:
   - Nexa layout: `docs/use_cases/UC-*.md`, `docs/requirements.md`.
   - Other layouts: `docs/`, `requirements/`, `specs/`, `*.feature` files, and any Markdown with
     ID patterns such as `UC-\d+`, `US-\d+`, `REQ-\d+`, `FR-\d+`.
2. Record each use case with its ID, title, and source file.
3. When use cases have no IDs, list them with `no ID` and report this as a gap.

### 4. Find the IDs in the tests

Find the test files with the stack patterns (`*_test.go`, `*.test.*`, `*.spec.*`, `test_*.py`,
`*_test.py`, `*Test.java`, `*Tests.cs`, `*.feature`, `spec/**/*_spec.rb`). In each file, search
test names, `describe` blocks, tags, comments, and file names for:

- the use case ID patterns from step 3;
- tags and annotations such as `@UC-`, `@req`, `@issue`, `tag:`, `t.Run("UC-`, `describe('UC-`;
- external references: ticket keys (`[A-Z][A-Z0-9]+-\d+`), issue references (`#\d+`, `GH-\d+`),
  and issue or ticket URLs.

Record each match as `ID → test file:line`, with the test name and how the ID appears.

### 5. Classify the links

- **Link:** a test that carries an explicit use case ID that has a use case document. Record the
  link evidence (for example "ID in `describe` name", "tag `@UC-012`", "listed in the
  traceability doc").
- **Candidate link:** a probable link with no explicit ID (for example the test name matches the
  use case title). Never put a candidate in the matrix. Record the reason.
- **Orphan ID:** a test that references a use case ID that has no use case document.
- **External reference:** an ID that points outside the repository. List it; do not open or
  resolve it.

Give each test with no use case ID the category unit, integration, E2E, or misc, with the
rules of `/qa-audit` (tag, folder, file name, runner, content). Detect it yourself; do not read
a QA audit report.

### 6. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. The `## Gaps` list holds:

- use cases with no linked test;
- tests that reference an ID that has no use case document;
- tests with no use case ID: a count per test category, and the E2E and integration tests by name;
- use cases with `no ID`.

```markdown
## Existing traceability documentation

| Document | What it covers | Agrees with the code |
|----------|----------------|----------------------|

## Use case catalog

| Use case ID | Title | Source file |
|-------------|-------|-------------|

## Traceability matrix

| Use case ID | Linked tests | Link evidence |
|-------------|--------------|---------------|

## Candidate links

| Use case ID | Test | Reason |
|-------------|------|--------|

## Tests with no use case ID

| Category | Count |
|----------|-------|

| Test file | Test name | Category |
|-----------|-----------|----------|
(E2E and integration tests only)

## External references

| Reference | Kind | File#line |
|-----------|------|-----------|
```

## Verification

Confirm the contract checklist, then:

- [ ] Each link in the matrix has an explicit use case ID in the test or in the traceability doc.
- [ ] No candidate link appears in the matrix.
- [ ] Each use case in the catalog appears in the matrix, with tests or with `—`.
- [ ] No external reference was opened or resolved.
