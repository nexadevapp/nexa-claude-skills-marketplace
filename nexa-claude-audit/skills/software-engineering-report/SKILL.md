---
name: software-engineering-report
description: >
  Writes a dated software engineering report for the current repository and adds it as a new
  entry to docs/software-engineering-report.md. The report covers requirements traceability,
  quality assurance (the testing pyramid), architecture (existing documentation plus generated
  C4, 4+1, sequence, and ER diagrams in Mermaid), infrastructure, and CI/CD. Works on any
  repository and any tech stack. This skill must only be invoked explicitly via
  /software-engineering-report — never inferred from user messages.
disable-model-invocation: true
---

# Software Engineering Report

## When to use

- The user types `/software-engineering-report`.
- Never run this skill on your own initiative, and never from another skill.

The skill reads the repository and writes to one file: `docs/software-engineering-report.md`.
It does not change any other file. It does not contact an external service (GitHub, Jira,
Linear, Confluence, a CI server). Everything in the report comes from the files in the repository.

## Rules

- **Evidence only.** Every statement, link, and diagram element must come from a file in the
  repository. Do not invent a component, an entity, a workflow, or a test. When there is no
  evidence for a subsection, write `N/A` and one sentence that says what you searched for.
- **Relative links.** The report lives in `docs/`. Every link is relative to `docs/`
  (for example `[tests/unit](../tests/unit/)`, `[UC-001](use_cases/UC-001.md)`). Link to a
  folder with a trailing `/`. Verify that each linked path exists before you write it.
- **Append, never rewrite.** Earlier entries are a historical record. Do not edit, reorder, or
  delete them, even when they are now wrong.
- **Newest entry first.** Insert the new entry directly below the file header, above all earlier
  entries.
- **Scope.** Exclude generated, vendored, and dependency folders from every search:
  `node_modules/`, `vendor/`, `.git/`, `dist/`, `build/`, `.next/`, `target/`, `coverage/`,
  `.venv/`, and any path in `.gitignore`.

## Process

### 1. Establish the report context

1. Get the date and time: `date '+%Y-%m-%d %H:%M %Z'`.
2. Get the commit: `git rev-parse --short HEAD` and `git branch --show-current`. If the working
   tree is dirty (`git status --porcelain` is not empty), record `(uncommitted changes present)`.
3. Detect the languages and frameworks from the manifest files (`package.json`, `go.mod`,
   `pyproject.toml`, `requirements.txt`, `pom.xml`, `build.gradle*`, `Cargo.toml`, `*.csproj`,
   `Gemfile`, `composer.json`). Record them in the entry header. Use them to select the search
   patterns in the next steps.
4. Read `docs/software-engineering-report.md` if it exists. Note the date and commit of the most
   recent entry.

### 2. Requirements traceability

Goal: show how each use case (or invariant) maps to the tests that verify it.

1. **Find the requirement IDs.** Search the documentation for unique IDs:
   - Nexa layout: `docs/requirements.md`, `docs/use_cases/UC-*.md`, `docs/technical_tasks/TT-*.md`,
     `docs/change_requests/`, `docs/bugs/`.
   - Other layouts: `docs/`, `requirements/`, `specs/`, `adr/`, `*.feature` files, and any
     markdown with ID patterns such as `UC-\d+`, `US-\d+`, `REQ-\d+`, `FR-\d+`, `NFR-\d+`,
     `INV-\d+`, `BR-\d+`, `TT-\d+`, `BUG-\d+`.
2. **Find the existing traceability documentation.** Look for a traceability matrix or a
   coverage map (file names with `traceab`, `matrix`, `coverage`, `rtm`; `docs/overview/manifest.json`
   in a Nexa project). If one exists, link it and present its content in a summary table. Do not
   regenerate it.
