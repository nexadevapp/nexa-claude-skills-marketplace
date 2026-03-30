# Analysis: deliver-use-case Workflow

## Summary

Analysis of the `/deliver-use-case` workflow from the `nexa-claude-skills-marketplace` repository, focusing on quality, maintainability, and traceability.

---

## Strengths

### 1. Solid Traceability
- GitHub issue tracking with spec hash for drift detection
- Acceptance criteria derived from spec and automatically synchronized
- Commit messages prefixed with `UC-XXX`, `TT-XXX`, `BUG-XXX`
- Links to spec in issue body

### 2. Comprehensive Quality Gates
- **Definition of Ready** — structural and content validation before implementation
- **Definition of Done** — complete checklist for task completeness, code quality, test coverage, privacy, config management

### 3. Isolated Agent Separation
- The E2E test agent works solely from spec and design, not from the implementation — prevents bias
- The QA agent evaluates independently, without implementation context
- Evaluation cannot be "contaminated" by implementation reasoning

### 4. Automated Fix Loops
- Up to 3 iterations for E2E tests
- Up to 3 iterations for QA evaluation
- Automatic classification: test bug vs implementation bug

### 5. Results Documentation
- Automatic posting to GitHub issue after each test run
- Gap analysis posted as a comment
- Pipeline completion report with per-step status

---

## Identified Issues

### 1. Context Is Lost Between Iterations

**Problem:** When re-launching the E2E or QA agent, there is no formal way to pass the history of previous fixes. After three iterations, the agent doesn't know what it has already tried and what didn't work.

**Impact:** Risk of repeating the same mistakes. The agent may attempt the same fix twice without knowing it failed the first time.

**Example:**
- Iteration 1: Agent fixes selector `.btn-submit` → test fails for a different reason
- Iteration 2: Agent sees the same gap, changes the selector again (possibly back to the original)

### 2. Entity Gate Is Too Late in the Workflow

**Problem:** Entity validation happens after the use case spec already exists, but the spec should have been validated at creation time via `/use-case-spec`.

