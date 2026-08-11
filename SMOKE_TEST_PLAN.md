# Plan: Smoke-test the `nexa-claude-react-spa-dotnet` plugin

## Context

The `nexa-claude-react-spa-dotnet` plugin (6 skills + gate infra) was built and statically
validated (sync `--check` clean, JSON valid, frontmatter/dir names match) but **never executed**.
We want a smoke test that proves the ported skills actually work, without touching HR-Demo.

Constraints discovered while scoping (all verified):
- **Gates hard-block.** Every code-writing skill reads `NEXA_RULES_GATE` (needs `<!-- NEXA_RULES_CONFIGURED -->`
  in `CLAUDE.md`) and `SPRINT_BRANCH_GATE` (needs a `sprint-*` branch). `code-quality` reads only the rules gate.
  The gate files forbid creating the branch "manually" — the intended path is `/setup-project-rules` + `/sprint-kickoff`,
  or an explicit waiver. In a fixture repo **we control**, we satisfy both directly (bake the marker, init on a `sprint-*` branch).
- **HR-Demo has no Nexa `docs/` layout** (`entity_model.md`, `use_cases/`, `designs/` absent) — so the pipeline skills
  have no inputs there anyway.
- **Toolchain is present:** `dotnet 8.0.128` + Docker running → EF/`dotnet ef`/Postgres can really execute.
- The plugin is **not installed** in this session (only core + nextjs are), so `/ef-migration` can't be invoked via the
  Skill tool. The smoke test **executes each skill by following its `SKILL.md` Process as the operating manual** — which is
  also the truest test of whether the ported instructions are correct.

**Chosen approach:** Phase A (static dry-run of all 6 skills, read-only, cross-referenced against HR-Demo for realism),
then Phase C (a real `ef-migration` run) in a **throwaway-but-reusable .NET fixture repo**, decoupled from HR-Demo.

---

## Phase A — Static dry-run (all 6 skills, no execution)

For each skill in `nexa-claude-react-spa-dotnet/skills/`, read its `SKILL.md` (+ templates) and check:
1. **Commands valid** for .NET 8 / EF Core / CRA (`dotnet build`, `dotnet test`, `dotnet ef ...`, `dotnet format`,
   `npm run build`, `npx playwright test`) — correct flags, nothing Prisma/Vitest/oxc left over from the source.
2. **Paths & globs** match a real split-repo layout (`src/<Project>.Api`, `src/<web>`) — sanity-check read-only against
   HR-Demo (`/Users/mariusachim/work/HR-Demo/src/...`) as the realism oracle.
3. **Template references** resolve (`${CLAUDE_PLUGIN_ROOT}/skills/.../templates/...`) and the templates compile in principle
   (xunit fixtures reference real packages: `Testcontainers.PostgreSql`, `Respawn`, `Microsoft.AspNetCore.Mvc.Testing`;
   playwright `E2EUsersController.cs` uses `IPasswordHasher<>`).
4. **Gate & subagent references** correct: shared gate strings verbatim; `deliver-use-case` spawns
   `nexa-claude-react-spa-dotnet:playwright-test` and `nexa-claude-core:evaluate`.
5. **Stack-assumption sanity**: no leftover Next.js concepts; i18n path degrades gracefully (HR-Demo has none).

**Deliverable:** a per-skill findings table (OK / issue + fix). No files written. Any real defect becomes a follow-up
edit to the skill (outside this read-only phase).

---

## Phase C — Real `ef-migration` run in a fixture repo

**Fixture location (default):** `/Users/mariusachim/work/nexa-fixture-dotnet` (sibling of HR-Demo; reusable as a
regression harness; safe to delete). Backend-only — `ef-migration` needs no frontend.

**Setup**
1. `git init` a new repo; create branch `sprint-1`; add a `CLAUDE.md` containing `<!-- NEXA_RULES_CONFIGURED -->`
   (satisfies both gates without needing `/setup-project-rules` + `/sprint-kickoff`).
2. Scaffold a minimal API: `dotnet new webapi -n Fixture.Api` under `src/`; add packages
   `Microsoft.EntityFrameworkCore.Design`, `Npgsql.EntityFrameworkCore.PostgreSQL`; add an empty `AppDbContext`
   registered in `Program.cs`; add the `dotnet-ef` local tool (`dotnet new tool-manifest` + `dotnet tool install dotnet-ef`).
3. Start Postgres for the migration to apply against: `docker run -d --name nexa-fixture-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:16`;
   set the fixture connection string to it.
4. Author input: `docs/entity_model.md` with **one** simple entity (e.g. `Widget { Id, Name (required, ≤100), CreatedAt }`)
   in the format the skill expects.

**Execute (follow `skills/ef-migration/SKILL.md` step by step, as an agent would)**
5. Run its gate checks (both should pass in the fixture), then its Process: generate the `Widget` entity class + Fluent-API
   `DbContext` config (Guid key, validation → annotations/indexes), then `dotnet ef migrations add AddWidget` and
   `dotnet ef database update`.

**Observe / verify**
6. Migration files created under `Migrations/`; `dotnet build` green; the `Widgets` table exists in Postgres
   (`docker exec nexa-fixture-pg psql -U postgres -c '\dt'`); the skill's own Verification step passes.
7. Log every point where the SKILL.md was ambiguous, wrong, or assumed something the fixture didn't have → these are
   skill fixes to apply next.

**Teardown:** `docker rm -f nexa-fixture-pg`; keep or delete the fixture repo (reusable harness for future skill runs —
extend later with a CRA app + a UC spec/design to smoke-test `implement` → `xunit-test` → `playwright-test` → `deliver-use-case`).

---

## Critical files
- Skills under `nexa-claude-react-spa-dotnet/skills/*/SKILL.md` (+ `templates/`); `ef-migration/SKILL.md` is the Phase-C target.
- Gate files `nexa-claude-react-spa-dotnet/shared/readiness/{NEXA_RULES_GATE,SPRINT_BRANCH_GATE,PROJECT_READINESS}.md`.
- HR-Demo (read-only realism oracle): `/Users/mariusachim/work/HR-Demo/src/HRCompensationAnalysis.Api`.

## Verification (of the smoke test itself)
- **Phase A** done = a findings table covering all 6 skills, each marked OK or with a concrete fix.
- **Phase C** done = an EF migration generated **and applied** (table present in Postgres) + `dotnet build` green, driven
  purely by following `ef-migration/SKILL.md`. Any instruction defect is captured as a skill-fix follow-up.
- Net signal: if a skill's written Process can be executed start-to-finish by an agent against a clean .NET repo and
  produces the right artifact, the port is sound; gaps found here are precise, cheap fixes to the SKILL.md.
