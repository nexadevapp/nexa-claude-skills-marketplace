# QA Audit — Glossary

This glossary explains the terms in a QA audit report. It is for the human reader. The rules that
the audit applies are in the [skill](../skills/qa-audit/SKILL.md).

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Test | One test case (`it`, `test`, `def test_…`, `@Test`, `func TestX`, `t.Run`), not a test file. | All counts in the report are counts of tests, not of files. |
| Test runner | The tool that finds and runs the tests, for example Vitest, Jest, Playwright, pytest, JUnit, or `go test`. | The `Test runners` table shows each runner, its configuration file, and the script that starts it. |
| Config project | A named group of tests inside one runner configuration, for example a Playwright `project` or a Vitest `workspace` entry. | One runner can have several config projects, for example one for each browser. |
| Category | The kind of a test: unit, integration, E2E, or misc. Each test has exactly one category. | The `Summary counts` table shows the balance between the categories. |
| Unit test | A test of the smallest testable part of the code, usually one function or one class, in isolation. Dependencies are mocked or absent. | Unit tests are fast. Most tests in a healthy suite are unit tests. |
| Integration test | A test of several components that work together, for example a handler with a real database. It does not drive a user interface. | Integration tests find errors between components that unit tests cannot find. |
| E2E test (user journey test) | A test that drives the application through its user interface and follows a user journey across several views. | E2E tests are slow and expensive. A small number that covers the critical journeys is usual. |
| Misc test | A test that is not unit, integration, or E2E, for example a contract, performance, snapshot-only, or architecture test. | The row gives the reason. |
| Rule that decided the category | The number of the first rule that assigned the category: 1 tag, 2 folder, 3 file name, 4 runner, 5 test content. | Rules 1 to 4 use explicit evidence. Rule 5 is a judgement from the test content, so the evidence is weaker. |
| Smoke test | A quick first check that the most critical functions of a build work, before deeper testing. Smoke is a marker, not a category. | The report lists only tests with an explicit smoke marker (a tag, folder, file name, or script). It does not guess. |
| Skipped or disabled test | A test that does not run, because of a marker such as `.skip`, `.todo`, `xit`, `@Disabled`, or `t.Skip(`. | A skipped test gives no protection. Each row gives the file and the line. |
| `.only` | A marker that makes the runner run only the marked tests and skip all others. | A `.only` in committed code is a gap: the runner silently skips the other tests. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
