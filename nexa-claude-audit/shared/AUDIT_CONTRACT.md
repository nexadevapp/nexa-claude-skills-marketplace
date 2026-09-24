# Audit Contract

Every skill in `nexa-claude-audit` follows this contract. A skill's `SKILL.md` adds only what is
specific to that skill. When the two disagree, the skill's `SKILL.md` wins.

## Invocation

- The user calls each skill explicitly. Never run an audit skill on your own initiative, and
  never from another skill.
- Each skill runs alone. Do not read or depend on the report of another audit skill.

## Scope

- Read the repository only. Do not run tests, builds, installs, or deployments.
- Do not call an external service (GitHub, Jira, Linear, Confluence, a CI server, a cloud API).
  Mention an external reference; never resolve it.
- The only file a skill writes is its report.
- A skill can state a scope exception in its `SKILL.md` (for example, to run an analyser or the
  tests in a temporary git worktree). The rule "the only file a skill writes is its report" stays.
- Exclude generated, vendored, and dependency folders from every search: `node_modules/`,
  `vendor/`, `.git/`, `dist/`, `build/`, `.next/`, `target/`, `coverage/`, `.venv/`, `docs/audit/`,
  and any path in `.gitignore`.

## Glossary

Use these terms, and only these terms, in every skill and every report:

| Term | Meaning |
|------|---------|
| Use case | A functional requirement with a unique ID, for example `UC-012`. Do not call it "invariant". |
| External reference | An ID that points outside the repository, for example `JIRA-123` or `#45`. |
| Test | One test case (`it`, `test`, `def test_…`, `@Test`, `func TestX`, `t.Run`), not a test file. |

## Process

Run these steps before the skill-specific steps.

### 1. Establish the report context

1. Get the date: `date +%F`.
2. Get the commit: `git rev-parse HEAD` (full hash) and `git rev-parse --short HEAD` (short hash).
   If the repository has no commit, use `nocommit` for both.
3. Get the branch: `git branch --show-current`. Write `detached` when it is empty.
4. Get the working tree state: `git status --porcelain`. When it is not empty, record
   `Uncommitted changes: yes`; else `no`.

### 2. Detect the stack

Detect the languages, frameworks, and test runners from the manifest files before you audit:
`package.json`, `go.mod`, `pyproject.toml`, `requirements.txt`, `pom.xml`, `build.gradle*`,
`Cargo.toml`, `*.csproj`, `Gemfile`, `composer.json`. Use the stack to select the search patterns
in the skill. Stay stack-agnostic: a pattern list in a skill is a starting point, not a limit.

Nexa conventions (`docs/use_cases/UC-XXX*.md`, `docs/requirements.md`, `docs/entity_model.md` or
`docs/entity-model.md`) are preferred sources when they exist. They are not required.

### 3. Select the report path

- Path: `docs/audit/<skill>/<skill>-YYYY-MM-DD-<short-hash>.md`
  (example: `docs/audit/qa-audit/qa-audit-2026-09-21-a1b2c3d.md`).
- Every run adds a new file. Never change an earlier report.
- If the file name exists already, append `-2`, `-3`, and so on
  (`qa-audit-2026-09-21-a1b2c3d-2.md`).

## Report rules

### Header

Every report starts with:

```markdown
# <Skill title> — <YYYY-MM-DD>

| Field | Value |
|-------|-------|
| Skill | <skill name> |
| Date | <YYYY-MM-DD> |
| Branch | <branch> |
| Commit | <full hash> |
| Uncommitted changes | yes / no |
| Glossary | https://github.com/nexadevapp/nexa-claude-skills-marketplace/blob/main/nexa-claude-audit/glossary/<skill name>.md |
```

The glossary file explains the terms of the report to the human reader. Do not read it; write
the link only.

Then a `## Summary` section (at most 10 lines), then a `## Gaps` list, then the detail sections of
the skill in the order that the skill gives.

### Evidence

- Every claim links to a relative repository path, with a line anchor when useful
  (`src/auth/login.ts#L42`).
- The report is three folders deep, so every link starts with `../../../`
  (for example `[login.ts](../../../src/auth/login.ts#L42)`). Link to a folder with a trailing `/`.
- Never invent a component, test, use case, requirement, or resource. When the evidence is weak,
  say so in the row.
- Keep every section of the skill's report template. When a section has no findings, write
  `Not found` and list the places that you searched.

### Secrets

- Never copy a secret value into the report. Name the file and the key only.

### Mermaid

- Every Mermaid block starts with a valid diagram type and has balanced brackets and quotes.
- Keep each diagram readable: at most about 15 nodes. Split a larger diagram into parts.

## Verification

Before you finish, confirm each item, then the skill-specific items:

- [ ] Only the new report file changed (`git status --porcelain`).
- [ ] The file path and name follow the report path rule.
- [ ] The header table, `## Summary` (at most 10 lines), and `## Gaps` come first.
- [ ] The `Glossary` row links to the glossary file of this skill.
- [ ] Every section of the skill's report template is present, with findings or `Not found`
      and the places searched.
- [ ] Every relative link resolves. From the report folder, check each one with `test -e`.
- [ ] The report contains no secret value.
- [ ] No external service was called. External references are listed, not resolved.
- [ ] The report uses only the glossary terms.

Then tell the user the path of the report and its summary.
