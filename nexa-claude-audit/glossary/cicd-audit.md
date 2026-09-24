# CI/CD Audit — Glossary

This glossary explains the terms in a CI/CD audit report. It is for the human reader. The rules
that the audit applies are in the [skill](../skills/cicd-audit/SKILL.md).

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| CI (continuous integration) | An automatic build and test of each change before or after the merge. | It finds errors early, before they reach the main branch. |
| CD (continuous delivery or deployment) | An automatic release of each accepted change to an environment. | The `Deploy target` column shows where each pipeline releases. |
| CI/CD system | The service or tool that runs the pipelines, for example GitHub Actions, GitLab CI, or Jenkins. | The report finds it from the pipeline files. |
| Pipeline | One automated process that a CI/CD system runs, defined in one file. | Each pipeline file has one row in the `Pipelines` table. |
| Trigger | The event that starts a pipeline: a push, a pull request, a schedule, a manual start, or a tag. | It shows when the checks run. |
| Job | One step of a pipeline that runs on its own, for example lint, test, or deploy. | Jobs run in the order that the pipeline file defines (`needs`, `stages`, `dependsOn`). |
| Deploy target | The environment or the platform that a pipeline releases to. | A deploy with no test job before it is a gap. |
| Main pipeline flow | The flowchart of the pipeline that runs on the main branch or on pull requests. | It shows the jobs, their order, and the gates between them. |
| Local gate | A check that runs on the developer machine before a commit or a push, for example a Husky, Lefthook, or pre-commit hook. | A developer can skip a local gate. A pipeline gate is stronger. |
| Quality gate | A check that can stop a merge or a deploy: lint, format, tests, a coverage threshold, a security scan, or a required approval. | The `Blocks` column shows what the gate stops. |
| Test category | The kind of a test: unit, integration, E2E, or misc. | A category that exists in the repository but that no pipeline runs is a gap. |
| Smoke test | A quick first check that the most critical functions of a build work. Smoke is a marker, not a category. | A pipeline often runs the smoke tests after a deploy. |
| Pipeline secret | A secret that a pipeline uses, for example a deploy token. | The report shows the name only, never the value. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
