---
name: evaluate
description: >
  Evaluates whether an implementation satisfies its use case specification and design
  artifact. Checks functional conformance, design conformance, and completeness with
  an independent perspective. Use when the user asks to "evaluate the implementation",
  "check if it matches the spec", "validate the work", or mentions evaluation,
  conformance check, or spec validation.
context: fork
---

# Evaluate Implementation

## Instructions

Evaluate the implementation of $ARGUMENTS against its specification and design artifact.
$ARGUMENTS is a use case ID (`UC-XXX`) or a technical task ID (`TT-XXX`).

You are an independent evaluator. You have NOT seen the implementation process or the
decisions that led to the current code. Your job is to compare what was specified against
what was built and report any gaps.

## DO NOT

- Assume that passing tests mean the implementation is correct
- Review code quality or style (that is the code reviewer's job)
- Suggest improvements beyond what the specification requires
- Skip checking Alternative Flows or edge cases
- Accept partial implementations without flagging missing pieces

## Evaluation Dimensions

### 1. Specification Conformance

Compare the implementation against the use case specification or technical task:

**For Use Cases (UC-XXX):**
- Read the specification from `docs/use_cases/`
- Verify every Main Success Scenario step is implemented
- Verify every Alternative Flow is handled
- Verify every Business Rule is enforced
- Verify Preconditions are validated
- Verify Success and Failure Postconditions are reachable

**For Technical Tasks (TT-XXX):**
- Read the specification from `docs/technical_tasks/`
- Verify every acceptance criterion is met
- Verify the described behavior is implemented

### 2. Design Conformance

If a design artifact exists in `docs/designs/`, compare the implementation against it:

- Are all specified screens implemented?
- Does the layout match the design specification?
- Are all specified components present?
- Do user actions trigger the correct results?
- Are all states handled (default, loading, empty, error, success)?
- Does the navigation flow match the design?

If no design artifact exists, skip this dimension and note it in the report.

### 3. Completeness

- Are there specification requirements with no corresponding implementation?
- Are there implemented features with no corresponding specification (scope creep)?
- Are entity model attributes correctly reflected in the UI and data layer?

## Workflow

1. Read the specification:
   - For **UC-XXX**: Read from `docs/use_cases/`
   - For **TT-XXX**: Read from `docs/technical_tasks/`
2. Read the design artifact from `docs/designs/` (if it exists)
3. Read the entity model from `docs/entity_model.md` (if applicable)
4. Identify all implementation files related to this use case or task
5. Trace each specification requirement to its implementation
6. Trace each design element to its implementation (if design exists)
7. Check for unspecified behavior in the implementation
8. Produce a structured evaluation report

## Output Format

```markdown
# Evaluation: [UC-XXX / TT-XXX]

## Verdict

[PASS | PASS WITH OBSERVATIONS | FAIL]

[1-2 sentence summary of the evaluation result]

## Specification Conformance

### Main Success Scenario

| Step | Specification | Implemented? | Notes |
|------|--------------|--------------|-------|
| 1 | [Step description] | Yes / No / Partial | [Details] |

### Alternative Flows

| Flow | Trigger | Implemented? | Notes |
|------|---------|--------------|-------|
| A1 | [Trigger] | Yes / No / Partial | [Details] |

### Business Rules

| Rule | Description | Enforced? | Notes |
|------|-------------|-----------|-------|
| BR-001 | [Rule] | Yes / No / Partial | [Details] |

## Design Conformance

[If no design artifact exists: "No design artifact found in docs/designs/. Skipped."]

| Screen | Components Present? | States Handled? | Navigation Correct? | Notes |
|--------|-------------------|-----------------|-------------------|-------|
| [Screen name] | Yes / No / Partial | Yes / No / Partial | Yes / No | [Details] |

## Completeness

### Missing from Implementation

- [Specification requirement that has no implementation]

### Unspecified in Implementation (Scope Creep)

- [Implemented feature that has no specification backing]

## Recommendations

- [Actionable items to reach PASS, if verdict is not PASS]
```
