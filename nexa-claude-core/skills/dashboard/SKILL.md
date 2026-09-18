---
name: dashboard
description: >
  Generates the project overview — a browsable page that shows every cluster, which of its use
  cases are delivered, and which are not, plus the technical tasks that support each cluster and
  the umbrella tasks that support the whole system. Each use case links to its specification, its
  design, and its acceptance tests. Use when the user asks to "update the dashboard", "generate
  the overview", "show project status", "what is delivered", "regenerate the report", or mentions
  the project dashboard, delivery status, or a stakeholder report.
---

# Project Dashboard

## Instructions

Regenerate `docs/overview/` from the project's source documents.

The manifest is **rebuilt from scratch on every run**. No other skill writes to it. A dashboard
that several skills update incrementally drifts from the truth; one that is derived cannot.

## When to use

- After `/deliver-cluster` merges a use case (it calls this skill itself)
- After `/engineer-requirements` changes the clusters
- Whenever a stakeholder asks what is delivered

## Prerequisites

- `docs/engineering/progress.md` — the cluster manifest from `/engineer-requirements`

If it does not exist, generate the overview anyway with every use case under **Unclustered**,
and tell the user that running `/engineer-requirements` will group them.

## DO NOT

- Edit `docs/overview/manifest.json` by hand, or have another skill write to it — it is derived
- Copy content from a source document into the manifest. The manifest holds links and status,
  never prose
- Read `docs/sprints/` — in a project migrated from the sprint workflow it is an inert archive

## Process

### Step 1: Collect the facts

Read each source and take only what the table names:

| Source | Take |
|--------|------|
| `docs/engineering/progress.md` | Cluster names, the use case IDs in each, the technical task IDs in each, and the `Umbrella` row |
| `docs/use_cases/UC-*.md` | Use case name, **Status**, **User Interface**, **Depends On** |
| `docs/designs/UC-*-design.html` | Whether a design exists |
| `docs/delivery/UC-*-iterations.md` | Whether the use case is delivered — this file existing is the project-wide delivered marker |
| `e2e/**/*.spec.ts` (Next.js), `e2e/**/*_test.go` (Go) | The acceptance test file(s) for a delivered use case — found by the use case tag inside the file, **not** by the filename |
| `docs/technical_tasks/TT-*.md` | Task name, **Status**, **Scope** |
| `docs/requirements.md` | The project name, from the first heading |

A use case listed in no cluster goes under **Unclustered**. A technical task whose **Scope** row
is missing goes under **Umbrella**, with a note that its scope is undeclared.

**Finding the acceptance tests.** `/playwright-test` tags each use case inside the test file,
and allows **several use cases in one file** when their journeys share a page. The filename is
therefore not the link — the tag is. The tag depends on the stack:

| Stack | Tag | Search |
|-------|-----|--------|
| Next.js | `test.describe('UC-XXX: ...', uc('UC-XXX'), ...)` | `grep -rl "uc('UC-XXX')" e2e --include='*.spec.ts'` |
| Go | `useCase(t, "UC-XXX", "<scenario>", ...)` as a line of code | `grep -rlE '^[[:space:]]*useCase\(t, "UC-XXX"' e2e --include='*_test.go'` |

Run both searches. A project matches only one of them. The Go pattern accepts only a line that
starts with `useCase(`, because `e2e/trace_test.go` shows `useCase(t, "UC-007", ...)` in a
comment. A comment line starts with `//`, so the pattern does not match it.

A use case can therefore have more than one test file, and two use cases can share one. Set
`tests` to the list of files the grep returns, and to `[]` when it returns nothing.

### Step 2: Write the manifest

Write `docs/overview/manifest.json`:

```json
{
  "project": "Project Name",
  "generated": "YYYY-MM-DD",
  "clusters": [
    {
      "name": "Authentication",
      "useCases": ["UC-001", "UC-002"],
      "technicalTasks": ["TT-003"]
    }
  ],
  "umbrella": { "technicalTasks": ["TT-001"] },
  "useCases": {
    "UC-001": {
      "name": "Register with email",
      "status": "Done",
      "delivered": true,
      "ui": true,
      "dependsOn": [],
      "spec": "../use_cases/UC-001.md",
      "design": "../designs/UC-001-design.html",
      "tests": ["../../e2e/UC-001.spec.ts"],
      "delivery": "../delivery/UC-001-iterations.md"
    },
    "UC-014": {
      "name": "Expire stale sessions",
      "status": "Draft",
      "delivered": false,
      "ui": false,
      "dependsOn": ["UC-001"],
      "spec": "../use_cases/UC-014.md",
      "design": null,
      "tests": [],
      "delivery": null
    }
  },
  "technicalTasks": {
    "TT-001": {
      "name": "Set up the development profile",
      "status": "Done",
      "scope": "Umbrella",
      "spec": "../technical_tasks/TT-001.md"
    }
  },
  "documents": [
    { "id": "requirements",     "name": "Requirements",     "file": "../requirements.md" },
    { "id": "entity-model",     "name": "Entity Model",     "file": "../entity_model.md" },
    { "id": "use-case-diagram", "name": "Use Case Diagram", "file": "../use_cases.puml" }
  ],
  "wireframe": "../wireframes/index.html"
}
```

Rules for the fields that are easy to get wrong:

- `delivered` comes from the delivery log existing, **not** from the `Status` field. A spec can
  say `Done` while nothing was built.
- `ui` is `false` when the specification's **User Interface** row says `No`. The page then shows
  a "no user interface" line instead of a broken design link.
- `design` is `null` when `ui` is `false`, and also when `ui` is `true` but no design file exists
  yet. The page tells those two cases apart from `ui`.
- `tests` is a **list** of paths, because a use case can be covered by more than one spec file and two use cases can share one. It is `[]` until tests exist.
- Omit a document from `documents` when its file does not exist.

### Step 3: Write the pages

Copy both templates verbatim into `docs/overview/`:

- [templates/index.html](templates/index.html) → `docs/overview/index.html`
- [templates/md-viewer.html](templates/md-viewer.html) → `docs/overview/md-viewer.html`

Do not modify them. They read `manifest.json` at load time, so a data change needs no page
change. A later plugin update may bring fixes to them.

The page opens on an overview of all clusters. Each cluster shows a grid of use case cards. A
card is marked **Implemented** or **Not implemented** from `delivered`, and links to the
specification, the design, the acceptance tests, and the delivery log. A use case page shows these
in tabs: Specification, Design, Acceptance tests, Delivery Log.

Create `docs/index.html` if it does not exist:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=overview/">
  <title>Redirecting to the project overview</title>
</head>
<body>
  <p>Redirecting to the <a href="overview/">project overview</a>.</p>
</body>
</html>
```

### Step 4: Tell the user how to open it

The page reads `manifest.json` with `fetch`, which a browser blocks for a `file://` URL, and it
links to `e2e/` which sits above `docs/`. Both need the server to start at the **project root**:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/docs/overview/
```

### Step 5: Report

```
## Project Overview Updated

| Cluster        | Delivered | Total | Technical Tasks |
|----------------|-----------|-------|-----------------|
| Authentication | 3         | 4     | TT-003 (Done)   |
| Reporting      | 0         | 3     | —               |
| Umbrella       | —         | —     | TT-001 (Done)   |

Delivered: 3 of 7 use cases

Open: docs/overview/index.html
```

Name any use case that has no cluster, and any technical task with no **Scope** row.

## Verification

1. `docs/overview/manifest.json` parses as JSON.
2. Every use case in `docs/use_cases/` appears exactly once — in a cluster or under Unclustered.
3. Every technical task in `docs/technical_tasks/` appears exactly once.
4. Opening `docs/overview/index.html` shows every cluster on the overview, with a card for each
   of its use cases, and a delivered count on each cluster in the sidebar.
5. A card with `delivered: true` says **Implemented**. Every other card says **Not implemented**.
6. The **Design** link on a card with a design opens the use case on the Design tab, and the tab
   shows the design. A card with `ui: false` says **No screen**, not a broken design link.
7. A use case whose tag appears in a test file lists every such file on its Acceptance tests
   tab; one with no tagged test file has no such tab. In a Go project, `e2e/trace_test.go` is in
   no use case's `tests`.
8. At a 375 px width the sidebar hides behind the menu button and the page does not scroll
   sideways.
9. `docs/index.html` redirects to the overview.