3. **Find the references in the test code.** In the test folders from step 3.1, grep for:
   - the requirement ID patterns from step 2.1;
   - ticket keys such as `[A-Z][A-Z0-9]+-\d+` (for example `PROJ-123`);
   - issue references such as `#\d+`, `GH-\d+`, and issue or ticket URLs;
   - test tags and annotations such as `@UC-`, `@req`, `@issue`, `tag:`, `t.Run("UC-`, `describe('UC-`.
   Record each match as `ID → test file:line`.
4. **Classify each ID.**
   - *Internal*: the ID has a definition document in the repository. Link the test to that
     document.
   - *External*: the ID has no definition in the repository (for example a Jira key or a GitHub
     issue number). Only list it. Do not fetch it and do not guess what it means.
5. **Build the matrix.** One row per internal requirement ID:

   | ID | Title | Definition | Tests | Status |
   |----|-------|------------|-------|--------|

   `Status` is `Traced` (one or more tests reference the ID) or `Not traced` (no test references
   it). Also list the test references that point to an ID that has no definition (*orphan
   references*).
6. **Summarize.** Count the requirement IDs, the traced IDs, the untraced IDs, the orphan
   references, and the external references. If the repository has no requirement IDs, write
   `N/A` for the matrix and say so.

### 3. Quality assurance

Goal: present the testing pyramid with a link to every folder that holds each test type.

1. **Find the tests.** List the test files with the stack patterns: `*_test.go`, `*.test.*`,
   `*.spec.*`, `test_*.py`, `*_test.py`, `*Test.java`, `*Tests.cs`, `*.feature`, `spec/**/*_spec.rb`.
   Group the files by folder.
2. **Classify each folder** into one or more test types. Use this evidence, in this order:
   folder and file names, build tags and markers (`//go:build integration`, `-tags=e2e`,
   `@pytest.mark.smoke`, `@tag('@smoke')`), test runner configuration (`playwright.config.*`,
   `cypress.config.*`, `vitest.config.*`, `jest.config.*`, `pytest.ini`), the scripts in the
   manifest (`"test:e2e"`, `Makefile` targets), and the imports (`testcontainers`, `@playwright/test`,
   `httptest`).

   | Type | Typical evidence |
   |------|------------------|
   | Unit | Tests next to the source, no I/O, no container, no browser |
   | Integration | `integration` in the path or tag, Testcontainers, a real database, `httptest` with real dependencies |
   | E2E | Playwright, Cypress, Selenium, `e2e` in the path or tag |
   | UAT | `uat`/`acceptance` in the path or tag, Gherkin `*.feature` files, acceptance tests that trace to use cases |
   | Regression | `regression` in the path, tag, or CI job; a named regression suite or gate |
   | Smoke | `smoke` in the path, tag, or CI job; a post-deploy health check |

   If one folder serves two types (for example E2E tests that are also the UAT suite), list it under
   both and say why.
3. **Count** the test files in each type. Count test cases only when a fast grep can do it
   (`func Test`, `it(`, `test(`, `def test_`); otherwise write `—`.
4. **Draw the pyramid.** Write a Mermaid diagram with the counts. The layers are UAT (top),
   E2E, integration, and unit (bottom). Regression and smoke are suites that select tests from
   the layers, so draw them beside the pyramid, not as layers:

   ```mermaid
   flowchart TB
     subgraph Pyramid
       direction TB
       uat["UAT — N"] --- e2e["E2E — N"] --- integration["Integration — N"] --- unit["Unit — N"]
     end
     subgraph Suites
       regression["Regression — N"]
       smoke["Smoke — N"]
     end
   ```

   Then write a table with one row per type: `Type | Folders (links) | Files | Tests | Evidence`.
   Write `N/A` in the `Folders` cell of each type that has no tests.
5. **Note the observations.** In one to five bullets, state facts about the shape of the pyramid
   (for example "no integration tests; E2E tests outnumber unit tests").

### 4. Architecture

#### 4.1 Existing documentation

