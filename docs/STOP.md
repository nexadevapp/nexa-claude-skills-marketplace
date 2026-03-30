# STOP — Docs Inconsistency Analysis

Analysis of logical inconsistencies and contradictions across the `docs/` folder, cross-referenced with actual skill definitions in `nexa-claude-core` and `nexa-claude-nextjs`.

---

## 1. Phase classification of `/use-case-spec` and `/frontend-design`

**CLAUDE.md** classifies `/use-case-spec` and `/frontend-design` as **Construction** phase skills. But all three analysis docs (`elaboration-vs-delivery-analysis.md`, `nexa-core-elaboration-pipeline-analysis.md`, `nexa-bounded-context-sprint-model.md`) treat them as **Elaboration** work — artifacts that must be completed *before* construction begins. The `/refine-use-cases` skill (classified as Elaboration) orchestrates both of them, further confirming they are elaboration activities.

## 2. Monolithic vs. bounded-context elaboration — direct contradiction

- **`nexa-core-elaboration-pipeline-analysis.md`** proposes a unified `/elaborate` skill that processes **all use cases at once** before any delivery begins.
- **`nexa-bounded-context-sprint-model.md`** explicitly criticizes this as *"too monolithic (20+ use cases elaborated before delivery)"* and proposes bounded-context sprints of 2–10 UCs each.
- Both docs are presented as recommendations without acknowledging or resolving this conflict.

## 3. Strict phase separation vs. overlapping tracks

- **`elaboration-vs-delivery-analysis.md`** recommends **strict sequential phasing**: all elaboration must complete before any construction starts.
- **`nexa-bounded-context-sprint-model.md`** explicitly recommends **overlapping**: *"While agents deliver Context A, humans + AI elaborate Context B."*
- These are mutually exclusive strategies presented as simultaneous recommendations.

## 4. Entity Gate location — three different proposals

- **`deliver-use-case-analysis.md`** (P1): Move Entity Gate into `/use-case-spec`.
- **`nexa-core-elaboration-pipeline-analysis.md`**: Entity validation at Step 5 inside the proposed `/elaborate` pipeline.
- **`nexa-bounded-context-sprint-model.md`**: Entity validation during sprint elaboration phase.
- The **actual `/deliver-use-case` SKILL.md** still has it as an Entity Gate at the start of delivery.
- All agree the current location is wrong, but propose three different new locations.

## 5. When/how technical tasks are created — three conflicting sources

- **`/technical-task` SKILL.md**: TTs come from *"user request or prerequisite during UC implementation"* (reactive, during construction).
- **`nexa-core-elaboration-pipeline-analysis.md`**: TTs are auto-discovered from spec patterns at Step 7 of `/elaborate` (proactive, during elaboration).
- **`nexa-bounded-context-sprint-model.md`**: TTs are generated per-context during sprint elaboration.
- These disagree on whether TT creation is reactive or proactive, and at what scope.

## 6. `/elaborate` as the future vs. `/elaborate` as optional fallback

- **`nexa-core-elaboration-pipeline-analysis.md`** proposes `/elaborate` as *the* single entry point, with `/refine-use-cases` demoted to a lightweight gap-analysis-only tool.
- **`nexa-bounded-context-sprint-model.md`** says: *"Keep existing skills; `/elaborate` becomes optional fallback."* The new `/sprint` skill becomes the primary orchestrator.
- One doc elevates `/elaborate`; the next doc demotes it.

## 7. Sprint sizing exceeds stated "one day max" constraint

**`nexa-bounded-context-sprint-model.md`** states sprints are *"one sprint = one day max"*, but the sizing guidelines say 7–10 UCs take *"8–12 hours, high risk"*. A 12-hour sprint exceeds a standard work day, contradicting the "one day max" rule.

## 8. Steps 1–2 of `/deliver-use-case` — optional vs. hard prerequisite

- **`elaboration-vs-delivery-analysis.md`** explicitly recommends: *"Remove 'optional' labels from Steps 1–2. Make them hard prerequisites."*
- **The actual `/deliver-use-case` SKILL.md** still marks Steps 1–2 (spec and design generation) as **Optional** — skip if file exists.
- **`nexa-bounded-context-sprint-model.md`** assumes `/deliver-use-case` is unchanged, meaning Steps 1–2 remain optional.
- The docs disagree on whether this recommendation should be implemented.

## 9. Code quality automation gap

- **`deliver-use-case-analysis.md`** identifies that DoD mentions ESLint, Prettier, and secret scanning but these *"aren't explicitly run"* in the pipeline. Recommends adding a Step 3.5.
- **The `/implement` SKILL.md** says it runs code quality checks as part of implementation.
- **The `/deliver-use-case` SKILL.md** pipeline does not include an explicit `/code-quality` step.
- There is a contradiction: `/implement` claims to handle it, but the analysis doc says it is missing from the pipeline.

## 10. Gap tolerance — hard stop vs. configurable

- **`nexa-core-elaboration-pipeline-analysis.md`**: If gaps exist at Step 10, **STOP**. No delivery until clean.
- **`nexa-bounded-context-sprint-model.md`**: Auto-approve rules allow configurable `max_gaps: 0` — but the existence of the config implies non-zero gaps could be tolerated, and the doc describes auto-progression scenarios.

## 11. Duplicate content — EN and RO analysis docs

`deliver-use-case-analysis.md` and `deliver-use-case-analysis-ro.md` contain identical analysis content in different languages. This is not a logical contradiction, but it creates maintenance risk — if one is updated and the other is not, they will drift.

## 12. `/refine-use-cases` scope claim is inaccurate

**`nexa-core-elaboration-pipeline-analysis.md`** claims `/refine-use-cases` *"doesn't include /prioritize"* and *"doesn't handle technical tasks"* — presenting this as a gap. But `/refine-use-cases` was never designed to do these things; it is a spec/design generation + gap analysis tool. The doc frames a design choice as a deficiency to justify the `/elaborate` proposal.

---

## Summary

The most significant contradictions are **#2** (monolithic vs. bounded-context), **#3** (strict phasing vs. overlapping), and **#6** (`/elaborate` as primary vs. fallback). These represent three docs that each propose a different strategic direction for the same workflow without reconciling with each other. The remaining items are smaller-scale inconsistencies between doc recommendations and actual skill implementations.
