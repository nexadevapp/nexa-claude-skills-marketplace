---
name: cicd-audit
description: >
  Writes a dated CI/CD audit report for the current repository: the CI/CD system and local gates,
  a table of every pipeline with its triggers, jobs, test categories, and deploy target, a Mermaid
  flowchart of the main pipeline, the quality gates, and the gaps. Works on any repository and any
  CI system (GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure Pipelines, Bitbucket, and others).
  Writes only docs/audit/cicd-audit/cicd-audit-YYYY-MM-DD-<hash>.md. This skill must only be
  invoked explicitly via /cicd-audit — never inferred from user messages.
disable-model-invocation: true
---

# CI/CD Audit

## When to use

- The user types `/cicd-audit`.
- Never run this skill on your own initiative, and never from another skill.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `cicd-audit`. Title: `CI/CD Audit`.

### 2. Detect the CI/CD system

Search for pipeline definitions: `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`,
`Jenkinsfile`, `azure-pipelines.yml`, `bitbucket-pipelines.yml`, `.buildkite/`, `.drone.yml`,
`.travis.yml`, `cloudbuild.yaml`, `.tekton/`, `argocd/`, and release tools (`.goreleaser.yml`,
`.releaserc*`, `release-please-config.json`).

Also list the local gates: `.husky/`, `lefthook.yml`, `.pre-commit-config.yaml`, hook installers,
and `Makefile` CI targets.

When no pipeline exists, write `Not found` in each section, list the places searched, and still
report the local gates.

### 3. Read each pipeline

For each pipeline file, record the triggers (push, pull request, schedule, manual, tags), the jobs,
their order (`needs`, `stages`, `dependsOn`), and the deploy target.

Detect the test categories that each job runs from its commands and the scripts they call
(`npm run test:e2e`, `go test -tags=integration`, `pytest -m smoke`). Use the `/qa-audit`
categories: unit, integration, E2E, misc, and the smoke marker. Detect them yourself; do not read
a QA audit report.

Also detect the test categories that exist in the repository (runner configs, test folders,
test scripts), so that you can report the ones that no pipeline runs.

### 4. Find the quality gates

List the checks that can block a merge or a deploy: lint, format, tests, coverage thresholds,
security scans, and required approvals when the repository shows them (`CODEOWNERS`, environment
protection in the workflow files, branch rules in config files).

### 5. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. The `## Gaps` list holds:

- test categories that exist in the repository but no pipeline runs;
- deploy steps with no test job before them;
- the secrets that the pipelines use (names only).

```markdown
## CI/CD system

| System | Files |
|--------|-------|

### Local gates

| Tool | File | Checks |
|------|------|--------|

## Pipelines

| Pipeline file | Triggers | Jobs | Test categories run | Deploy target |
|---------------|----------|------|---------------------|---------------|

## Main pipeline flow

(A Mermaid `flowchart LR` of the pipeline that runs on the main branch or on pull requests:
the jobs, their order, and the gates between them. Add a `Sources:` line.)

## Quality gates

| Gate | Kind | Pipeline or file | Blocks |
|------|------|------------------|--------|

## Pipeline secrets

| Secret name | Used in |
|-------------|---------|
```

## Verification

Confirm the contract checklist, then:

- [ ] Each pipeline file in the repository has one row in the pipelines table.
- [ ] Each test category in a row comes from a command in that job, not from a guess.
- [ ] The flowchart shows only jobs and dependencies that the pipeline file defines.
- [ ] The secret names appear without any value.
