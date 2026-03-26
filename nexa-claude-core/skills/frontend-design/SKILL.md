---
name: frontend-design
description: >
  Creates screen design specifications with layout, components, states, and interactions
  for use cases. Produces wireframe-like design artifacts that guide implementation.
  Use when the user asks to "design a screen", "create a wireframe", "define the UI",
  "design the frontend", or mentions screen design, wireframes, UI layout, or frontend design.
---

# Frontend Design

## Instructions

Create or update a screen design specification for $ARGUMENTS in `docs/designs/`.
$ARGUMENTS is a use case ID (`UC-XXX`) that has an existing specification in `docs/use_cases/`.

The design artifact bridges the gap between the use case specification (what the system does) and
the implementation (how it looks and behaves). It defines screens, layout, components, states,
and interactions without prescribing implementation technology.

## DO NOT

- Skip reading the use case specification first
- Include implementation details (no framework-specific code, CSS classes, or component library names)
- Design screens for steps not in the use case specification
- Omit error states or empty states
- Create pixel-perfect mockups — focus on structure, content hierarchy, and interaction flow
- Add screens or interactions not covered by the Main Success Scenario or Alternative Flows

## Workflow

1. Read the use case specification from `docs/use_cases/`
2. Read the entity model from `docs/entity_model.md` (if applicable)
3. Identify all screens needed from the Main Success Scenario steps
4. For each screen, define:
   - **Purpose** — what the user accomplishes on this screen
   - **Layout** — content zones and their arrangement (header, main, sidebar, footer)
   - **Components** — interactive and display elements (forms, tables, cards, buttons, navigation)
   - **Data displayed** — what information is shown, mapped to entity model attributes
   - **User actions** — what the user can do, mapped to use case steps
   - **States** — default, loading, empty, error, success
5. Map Alternative Flows to screen states and transitions
6. Define navigation flow between screens (what leads where)
7. Document responsive behavior considerations (mobile, tablet, desktop)
8. Save the design to `docs/designs/UC-XXX-design.md`

## Template

Use the structure below for each screen in the design document.

```markdown
# Screen Design: [Use Case Name]

**Use Case:** UC-XXX
**Status:** Draft | Reviewed | Approved

## Screen Map

[List all screens and how the user navigates between them]

### Screen 1: [Screen Name]

**Purpose:** [What the user accomplishes here]
**Triggered by:** [Use case step or navigation action]

#### Layout

[Describe the content zones and their arrangement]

#### Components

| Component | Type | Description | Maps to |
|-----------|------|-------------|---------|
| [Name] | [Form / Table / Card / Button / ...] | [What it shows or does] | [UC step or entity attribute] |

#### Data Displayed

| Field | Source | Format | Notes |
|-------|--------|--------|-------|
| [Field name] | [Entity.attribute] | [Date, currency, text, ...] | [Optional notes] |

#### User Actions

| Action | Trigger | Result | Maps to |
|--------|---------|--------|---------|
| [What the user does] | [Button click, form submit, ...] | [What happens next] | [UC step number] |

#### States

- **Default:** [What the screen looks like on initial load]
- **Loading:** [What the user sees while data loads]
- **Empty:** [What the user sees when there is no data]
- **Error:** [What the user sees when something fails]
- **Success:** [What the user sees after a successful action]

### Screen 2: [Screen Name]

[Repeat structure for each screen]

## Navigation Flow

[Describe how screens connect — what action on Screen 1 leads to Screen 2, etc.]

## Responsive Behavior

- **Desktop:** [Layout notes]
- **Tablet:** [Layout adjustments]
- **Mobile:** [Layout adjustments]
```
