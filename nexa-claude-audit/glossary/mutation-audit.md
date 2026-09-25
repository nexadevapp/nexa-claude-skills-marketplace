# Mutation Audit — Glossary

This glossary explains the terms in a mutation audit report. It is for the human reader. The
rules and the thresholds that the audit applies are in the
[skill](../skills/mutation-audit/SKILL.md).

## Test runs

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Mutation audit | A check of how well the unit tests detect a change in the behaviour of the code. | Coverage shows that a line ran. The mutation score shows that a test checks the result of the line. |
| Test | One test case (`it`, `test`, `def test_…`, `@Test`, `func TestX`, `t.Run`), not a test file. | All counts in the report are counts of tests. |
| Worktree | A temporary copy of the repository at one commit, made with `git worktree`. | The audit runs everything in the worktree, so your working tree does not change. |
| Measured commit | The commit (`HEAD`) that the audit measured. | Uncommitted changes are not measured. |
| Baseline test run | The first run of the unit tests, before the mutation run. | The mutation run needs a green baseline. When a test fails, the audit does not run the mutation tool. |
| Post test run | The second run of the unit tests, after the mutation run. | It must give the same result as the baseline. |
| Flaky test | A test that passes in one run and fails in another run with the same code. | A different result between the baseline and the post test run shows a flaky test, or a mutation that the tool did not remove. It is a gap. |
| Integration tests | Tests that use Testcontainers to start a real database or service in Docker. | The mutation tool does not run them, because a container start for each mutant is too slow. |
| Excluded tests | The tests that the audit did not run: integration tests, E2E tests, and tests that need a live external service. | The report gives the filter and the reason. |
| Serial run | The audit runs one test process at a time, with one worker. | It keeps the load low on a machine with limited resources. The run takes longer. |

## Mutation testing

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Mutation testing | A method that makes small changes to the code, then runs the tests to see if a test fails. | A test that fails "detects" the change. This is the purpose of a test. |
| Mutant | One copy of the code with one small change, for example `>` changed to `>=`. | Each mutant is one check of the tests. |
| Mutator | The kind of change that makes a mutant, for example "conditional boundary" or "negate condition". | `Original → mutated` shows the change. |
| Detected | A mutant that made a test fail (killed), or made the tests run past the time limit (timeout). | This is the good result. |
| Survived | A mutant that made no test fail. | A test does not check this behaviour. Some survivors are equivalent mutants: the change does not change the behaviour, so no test can detect it. `/mutation-test` in the stack plugins triages them. |
| No coverage | A mutant in code that no test runs. | Add a test that runs this code. |
| Excluded | A mutant that did not compile or could not run. | It is not in the score. |
| Mutation score | Detected / (Detected + Survived + No coverage), on the mutated files. | The percentage of changes that the tests detect. |
| Scope | The files that the audit can mutate: the business logic, or the paths that the user gave. | The score is for the scope, not for the whole repository. |
| Core logic | The code that computes the results of the product: engines, matchers, calculators, rate computation, rules. | The audit mutates it first, so that the budget reaches it. |
| Time budget | The maximum time for the mutation run (default: 30 minutes). | The audit mutates the files in batches and stops at the budget. |
| Files not reached | Files in the scope that the budget did not reach. | The score does not include them. A larger budget reaches more files. |

## Status and report

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Threshold | The limit that decides the status of a metric. | The skill gives the fixed thresholds. |
| Status | `pass`: the value is within the threshold. `warn`: the value is near the limit. `fail`: the value is outside the limit. | The mutation score has a status. |
| Not measured | The audit could not measure the metric. The row gives the reason. | It is a gap. The value is unknown, not good. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
