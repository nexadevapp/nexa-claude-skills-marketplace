---
name: vision
description: >
  Creates the project vision document (docs/vision.md) through a structured conversation
  with the user. Captures project goals, target users, key features, constraints, and
  success criteria. This is the entry point for new projects — other skills
  (requirements, entity-model, use-case-diagram) depend on the vision document.
  Use when the user asks to "start a new project", "create a vision", "define the project",
  "what are we building", or mentions project vision, project brief, or project definition.
user_invocable: true
arguments: none
---

# Project Vision

## Instructions

Create the project vision document (`docs/vision.md`) by gathering information from the user
through a structured conversation. The vision document is the **foundation** for all subsequent
skills — requirements, entity models, and use case diagrams all reference it.

## Prerequisites

None — this is the entry point for new projects.

## Output

A single Markdown file: `docs/vision.md`

## DO NOT

- Skip sections or leave them as placeholders — gather all information before writing
- Invent features or constraints the user hasn't mentioned
- Write the vision document without user confirmation
- Use vague language — every statement should be specific and verifiable

## Conversation Flow

### Phase 1 — Problem & Purpose

Start by understanding what problem the project solves:

> **Let's define your project vision. I'll ask a few questions to understand what we're building.**
>
> **1. What problem does this project solve?**
> Describe the pain point or need that motivated this project.

Wait for response, then:

> **2. Who experiences this problem?**
> Who are the primary users or stakeholders affected?

Wait for response, then:

> **3. How do they currently solve this problem?**
> What's the status quo? (Manual process, competitor product, nothing)

### Phase 2 — Solution & Scope

> **4. What's your solution in one sentence?**
> The elevator pitch — what does the product do?

Wait for response, then:

> **5. What are the 3-5 core features?**
> The must-haves for the first version. Not a full roadmap — just the essentials.

Wait for response, then:

> **6. What's explicitly OUT of scope for v1?**
> Features you've considered but are deferring. This prevents scope creep.

### Phase 3 — Users & Context

> **7. Describe your primary user persona.**
> Role, goals, technical comfort level, frequency of use.

Wait for response, then:

> **8. Are there other user types?**
> Secondary actors, admins, integrations, etc.

Wait for response, then:

> **9. What's the deployment context?**
> Web app, mobile, desktop, API-only, internal tool, public SaaS, etc.

### Phase 4 — Constraints & Success

> **10. What constraints should we know about?**
> Budget, timeline, technology choices, regulatory requirements, integrations, etc.

Wait for response, then:

> **11. How will you measure success?**
> Specific metrics or outcomes that indicate the project succeeded.

Wait for response, then:

> **12. Is there anything else critical to the vision?**
> Anything I didn't ask that you think is important.

### Phase 5 — Confirmation & Writing

Summarize the gathered information in a brief outline:

> **Here's what I captured:**
>
> **Problem:** [summary]
> **Solution:** [one-liner]
> **Core features:** [list]
> **Out of scope:** [list]
> **Primary user:** [persona]
> **Context:** [deployment]
> **Constraints:** [list]
> **Success metrics:** [list]
>
> **Should I create `docs/vision.md` with this content?**

Wait for user confirmation, then write the document.

## Vision Document Structure

```markdown
# Project Vision: [Project Name]

## Problem Statement

[2-3 paragraphs describing the problem, who experiences it, and current solutions]

## Solution Overview

[1-2 paragraphs describing what the product does and how it addresses the problem]

## Core Features (v1)

| Feature | Description |
|---------|-------------|
| [Feature 1] | [Brief description] |
| [Feature 2] | [Brief description] |
| [Feature 3] | [Brief description] |

## Out of Scope (v1)

- [Deferred feature 1] — [reason]
- [Deferred feature 2] — [reason]

## User Personas

### Primary: [Persona Name]

- **Role:** [Job title or role]
- **Goal:** [What they want to achieve]
- **Technical level:** [Novice / Intermediate / Expert]
- **Usage frequency:** [Daily / Weekly / Occasional]
- **Key pain point:** [What frustrates them today]

### Secondary: [Persona Name] (if applicable)

[Same structure]

## Deployment Context

- **Platform:** [Web / Mobile / Desktop / API]
- **Access:** [Public SaaS / Internal tool / B2B]
- **Environment:** [Cloud provider, infrastructure constraints]

## Constraints

| Constraint | Details |
|------------|---------|
| Timeline | [Target date or duration] |
| Budget | [Budget constraints if any] |
| Technology | [Required stack, integrations] |
| Regulatory | [Compliance requirements] |

## Success Criteria

| Metric | Target |
|--------|--------|
| [Metric 1] | [Specific target] |
| [Metric 2] | [Specific target] |

## Open Questions

- [Any unresolved questions captured during the conversation]

---

*Vision created: [date]*
*Last updated: [date]*
```

## Workflow

1. Greet the user and explain you'll ask questions to define the vision
2. Ask Phase 1 questions (problem, users, status quo) — wait for responses
3. Ask Phase 2 questions (solution, features, scope) — wait for responses
4. Ask Phase 3 questions (personas, context) — wait for responses
5. Ask Phase 4 questions (constraints, success, other) — wait for responses
6. Summarize and ask for confirmation
7. Create `docs/` directory if it doesn't exist
8. Write `docs/vision.md` using the template structure
9. Inform the user the vision is complete and suggest next steps:

> **Vision document created at `docs/vision.md`.**
>
> **Next steps:**
> - Run `/requirements` to derive functional requirements from this vision
> - Run `/use-case-diagram` to create the use case structure
> - Run `/entity-model` to define the data model

## Tips for Good Visions

- **Specificity beats generality** — "Reduce order processing time by 50%" is better than "improve efficiency"
- **Constraints are helpful** — They narrow the solution space and prevent over-engineering
- **Out of scope is as important as in scope** — Explicitly listing what's NOT included prevents scope creep
- **User personas should be concrete** — "Marketing manager at a 50-person company who uses Excel for reporting" is better than "business user"
