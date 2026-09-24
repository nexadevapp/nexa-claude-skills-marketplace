# Requirements Traceability Audit — Glossary

This glossary explains the terms in a requirements traceability audit report. It is for the human
reader. The rules that the audit applies are in the
[skill](../skills/requirements-traceability-audit/SKILL.md).

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Use case | A functional requirement with a unique ID, for example `UC-012`. | The use case is the unit of traceability in the report. |
| Use case ID | The unique identifier of a use case, for example `UC-012`, `US-3`, `REQ-7`, or `FR-12`. | Traceability depends on this ID. A use case with `no ID` cannot be traced, so it is a gap. |
| Use case catalog | The list of all use cases that the audit found in the repository, with the ID, the title, and the source file. | It is the reference list for the matrix. |
| Traceability | The ability to follow a requirement to the tests that check it. | Good traceability shows which requirements have no test. |
| Traceability matrix | A table that shows, for each use case, the tests that are linked to it. | A `—` in the `Linked tests` column means that no test is linked to that use case. |
| Link | A test that carries the explicit ID of a use case that has a use case document. | Only links appear in the matrix. |
| Link evidence | How the ID appears in or near the test, for example "ID in `describe` name" or "tag `@UC-012`". | It shows why the audit accepted the link. |
| Candidate link | A probable link with no explicit ID, for example a test name that matches a use case title. | A candidate is never in the matrix. Add the use case ID to the test to make it a link. |
| Orphan ID | A use case ID in a test that has no use case document. | The use case document is missing, or the ID in the test is wrong. It is a gap. |
| External reference | An ID that points outside the repository, for example `JIRA-123`, `#45`, or an issue URL. | The audit lists it and does not open it. The report cannot say what it points to. |
| Test | One test case (`it`, `test`, `def test_…`, `@Test`, `func TestX`, `t.Run`), not a test file. | All counts in the report are counts of tests. |
| Test category | The kind of a test: unit, integration, E2E, or misc. | `Tests with no use case ID` gives a count for each category. An E2E or integration test with no ID is the most important one to link. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
