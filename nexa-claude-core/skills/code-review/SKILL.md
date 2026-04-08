---
name: code-review
description: >
  Reviews code changes for quality, correctness, security, and maintainability with
  an independent perspective. Use when the user asks to "review the code", "check my
  changes", "review the implementation", or mentions code review, PR review, or
  quality check.
context: fork
---

# Code Review

## Instructions

Review the code changes for $ARGUMENTS with an independent, critical perspective.
$ARGUMENTS can be a use case ID (`UC-XXX`), a technical task ID (`TT-XXX`), or a general
description of what to review. If no argument is given, review all uncommitted changes.

You are an independent reviewer. You have NOT seen the implementation reasoning or trade-off
discussions. Judge the code purely on what is there, not on what was intended.

## DO NOT

- Assume the code is correct because it compiles or tests pass
- Suggest stylistic changes that are not aligned with existing codebase conventions
- Propose rewrites or refactors beyond the scope of the changes
- Praise code unnecessarily — focus on actionable findings
- Repeat findings — each issue should appear exactly once

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Review Dimensions

Evaluate the changes across these dimensions, in priority order:

### 1. Correctness

- Does the logic match the specification? Read the spec from `docs/use_cases/` or `docs/technical_tasks/` if a UC/TT ID is given
- Are there off-by-one errors, null/undefined paths, or race conditions?
- Are edge cases handled (empty inputs, boundary values, concurrent access)?

### 2. Security

- Input validation at system boundaries (user input, API requests)
- No SQL injection, XSS, command injection, or path traversal
- No hard-coded secrets, tokens, or credentials
- Proper authentication and authorization checks
- Sensitive data not logged or exposed in error messages

### 3. Error Handling

- Are errors caught at the right level?
- Do error messages help the user understand what went wrong?
- Are failures recoverable where they should be?
- Are errors propagated correctly (not silently swallowed)?

### 4. Maintainability

- Is the code readable without requiring the reviewer to hold excessive state in their head?
- Are names descriptive and consistent with the codebase?
- Is there unnecessary complexity or premature abstraction?
- Are there duplicated logic blocks that should be unified?

### 5. Performance

- Obvious N+1 queries or unnecessary database round-trips
- Missing pagination for list endpoints
- Unbounded data fetching (no limits on query results)
- Expensive operations in hot paths

## Workflow

1. Determine what to review:
   - If a UC/TT ID is given, read the specification from `docs/use_cases/` or `docs/technical_tasks/`
   - Run `git diff` to see uncommitted changes
   - Run `git diff HEAD~1` if changes are already committed
2. Read each changed file in full to understand context (not just the diff)
3. Check the codebase for existing patterns and conventions
4. Evaluate each dimension above
5. Produce a structured review report

## Output Format

```markdown
# Code Review: [UC-XXX / TT-XXX / Description]

## Summary

[1-2 sentence overall assessment: is this ready to merge, or does it need changes?]

## Findings

### Critical (must fix before merge)

- **[File:line]** — [Description of the issue and why it matters]

### Important (should fix before merge)

- **[File:line]** — [Description of the issue and suggested fix]

### Minor (consider fixing)

- **[File:line]** — [Description of the issue]

## Checklist

- [ ] Correctness: Logic matches specification
- [ ] Security: No vulnerabilities introduced
- [ ] Error handling: Failures are handled gracefully
- [ ] Maintainability: Code is readable and follows conventions
- [ ] Performance: No obvious bottlenecks
```
