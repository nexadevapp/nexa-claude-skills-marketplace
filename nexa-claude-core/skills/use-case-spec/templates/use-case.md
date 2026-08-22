<!--
This comment is part of the template file only. Do not copy it into a
generated use case document.

Copyright 2025-2026 Simon Martinelli and the AI Unified Process contributors.
Part of the AI Unified Process — https://unifiedprocess.ai
Licensed under the Apache License, Version 2.0. See LICENSE and NOTICE.

Modifications Copyright 2026 Nexa (nexadev.app).
This file is derived from the AI Unified Process Marketplace and has been
modified for the Nexa Agentic Engineering methodology.
-->

# Use Case: [Use Case Name]

## Overview

| | |
|---|---|
| **Use Case ID** | UC-XXX |
| **Use Case Name** | [Descriptive Name] |
| **Primary Actor** | [Role] |
| **Goal** | [What the actor wants to achieve] |
| **Depends On** | UC-XXX, UC-YYY · or None |
| **User Interface** | Yes · No |
| **Status** | Draft · Reviewed · Approved · Implemented · Tested · Done · Obsolete |

## Preconditions

- [Condition that must be true before the use case starts]

## Main Success Scenario

1. [Actor action or system response]
2. [Next step]
3. [Continue until goal is achieved]

## Alternative Flows

### A1: [Alternative Flow Name]

**Trigger:** [Condition that triggers this flow]
**Flow:**

1. [Step that diverges from main flow]
2. [Continuation or return to main flow]

## Postconditions

### Success Postconditions

- [State of the system after successful completion]
- [Specific data stored or updated]

### Failure Postconditions

- [State of the system if the use case fails (e.g., "No reservation created", "Original data remains unchanged")]
- [Specific errors displayed to the actor]
- [Deep system state: no partial records or side effects]

## Business Rules

### BR-XXX: [Rule Name]

[Description of the business rule that applies to this use case]

## Amendments

> This section is appended by the `/change-request` workflow when a CR modifies behavior derived
> from this use case. The scenario above is immutable — amendments are recorded here only.

<!-- Append entries below when a CR is delivered. Do not edit the sections above. -->

---

## Reference

### Overview Fields

| Field | Description |
|-------|-------------|
| **Depends On** | The use cases that must reach `Done` before this one can be delivered. Comma-separated `UC-XXX` IDs, or `None`. This row is the authoritative dependency declaration — the scheduler reads it to decide what can be delivered in parallel. `docs/use_cases.puml` mirrors it visually. |
| **User Interface** | `Yes` if the actor interacts with a screen, `No` for background jobs and system-triggered processes with no UI. `No` means no screen design is produced and none is expected. |

### Status Values

| Status      | Description                                      |
|-------------|--------------------------------------------------|
| Draft       | Initial version, still being written.            |
| Review      | Complete, awaiting stakeholder review.           |
| Approved    | Reviewed and approved for implementation.        |
| Implemented | Implementation complete, pending testing.        |
| Tested      | All tests pass, pending final acceptance.        |
| Done        | Fully implemented, tested, and accepted.         |
| Obsolete    | No longer valid, superseded by another use case. |

### Step Writing Guidelines

| Do                                  | Don't                                         |
|-------------------------------------|-----------------------------------------------|
| "User clicks Save button"           | "User triggers onClick handler"               |
| "System validates the email format" | "System runs regex /^[\w]+@[\w]+$/"           |
| "System displays error message"     | "System throws ValidationException"           |
| "User enters check-in date"         | "User populates dateField component"          |
| "System stores the reservation"     | "System executes INSERT INTO reservations..." |
