---
name: architecture-audit
description: >
  Writes a dated architecture audit report for the current repository: links to the existing
  architecture documents, diagrams, and ADRs; C4 context, container, and component diagrams,
  sequence diagrams, and entity relationship diagrams in Mermaid, drawn from the code; a 4+1 view
  coverage map; and a trace of the non-functional requirements. Works on any repository and any
  tech stack. Writes only docs/audit/architecture-audit/architecture-audit-YYYY-MM-DD-<hash>.md.
  This skill must only be invoked explicitly via /architecture-audit — never inferred from user
  messages.
disable-model-invocation: true
---

# Architecture Audit

## When to use

- The user types `/architecture-audit`.
- Never run this skill on your own initiative, and never from another skill.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `architecture-audit`.
Title: `Architecture Audit`.

### 2. Find the existing documentation

Search for documents about system design, architecture diagrams, and architecture decisions:

- folders: `docs/`, `doc/`, `architecture/`, `design/`, `adr/`, `docs/adr/`, `docs/decisions/`,
  `decisions/`, `rfcs/`;
- file names that contain `architecture`, `design`, `system`, `overview`, `adr`, `decision`, `rfc`,
  `c4`, and the `README` files (top level and module level);
- diagram sources: `*.puml`, `*.plantuml`, `*.mmd`, `*.drawio`, `*.dsl` (Structurizr),
  `*.excalidraw`, images in doc folders, and Mermaid blocks inside Markdown;
- the Nexa layout: `docs/entity_model.md`, `docs/use_cases.puml`, `docs/wireframes/`, `docs/designs/`.

Summarize each document in one sentence taken from the document. For each ADR, record the title
and the status (`Accepted`, `Superseded`, …) when the ADR states it.

### 3. Read the code

Read before you draw: the entry points (`main`, `cmd/`, `app/`, `src/index.*`, route
definitions), the module boundaries, the data layer (ORM models, migrations, SQL DDL), the
external clients (HTTP clients, SDKs, queues, env vars such as `*_API_URL`), and the deployment
files (`Dockerfile*`, `docker-compose*.yml`, `k8s/`, `*.tf`).

### 4. Draw the discovered diagrams

Draw every diagram in Mermaid. Base every element on the code or the docs. Do not draw an
element that has no source. Under each diagram, add a `Sources:` line with the files that
support it.

1. **C4 context** (`C4Context`): the system, its users, and the external systems it calls.
2. **C4 container** (`C4Container`): the deployable units (apps, services, databases, queues) and
   the protocols between them.
3. **C4 component** (`C4Component`): only for containers where the code has clear module
   boundaries. Else write `Not drawn` and the reason.
4. **Sequence diagrams** (`sequenceDiagram`): the three to five most important workflows. State
   how you chose them (for example "main routes", "use case documents"). Follow the real call
   chain (route → handler → service → repository → database or external system) and use the real
   identifiers as participant names.
5. **Entity relationship diagrams** (`erDiagram`): one diagram per cluster of related entities.
   Source them from the schema (ORM models, migrations, SQL). Prefer the schema over an entity
   model document; when the two differ, say so. Find the clusters in the Nexa cluster docs
   (`docs/engineering/cluster-*-analysis.md`), the bounded contexts, or the top-level domain
   modules. Show the keys (`PK`, `FK`, `UK`) and the cardinality. Mark the entities that two
   clusters share. Keep each diagram small enough to read.

### 5. Map the 4+1 views

Do not draw extra diagrams for the 4+1 model. Map each view to the diagram that covers it.
Mark a view `Not covered` when no diagram in the report supports it.

### 6. Trace the non-functional requirements

Sources: requirement documents, ADRs, and configuration that expresses a quality attribute
(timeouts, rate limits, caching, retries, auth, logging, monitoring, i18n, accessibility).
For each NFR, find the evidence in the code. Status is `implemented`, `partial`, or `not found`.
Also list the quality attributes that the code implements but no document requires.

### 7. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include, for
example, views that are `Not covered`, NFRs with status `not found`, documents that disagree with
the code, and ADRs with no status.

```markdown
## Existing documentation

### System design and architecture overviews

| Document | Summary |
|----------|---------|

### Architecture diagrams

| Diagram | Format | Summary |
|---------|--------|---------|

### Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|

## Discovered diagrams

### C4 context
### C4 container
### C4 component
### Sequence diagrams
(How the workflows were chosen: …)
### Entity relationship diagrams

## 4+1 view coverage

| 4+1 view | Covered by |
|----------|------------|
| Logical | C4 component, ERDs |
| Process | Sequence diagrams |
| Development | C4 component, folder structure |
| Physical | C4 container (and `/infra-audit`) |
| Scenarios | Sequence diagrams |

## Non-functional requirements

| NFR | Source | Evidence in code | Status |
|-----|--------|------------------|--------|

### Quality attributes with no requirement

| Quality attribute | Evidence in code |
|-------------------|------------------|
```

## Verification

Confirm the contract checklist, then:

- [ ] Every diagram has a `Sources:` line, and each listed file exists.
- [ ] No diagram element lacks a source in the code or the docs.
- [ ] The report states how the sequence diagram workflows were chosen.
- [ ] Each 4+1 view names a diagram in the report, or says `Not covered`.
- [ ] Each NFR row has a status of `implemented`, `partial`, or `not found`.