1. Search for documents about system design, architecture diagrams, and architecture decisions:
   - folders: `docs/`, `doc/`, `architecture/`, `design/`, `adr/`, `docs/adr/`, `docs/decisions/`,
     `decisions/`, `rfcs/`;
   - file names containing `architecture`, `design`, `system`, `overview`, `adr`, `decision`,
     `rfc`, `c4`, `README` (top level and module level);
   - diagram sources: `*.puml`, `*.plantuml`, `*.mmd`, `*.drawio`, `*.dsl` (Structurizr),
     `*.excalidraw`, and Mermaid blocks inside markdown;
   - the Nexa layout: `docs/entity_model.md`, `docs/use_cases.puml`, `docs/wireframes/`, `docs/designs/`.
2. Write three tables — *System design*, *Architecture diagrams*, *Architecture decision records* —
   with the columns `Document (link) | Summary`. Each summary is one sentence from the document
   itself. For ADRs, add the status (`Accepted`, `Superseded`, …) when the ADR states it.
3. Write `N/A` in each table that has no documents.

#### 4.2 Discovery diagrams

Generate every diagram in Mermaid from the code. Put one sentence below each diagram that lists
the files it comes from. If the code does not give the evidence for a diagram, write `N/A` and
the reason. Read the code before you draw: entry points (`main`, `cmd/`, `app/`, `src/index.*`,
route definitions), module boundaries, the data layer (ORM schema, migrations, SQL), external
clients (HTTP clients, SDKs, queues), and the deployment files from step 5.

1. **C4 model.** Write two diagrams:
   - *System context* (`C4Context`): the users and actors, the system, and the external systems
     it calls (from the HTTP clients, SDKs, and environment variables such as `*_API_URL`).
   - *Containers* (`C4Container`): the deployable units (web app, API, worker, database, cache,
     queue) and the protocols between them.
   Add a *Component* diagram (`C4Component`) for the main container only when the code has clear
   module boundaries.
2. **4+1 view model.** Write one subsection per view:
   - *Logical view*: the main domain types and their relations (`classDiagram`).
   - *Development view*: the packages or modules and their dependencies (`flowchart`). Draw only
     the top-level modules, not every file.
   - *Process view*: the runtime processes, threads, workers, scheduled jobs, and message flows
     (`flowchart`).
   - *Physical view*: the deployment nodes from the infrastructure files (`flowchart`).
   - *Scenarios (+1)*: a list of the main workflows, with a link to each sequence diagram in item 3.
3. **Sequence diagrams.** Select the three to seven most important workflows. Prefer the workflows
   that the use cases describe; else select the workflows with the most-used routes or handlers.
   Write one `sequenceDiagram` per workflow from the real call chain (route → handler → service →
   repository → database or external system). Name the participants with the real identifiers.
4. **Entity relationship diagram.** Build the ERD from the data schema (ORM schema, migrations,
   SQL DDL, model structs). Prefer the schema over `docs/entity_model.md`; if the two differ,
   say so.
   - If the project has more than one cluster, write one `erDiagram` per cluster. Find the
     clusters in `docs/engineering/progress.md` or `docs/engineering/cluster-*-analysis.md`
     (Nexa), in the bounded contexts, or in the top-level domain modules. Draw each entity that a
     cluster uses in that cluster's diagram, and also draw the entities it shares with other
     clusters. Mark the shared entities in the text below the diagram.
   - If the project has only one cluster, write one `erDiagram`.
   - Show the keys (`PK`, `FK`, `UK`) and the cardinality. Leave out the audit columns
     (`created_at`, `updated_at`) unless they carry meaning.

Keep each diagram readable: at most about 15 nodes. Split a larger diagram into parts.

### 5. Infrastructure

