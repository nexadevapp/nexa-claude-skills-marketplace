---
name: report-bug
description: >
  Creates structured bug report documents with reproduction steps, expected vs actual
  behavior, and severity classification. Use when the user asks to "report a bug",
  "file a bug", "document a defect", "log an issue", or mentions a bug, defect,
  regression, or unexpected behavior that needs to be tracked.
---

# Bug Report

## Instructions

Create a bug report document for $ARGUMENTS in `docs/bugs/`. $ARGUMENTS is a description
of the bug, a reference to a use case (`UC-XXX`) or technical task (`TT-XXX`) where
the bug was discovered, or a full GitHub issue URL.

## Origin Detection

Determine the **origin** of the bug report from $ARGUMENTS:

- **`github-issue`** — $ARGUMENTS contains a GitHub issue URL (e.g., `https://github.com/owner/repo/issues/42`). The issue already exists and is the source of truth.
- **`human-in-the-loop`** — $ARGUMENTS is a description or artifact reference with no issue URL. The bug report document becomes the source of truth and a new GitHub issue will be created.

## DO NOT

- Write vague reproduction steps that cannot be followed independently
- Guess the root cause unless evidence is clear — state what is observed, not what is assumed
- Combine multiple unrelated bugs in one report
- Downplay severity — classify based on actual user or system impact
- Skip searching for related bugs — check `docs/bugs/` for duplicates first

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Template

Use [templates/bug-report.md](templates/bug-report.md) as the document structure.

## Example Bug Report

# Bug Report: Order total ignores discount codes

## Overview

| | |
|---|---|
| **Bug ID** | BUG-003 |
| **Title** | Order total ignores discount codes |
| **Severity** | High |
| **Status** | Open |
| **Discovered In** | UC-012 (Place Order) |
| **Reported By** | Evaluation of UC-012 |
| **Origin** | `human-in-the-loop` |
| **GitHub Issue** | https://github.com/acme/store/issues/47 |

## Description

When a valid discount code is applied to an order, the order summary displays the
discounted line items correctly, but the final total is calculated from the original
(undiscounted) prices. The user is charged more than expected.

## Steps to Reproduce

1. Log in as a customer with an active account
2. Add any item to the cart
3. Navigate to checkout
4. Enter discount code `SAVE20` (a valid 20% discount)
5. Observe the line item prices (correctly discounted)
6. Observe the order total

## Expected Behavior

The order total equals the sum of the discounted line item prices plus tax and shipping.

## Actual Behavior

The order total equals the sum of the original (undiscounted) line item prices plus tax
and shipping. The discount is visually applied to line items but not reflected in the total.

## Environment

- Browser: Chrome 125
- OS: macOS 14.5
- Application version: commit `a1b2c3d`

## Related Artifacts

- **Use Case:** UC-012 (Place Order)
- **Business Rule:** BR-007 (Discount Application)
- **Affected Files:** `src/services/order-service.ts`, `src/components/checkout/OrderSummary.tsx`

## Workflow

1. Check `docs/bugs/` for existing bug reports to determine the next BUG-XXX ID and avoid duplicates
2. **If origin is `github-issue`:**
   a. Read the issue body using `gh issue view <issue-number> --json title,body,labels`
   b. Extract the bug description, reproduction steps, and any context from the issue
   c. Set the **Origin** field to the full GitHub issue URL
   d. Set the **GitHub Issue** field to the same URL — do NOT create a new issue
3. **If origin is `human-in-the-loop`:**
   a. Reproduce the bug or gather evidence from the user's description, logs, or test output
   b. Set the **Origin** field to `human-in-the-loop`
4. Write clear, numbered reproduction steps that another developer can follow
5. Document expected vs actual behavior precisely
6. Classify severity based on impact:
   - **Critical** — System crash, data loss, security vulnerability, or complete feature failure
   - **High** — Major feature broken, no workaround, affects many users
   - **Medium** — Feature partially broken, workaround exists, or affects limited users
   - **Low** — Cosmetic issue, minor inconvenience, or edge case
7. Identify related artifacts (use cases, business rules, affected files)
8. Set status to Open
9. **If origin is `human-in-the-loop`:**
   a. Create a GitHub tracking issue by following the **Before Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`
   b. Update the bug report's **GitHub Issue** field with the issue URL
10. **If origin is `github-issue`:**
    a. Follow the **Before Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md` — the issue already exists, so only the hash sync and drift reconciliation steps apply
