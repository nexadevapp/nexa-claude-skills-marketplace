# Analiză: deliver-use-case Workflow

## Rezumat

Analiza workflow-ului `/deliver-use-case` din repository-ul `nexa-claude-skills-marketplace`, cu focus pe calitate, maintainability și trasabilitate.

---

## Puncte Forte

### 1. Trasabilitate solidă
- GitHub issue tracking cu hash de spec pentru detectarea drift-ului
- Acceptance criteria derivate din spec și sincronizate automat
- Commit messages prefixate cu `UC-XXX`, `TT-XXX`, `BUG-XXX`
- Link-uri către spec în issue body

### 2. Quality Gates comprehensive
- **Definition of Ready** — validare structurală și de conținut înainte de implementare
- **Definition of Done** — checklist complet pentru task completeness, code quality, test coverage, privacy, config management

### 3. Separare în agenți izolați
- Agentul E2E tests lucrează doar din spec și design, nu din implementare — previne bias-ul
- Agentul QA evaluează independent, fără context din implementare
- Evaluarea nu poate fi "contaminată" de raționamentul implementării

### 4. Loop-uri automate de fix
- Până la 3 iterații pentru E2E tests
- Până la 3 iterații pentru QA evaluation
- Clasificare automată: test bug vs implementation bug

### 5. Documentare a rezultatelor
- Postare automată pe GitHub issue după fiecare test run
- Gap analysis postat ca comment
- Pipeline completion report cu status per step

---

## Probleme Identificate

### 1. Contextul se pierde între iterații

**Problema:** Când re-lansezi agentul E2E sau QA, nu există un mod formal de a pasa istoricul fix-urilor anterioare. După trei iterații, agentul nu știe ce a încercat deja și ce n-a mers.

**Impact:** Risc de a repeta aceleași greșeli. Agentul poate încerca același fix de două ori fără să știe că a eșuat prima dată.

**Exemplu:** 
- Iterația 1: Agent fixează selector `.btn-submit` → test pică pentru alt motiv
- Iterația 2: Agent vede același gap, schimbă iar selectorul (poate chiar înapoi la original)

### 2. Entity Gate e tardiv în workflow

**Problema:** Verificarea entităților se face după ce use case spec-ul există, dar spec-ul ar fi trebuit validat la creare prin `/use-case-spec`.

**Impact:** Dacă cineva scrie un spec cu entități inexistente (referință la `Order` când nu există în entity model), descoperă asta abia la `/deliver-use-case`, când e prea târziu în flow și a pierdut timp.

**Flow actual:**
```
/use-case-spec → (no entity check) → /deliver-use-case → Entity Gate STOP
```

**Flow ideal:**
```
/use-case-spec → Entity Gate → (stop if missing) → /deliver-use-case
```

### 3. Lipsă versionare spec-implementare

**Problema:** Hash-ul detectează drift (spec s-a schimbat), dar nu există un mecanism de a ști care versiune a spec-ului corespunde codului curent din repo.

**Impact:** Dacă spec-ul se schimbă între iterații de deliver, nu e clar ce exact trebuie re-evaluat. Codul poate fi corect pentru spec v1, dar incorect pentru spec v2.

**Lipsește:**
- Commit SHA al spec-ului asociat cu implementarea
- Timestamp de "last known good" sync
- Changelog de modificări spec între versiuni

### 4. QA Evaluation nu are acces la erori concrete

**Problema:** Agentul QA primește test files și spec, dar nu și output-ul real de eroare din Playwright. Poate identifica gap-uri teoretice, dar nu poate corela cu failure-urile reale.

**Impact:** QA zice "lipsește test pentru A3", dar poate că testul pentru A3 există și pică din alt motiv (timeout, selector greșit). QA nu poate face root cause analysis.

**Prompt actual:**
```
Review the Playwright end-to-end tests... compare them against the use case specification...
```

**Ar trebui să includă:**
```
Here is the latest Playwright output:
[paste actual errors]
```

### 5. Definition of Done are check-uri manuale într-un workflow automatic

**Problema:** DoD include:
- "No lint issues"
- "Conventions followed"  
- "No hard-coded secrets"

Dar pipeline-ul `/deliver-use-case` nu rulează explicit aceste checks. Sunt listate, dar cine le verifică?

**Checks menționate dar ne-automatizate:**
- ESLint (`npx eslint .`)
- Prettier (`npx prettier --check .`)
- Secret scanning (grep pentru API keys, passwords)
- Convention validation (manual review)

---

## Recomandări

### 1. Adaugă artifact de iterație

Creează un fișier `docs/delivery/{UC-XXX}-iterations.md` care loghează fiecare încercare:

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

**Beneficiu:** Agenții din iterațiile următoare îl citesc și au context complet.

### 2. Mută Entity Gate în use-case-spec skill

Modifică `/use-case-spec` să valideze entitățile la scriere:

```markdown
## Entity Validation (în SKILL.md pentru use-case-spec)

After writing the specification, scan for entity references:
1. Extract entity names from scenario steps, postconditions, business rules
2. Check each against `docs/entity_model.md`
3. If any entity is missing, STOP and report

Do not mark the spec as complete until all entities exist.
```

**Beneficiu:** Fail fast — descoperă problema imediat, nu după ore de muncă.

### 3. Include test failures în prompt-ul QA

Modifică Phase 1 (QA Evaluation) să primească și Playwright output:

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

**Beneficiu:** QA poate corela gap-uri teoretice cu erori reale.

### 4. Automatizează DoD checks în pipeline

Adaugă un Step 3.5 explicit între Implementation și E2E Tests:

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

**Beneficiu:** Nu mai depinzi de disciplina umană pentru quality checks.

### 5. Adaugă spec version în tracking

Modifică issue body format:

```markdown
**Spec:** [`docs/use_cases/UC-001.md`](...)

<!-- spec-hash: abc123 -->
<!-- spec-commit: 7f3a2b1 -->
<!-- last-sync: 2026-03-30T06:00:00Z -->
```

La re-delivery după spec change:
1. Detectează hash mismatch
2. Compară `spec-commit` cu HEAD
3. Generează diff de ce s-a schimbat în spec
4. Include diff-ul în re-evaluation prompt

**Beneficiu:** Clear audit trail de ce versiune a spec-ului a fost implementată.

---

## Prioritizare

| # | Recomandare | Impact | Efort | Prioritate |
|---|-------------|--------|-------|------------|
| 1 | Artifact de iterație | High | Low | **P1** |
| 2 | Entity Gate în use-case-spec | High | Low | **P1** |
| 4 | Automatizare DoD checks | Medium | Low | **P2** |
| 3 | Test failures în QA prompt | Medium | Medium | **P2** |
| 5 | Spec version tracking | Medium | Medium | **P3** |

---

## Concluzie

Workflow-ul este solid ca fundație. Trasabilitatea și quality gates sunt bine gândite. Problemele principale sunt legate de **pierderea contextului între iterații** și **validări care vin prea târziu în flow**. Recomandările de mai sus adresează aceste gap-uri cu efort relativ mic.
