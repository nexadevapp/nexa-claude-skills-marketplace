---
name: conventional-commit
description: >
  Writes every git commit message in Conventional Commits v1.0.0 format with an
  ASD-STE100 Simplified Technical English subject line. Use before running any
  `git commit`, `git commit --amend`, or `gh pr merge --squash`, and whenever the
  user asks to "commit", "commit the changes", "write a commit message", "amend
  the commit", or mentions commit conventions, commit format, or commit message
  style. Applies in any git repository, Nexa project or not.
---

# Conventional Commit

## Instructions

Compose the commit message before you run `git commit`. Never run `git commit -m`
with a message that has not passed the Verification checklist at the end of this
skill.

## Format

```
<type>(<scope>)<!>: <description>

<body>

<footer>
```

- `type` — required, lowercase, from the table below
- `scope` — optional, in parentheses, no spaces
- `!` — optional, before the colon, marks a breaking change
- `description` — required, one line, imperative, no final period
- `body` — optional, blank line before it, explains **why**, not what
- `footer` — optional, blank line before it, `BREAKING CHANGE: <reason>` or
  `Refs: #42`, `Closes: #42`

## Types

| Type | Use for |
|---|---|
| `feat` | A new capability for the user |
| `fix` | A correction of incorrect behaviour |
| `docs` | Documentation only |
| `refactor` | A change that does not add a capability or correct behaviour |
| `perf` | A change that improves speed or resource use |
| `test` | Tests only |
| `build` | Build system or dependencies |
| `ci` | CI configuration or pipelines |
| `chore` | Other work that changes no source behaviour |
| `revert` | Reverts an earlier commit; the body gives its hash |

`feat` and `fix` map to MINOR and PATCH. A `!` or a `BREAKING CHANGE:` footer
maps to MAJOR, with any type.

## Scope

Derive the scope in this order. Use the first one that applies:

1. **A Nexa work item** — the ID of the specification you implement:
   `UC-XXX`, `TT-XXX`, `BUG-XXX`, `CR-XXX`. See
   `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md` for the type-to-ID
   mapping and examples. This rule has priority over all the rules below.
2. **A plugin, package, or workspace name** in a monorepo — `nextjs`, `core`.
3. **A module or feature area** that the diff touches — `auth`, `checkout`.
4. **No scope**, if the change is repository-wide.

Do not invent a scope. Read the diff and the branch name, and use a scope that
is already in the `git log` history of the repository.

## Simplified Technical English

Write the description and the body in ASD-STE100 Simplified Technical English.
These are the STE rules that apply to a commit message:

- **Use the imperative.** `add the retry limit`, not `added` or `adds`.
- **Use the active voice.** `the parser rejects empty rows`, not `empty rows are
  rejected`.
- **Use the simple present tense.** Do not use future, perfect, or progressive
  tenses.
- **Give one instruction per sentence.** Keep sentences to 20 words or fewer.
- **Use one word for one meaning.** Keep the same word for the same thing in the
  whole message. Do not use synonyms for variety.
- **Use the approved word for each action** — `remove`, not `get rid of`; `start`,
  not `kick off`; `change`, not `tweak`.
- **Do not use the `-ing` form as a verb.** `add caching` is acceptable when
  "caching" is the name of the thing; `adding a cache` is not.
- **Do not omit articles to shorten the line.** `fix the discount calculation` is
  correct. Drop an article only when the line stays unambiguous without it.
- **Use three nouns or fewer in a noun cluster.** Break up
  `order total discount code validation`.
- **Do not use slang, jargon, idioms, or humour.**
- **Spell out an abbreviation** unless it is a project identifier (`UC-003`), a
  standard technical term (`API`, `HTTP`, `SQL`), or an identifier from the code.
- **Do not use a pronoun with an unclear antecedent.** Name the thing.

Code identifiers, file paths, and commands keep their exact spelling. STE applies
to the prose around them.

## DO NOT

The Verification checklist covers the format rules. These are the rules it cannot check:

- Do not add a co-author, tool credit, or advertisement footer unless the user
  asks for one.
- Do not amend or force-push a commit that is already on a shared branch without
  the user's confirmation.
- Do not run `git commit` when the user asked only for a review or a diff.

## Process

1. Run `git status` and `git diff --staged`. If nothing is staged, run
   `git diff` and stage the files that belong to this one logical change.
2. Read the diff and name the effect on behaviour in one sentence.
3. Choose the `type` from the table. Correct behaviour → `fix`. New capability →
   `feat`. No behaviour change → `refactor`, `chore`, `docs`, `test`, `build`, or `ci`.
4. Derive the `scope` with the priority list above.
5. Write the description in STE. Rewrite it once to remove every word that carries
   no information.
6. Add a body only when the reason for the change is not clear from the
   description. Explain why, not what.
7. Add `!` and a `BREAKING CHANGE:` footer when a consumer must change their code.
8. Run the Verification checklist.
9. Commit with a heredoc so the message keeps its line breaks:

   ```bash
   git commit -F - <<'EOF'
   fix(BUG-003): apply the discount code to the order total

   The total used the list price because the discount ran after the sum.
   EOF
   ```

## Examples

```
feat(UC-003): add the place order page and its API route
```

```
refactor(auth)!: replace the session cookie with a bearer token

BREAKING CHANGE: clients must send the Authorization header. The session
cookie is no longer read.
```

Rejected subjects and their corrections:

| Rejected | Reason | Corrected |
|---|---|---|
| `Fixed bug in checkout.` | past tense, capital, period | `fix(checkout): reject an empty cart` |
| `feat: adding user stuff` | `-ing` form, slang, no effect stated | `feat(users): add the user invite form` |
| `chore: updates` | no information | `chore(deps): raise vitest to 3.2.0` |
| `fix: the thing that broke the order total discount code check` | 3+ noun cluster, unclear pronoun | `fix(orders): validate the discount code before the total` |

## Verification

The message is ready only when every line below is true:

- [ ] The first line matches `<type>(<scope>)!?: <description>` with a lowercase type
- [ ] The type is in the table and matches the diff
- [ ] The scope follows the priority list, or there is no scope
- [ ] The description is imperative, lowercase, has no final period, and is 72
      characters or fewer
- [ ] The description states the effect on behaviour, not the list of edited files
- [ ] Every sentence is 20 words or fewer, active voice, simple present
- [ ] No slang, no idiom, no `-ing` verb, no unexplained abbreviation, no
      unclear pronoun
- [ ] A blank line separates the description, the body, and the footer
- [ ] A breaking change has both `!` and a `BREAKING CHANGE:` footer
- [ ] The commit holds one logical change

If a box fails, rewrite the message. Do not commit a message that fails a box.
