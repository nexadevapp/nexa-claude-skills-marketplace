---
name: sprint-deliver
description: >
  Delivers the sprint by executing /deliver-use-case for each use case in priority
  order. Reads the delivery order from the sprint readiness report and starts with
  the first priority. Currently delivers one use case at a time — human in the loop
  is needed after each use case finalization. Will be extended in the future to deliver the full
  sprint autonomously.
user_invocable: true
arguments: none
---

# Sprint Deliver

<!-- TODO: This skill currently delivers only the first-priority use case and stops.
     Future versions will iterate through the full delivery order autonomously,
     handling cross-UC dependencies, running /sprint-audit after all UCs are
     delivered, and generating a cumulative E2E report. -->

## Instructions

Deliver the next use case from the sprint scope by invoking `/deliver-use-case`.

## Step 1: Locate the Sprint Folder

The active sprint is always `docs/sprints/next-sprint/`.

If `docs/sprints/next-sprint/` does not exist, stop and tell the user to run
`/sprint-prepare` first.

## Step 2: Read the Delivery Order

Read `docs/sprints/next-sprint/readiness-report.md`.

Find the **Delivery Order** table. This table lists use cases in recommended delivery
sequence with columns: `#`, `UC ID`, `Name`, `Rationale`.

If the readiness report does not exist or has no Delivery Order table, stop and tell the
user to run `/sprint-prepare` first — the sprint is not ready for delivery.

## Step 3: Identify the First Priority

Select the use case in row `# 1` of the Delivery Order table. Extract its `UC ID`
(e.g., `UC-003`).

Display the selected use case to the user:

```
Sprint: next-sprint
Delivering: <UC ID> — <Name>
Rationale: <Rationale from table>
```

## Step 4: Deliver the Use Case

Invoke `/deliver-use-case <UC ID>`.

Follow the full `/deliver-use-case` pipeline as defined in its SKILL.md — do not
abbreviate or skip any steps.