**Impact:** If someone writes a spec with non-existent entities (referencing `Order` when it doesn't exist in the entity model), this is only discovered at `/deliver-use-case`, when it's too late in the flow and time has been wasted.

**Current flow:**
```
/use-case-spec → (no entity check) → /deliver-use-case → Entity Gate STOP
```

**Ideal flow:**
```
/use-case-spec → Entity Gate → (stop if missing) → /deliver-use-case
```

### 3. Missing Spec-Implementation Versioning

**Problem:** The hash detects drift (spec has changed), but there is no mechanism to know which version of the spec corresponds to the current code in the repo.

**Impact:** If the spec changes between delivery iterations, it's unclear what exactly needs to be re-evaluated. The code may be correct for spec v1 but incorrect for spec v2.

**Missing:**
- Commit SHA of the spec associated with the implementation
- "Last known good" sync timestamp
- Changelog of spec changes between versions

### 4. QA Evaluation Has No Access to Concrete Errors

**Problem:** The QA agent receives test files and the spec, but not the actual error output from Playwright. It can identify theoretical gaps but cannot correlate them with real failures.

**Impact:** QA says "missing test for A3", but the test for A3 may exist and fail for a different reason (timeout, wrong selector). QA cannot perform root cause analysis.

**Current prompt:**
```
Review the Playwright end-to-end tests... compare them against the use case specification...
```

**Should include:**
```
Here is the latest Playwright output:
[paste actual errors]
```

### 5. Definition of Done Has Manual Checks in an Automated Workflow

**Problem:** DoD includes:
- "No lint issues"
- "Conventions followed"
- "No hard-coded secrets"

But the `/deliver-use-case` pipeline does not explicitly run these checks. They are listed, but who verifies them?

**Checks mentioned but not automated:**
- ESLint (`npx eslint .`)
- Prettier (`npx prettier --check .`)
- Secret scanning (grep for API keys, passwords)
- Convention validation (manual review)

---

## Recommendations

### 1. Add Iteration Artifacts

Create a `docs/delivery/{UC-XXX}-iterations.md` file that logs each attempt:

```markdown
# UC-001 Delivery Log

## Iteration 1 — 2026-03-30 06:00 UTC

### E2E Test Run
- **Result:** FAILED (2/5 passed)
- **Failures:**
  - `MSS: user registers...` — Timeout waiting for selector `.verification-link`
  - `AF3: expired token...` — Expected "link expired" but got 404

### Fixes Applied
- Changed selector from `.verification-link` to `[data-testid="verify-link"]`
- Added route handler for `/verify-email` with expired token case

---

## Iteration 2 — 2026-03-30 06:15 UTC
...
```

**Benefit:** Agents in subsequent iterations read it and have full context.

### 2. Move Entity Gate into the use-case-spec Skill

Modify `/use-case-spec` to validate entities at writing time:

```markdown
## Entity Validation (in SKILL.md for use-case-spec)

After writing the specification, scan for entity references:
1. Extract entity names from scenario steps, postconditions, business rules
2. Check each against `docs/entity_model.md`
3. If any entity is missing, STOP and report

Do not mark the spec as complete until all entities exist.
```

**Benefit:** Fail fast — discover the problem immediately, not after hours of work.

### 3. Include Test Failures in the QA Prompt

Modify Phase 1 (QA Evaluation) to also receive Playwright output:

```markdown
> You are a QA specialist. Review the Playwright end-to-end tests...
>
> **Latest test run output:**
> ```
> [paste full Playwright output including errors]
> ```
>
> Your report must include:
> 1. Coverage Matrix
> 2. Gap Analysis
> 3. **Failure Root Cause Analysis** — for each failing test, explain why it failed
>    and whether it's a test bug, implementation bug, or spec ambiguity
```

**Benefit:** QA can correlate theoretical gaps with real errors.

### 4. Automate DoD Checks in the Pipeline

Add an explicit Step 3.5 between Implementation and E2E Tests:

```markdown
### Step 3.5: Automated Quality Checks

Run these checks before proceeding to E2E tests:

1. `npx next build` — must succeed (already in Step 3)
2. `npx eslint . --max-warnings 0` — must pass with no warnings
3. `npx prettier --check .` — must pass
4. `grep -r "sk-" --include="*.ts" --include="*.tsx" src/` — must return empty (no hardcoded API keys)
5. Verify `.env*` files are in `.gitignore`

If any check fails, fix before proceeding.
```

**Benefit:** No longer dependent on human discipline for quality checks.

### 5. Add Spec Version to Tracking

Modify the issue body format:

```markdown
**Spec:** [`docs/use_cases/UC-001.md`](...)

<!-- spec-hash: abc123 -->
<!-- spec-commit: 7f3a2b1 -->
<!-- last-sync: 2026-03-30T06:00:00Z -->
```

On re-delivery after a spec change:
1. Detect hash mismatch
2. Compare `spec-commit` with HEAD
3. Generate a diff of what changed in the spec
4. Include the diff in the re-evaluation prompt

**Benefit:** Clear audit trail of which spec version was implemented.

---

## Prioritization

| # | Recommendation | Impact | Effort | Priority |
|---|----------------|--------|--------|----------|
| 1 | Iteration artifacts | High | Low | **P1** |
| 2 | Entity Gate in use-case-spec | High | Low | **P1** |
| 4 | Automate DoD checks | Medium | Low | **P2** |
| 3 | Test failures in QA prompt | Medium | Medium | **P2** |
| 5 | Spec version tracking | Medium | Medium | **P3** |

---

## Conclusion

The workflow is solid as a foundation. Traceability and quality gates are well designed. The main issues relate to **loss of context between iterations** and **validations that come too late in the flow**. The recommendations above address these gaps with relatively low effort.