1. Search for infrastructure definitions: `Dockerfile*`, `docker-compose*.yml`, `compose*.yml`,
   `*.tf` (Terraform), `Pulumi.*`, `cdk.json`, `serverless.yml`, `template.yaml` (SAM), `k8s/`,
   `kubernetes/`, `helm/`, `charts/`, `kustomization.yaml`, `ansible/`, `infra/`, `deploy/`,
   `ops/`, `fly.toml`, `vercel.json`, `netlify.toml`, `render.yaml`, `app.yaml`, `Procfile`,
   `.devcontainer/`, `nginx*.conf`, and the environment profiles (`.env.example`, `config/`).
2. Write a table: `Folder or file (link) | Tool | What it defines`. Group the rows by purpose:
   *local development*, *build and packaging*, *provisioning*, *deployment*.
3. If nothing is found, write `N/A`.

### 6. CI/CD

1. Search for pipeline definitions: `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`,
   `Jenkinsfile`, `azure-pipelines.yml`, `bitbucket-pipelines.yml`, `.buildkite/`, `.drone.yml`,
   `.travis.yml`, `cloudbuild.yaml`, `.tekton/`, `argocd/`, and release tools (`.goreleaser.yml`,
   `.releaserc*`, `release-please-config.json`). Also search for local gates: `.husky/`,
   `.pre-commit-config.yaml`, `lefthook.yml`, `.git/hooks` installers, `Makefile` CI targets.
2. For each pipeline file, read the triggers and the jobs. Write a table:
   `Pipeline (link) | Trigger | Jobs | Gates (lint, test types, coverage, security scan) | Deploys to`.
3. Write a `flowchart LR` of the path from a commit to production when the pipelines show it.
4. State the gaps as facts, for example "no pipeline runs the E2E tests", "no deployment stage".
   Connect each gap to a finding in step 3 when it applies.
5. If nothing is found, write `N/A`.

### 7. Write the entry

1. If `docs/software-engineering-report.md` does not exist, create it with this header:

   ```markdown
   # Software Engineering Report

   Each entry is a dated snapshot of the repository, generated by `/software-engineering-report`.
   The newest entry is first. Earlier entries are not changed.
   ```

2. Insert the new entry directly below the header, above the earlier entries. Use this skeleton:

   ```markdown
   ---

   ## Report — YYYY-MM-DD HH:MM TZ

   | Commit | Branch | Stack | Previous report |
   |--------|--------|-------|-----------------|
   | `abc1234` | `main` | Go 1.23, templ, PostgreSQL | YYYY-MM-DD (`def5678`) or — |

   ### Summary
   <!-- 3–6 bullets: one headline fact per section -->

   ### 1. Requirements Traceability
   #### 1.1 Traceability documentation
   #### 1.2 Traceability matrix
   #### 1.3 Orphan and external references

   ### 2. Quality Assurance
   #### 2.1 Testing pyramid
   #### 2.2 Test types
   #### 2.3 Observations

   ### 3. Architecture
   #### 3.1 Existing documentation
   #### 3.2 Discovery diagrams
   ##### C4 model
   ##### 4+1 view model
   ##### Sequence diagrams
   ##### Entity relationship diagrams

   ### 4. Infrastructure

   ### 5. CI/CD
   ```

3. If a previous entry exists, add a *Changes since the previous report* list to the summary:
   the counts that changed (requirement IDs, traced IDs, test files per type, pipelines).

## Verification

Before you finish, confirm each item:

- [ ] Only `docs/software-engineering-report.md` changed (`git status --porcelain`).
- [ ] The earlier entries are byte-identical to before (`git diff` shows only added lines).
- [ ] The new entry is first, below the header, and has the date, time, and commit.
- [ ] All five sections are present. Each subsection has content or `N/A` with a reason.
- [ ] The QA table has a row for each of the six test types.
- [ ] Every relative link resolves from `docs/`. Check each one with `test -e docs/<link>`.
- [ ] Every Mermaid block has a valid diagram type on its first line and balanced brackets and quotes.
- [ ] There is one ERD per cluster when the project has more than one cluster.
- [ ] No external service was called. External references are listed, not resolved.

Then tell the user the path of the report and the summary bullets of the new entry.
