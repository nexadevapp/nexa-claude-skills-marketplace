# Test Efficacy Audit — Glossary

This glossary explains the terms in a test efficacy audit report. It is for the human reader. The
rules and the thresholds that the audit applies are in the
[skill](../skills/test-efficacy-audit/SKILL.md).

## Test runs

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Test efficacy | How much of the code the tests run. | Coverage shows that a line ran. It does not show that a test checks the result of the line. `/mutation-audit` measures that. |
| Test | One test case (`it`, `test`, `def test_…`, `@Test`, `func TestX`, `t.Run`), not a test file. | All counts in the report are counts of tests. |
| Worktree | A temporary copy of the repository at one commit, made with `git worktree`. | The audit runs everything in the worktree, so your working tree does not change. |
| Measured commit | The commit (`HEAD`) that the audit measured. | Uncommitted changes are not measured. |
| Test run | One run of the unit tests and the integration tests, with coverage. | A failing test is a gap. |
| Integration tests | Tests that use Testcontainers to start a real database or service in Docker. | The coverage includes them. |
| Excluded tests | The tests that the audit did not run: E2E tests and tests that need a live external service. | The report gives the filter and the reason. |
| Serial run | The audit runs one test process at a time, with one worker. | It keeps the load low on a machine with limited resources. The run takes longer. |

## Coverage

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Line coverage | The percentage of source lines that the unit tests and the integration tests run. | A covered line is not always a checked line. The mutation score of `/mutation-audit` shows if a test checks the line. |
| Branch coverage | The percentage of decision outcomes (the true side and the false side of each `if`) that the tests run. | It is stricter than line coverage. It has no threshold. |
| Coverage by folder | The line coverage of each top-level source folder. | It shows which parts of the code the tests do not reach. |

## Status and report

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Threshold | The limit that decides the status of a metric. | The skill gives the fixed thresholds. |
| Status | `pass`: the value is within the threshold. `warn`: the value is near the limit. `fail`: the value is outside the limit. | Line coverage has a status. |
| Not measured | The audit could not measure the metric. The row gives the reason. | It is a gap. The value is unknown, not good. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
