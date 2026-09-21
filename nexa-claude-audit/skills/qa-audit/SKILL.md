---
name: qa-audit
description: >
  Writes a dated QA audit report for the current repository: an inventory of every automated
  test, each put in exactly one category (unit, integration, E2E, misc), plus the explicitly
  tagged smoke tests and the skipped or disabled tests. Works on any repository and any tech
  stack. Writes only docs/audit/qa-audit/qa-audit-YYYY-MM-DD-<hash>.md. This skill must only be
  invoked explicitly via /qa-audit — never inferred from user messages.
disable-model-invocation: true
---

# QA Audit

## When to use

- The user types `/qa-audit`.
- Never run this skill on your own initiative, and never from another skill.

This skill owns the test inventory. It does not link tests to use cases;
`/requirements-traceability-audit` does that.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `qa-audit`. Title: `QA Audit`.

### 2. Detect the test runners

Find each runner and its configuration, for example `vitest.config.*`, `jest.config.*`,
`playwright.config.*`, `cypress.config.*`, `pytest.ini`, `pyproject.toml` (`[tool.pytest]`),
`conftest.py`, JUnit in `pom.xml` / `build.gradle*`, `go test` (`*_test.go`), `.rspec`.
Also read the test scripts in the manifest (`"test:e2e"`, `Makefile` targets). Record the config
projects of each runner (for example Playwright `projects`, Vitest `workspace`).

### 3. Collect every test

1. List the test files with the stack patterns: `*_test.go`, `*.test.*`, `*.spec.*`, `test_*.py`,
   `*_test.py`, `*Test.java`, `*Tests.cs`, `*.feature`, `spec/**/*_spec.rb`, plus any path that a
   runner config includes.
2. In each file, list every test: `it(`, `test(`, `def test_`, `@Test`, `func Test`, `t.Run(`,
   `Scenario:`. Record the file, the line, and the test name.

### 4. Assign one category per test

Assign the category with the first rule that matches, and record the rule number:

1. An explicit tag or annotation (`@unit`, `@integration`, `@e2e`, pytest markers, JUnit `@Tag`,
   Go build tags such as `//go:build integration`).
2. The folder name (`unit/`, `integration/`, `e2e/`).
3. The file name pattern (`*.int.test.ts`, `*.e2e.ts`, `*_integration_test.go`).
4. The runner or its config project (Playwright and Cypress tests are E2E by default).
5. The test content, with the definitions below.

Definitions:

- **Unit:** a test that checks the smallest testable part of the code, usually one function or
  one class, in isolation. Dependencies are mocked or absent.
- **Integration:** a test that checks several components working together (for example a
  handler with a real database, Testcontainers, `httptest` with real dependencies). It does not
  drive a UI.
- **E2E (user journey test):** a test that drives the application through its UI and follows a
  user journey across several views, carrying state across the steps.
- **Misc:** a test that matches none of the categories above, for example a contract,
  performance, snapshot-only, or architecture test. State the reason in the row.

Each test gets exactly one category. Smoke is an additional marker, not a category.

### 5. Find the smoke tests

Report only tests that are marked explicitly as smoke tests: a tag (`@smoke`,
`@pytest.mark.smoke`), a folder, a file name, or a dedicated config or script. Do not guess.
Definition: a quick, first check that the most critical functions of a build work, before deeper
testing.

### 6. Find the skipped and disabled tests

Search for `.skip`, `.todo`, `.only`, `xit`, `xdescribe`, `test.fixme`, `@Disabled`, `@Ignore`,
`@pytest.mark.skip`, `@pytest.mark.xfail`, `t.Skip(`. Record the file and the line.

### 7. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include, for
example, a category with no tests, tests decided only by rule 5, `.only` left in the code, and
runners with no config.

```markdown
## Test runners

| Runner | Config file | Config projects | Test script |
|--------|-------------|-----------------|-------------|

## Summary counts

| Category | <runner 1> | <runner 2> | Total |
|----------|------------|------------|-------|
| Unit | | | |
| Integration | | | |
| E2E | | | |
| Misc | | | |
| **Total** | | | |

## Unit tests

| Test file | Test name | Runner | Rule that decided the category |
|-----------|-----------|--------|--------------------------------|

## Integration tests

(same table)

## E2E tests (user journey tests)

(same table)

## Misc tests

(same table, with the reason in the rule column)

## Smoke tests

| Test file | Test name | Main category | Smoke marker |
|-----------|-----------|---------------|--------------|

## Skipped and disabled tests

| Test file#line | Test name | Marker |
|----------------|-----------|--------|
```

When a category section has more than 200 rows, group by file and show a count per file instead:
`| Test file | Tests | Runner | Rule that decided the category |`.

## Verification

Confirm the contract checklist, then:

- [ ] Each test is in exactly one category section, and each row names the rule that decided it.
- [ ] The totals in the summary counts table equal the rows (or per-file counts) in the four
      category sections.
- [ ] Each smoke test has an explicit smoke marker in the code or the config.
- [ ] Each skipped or disabled test has a file and line.
