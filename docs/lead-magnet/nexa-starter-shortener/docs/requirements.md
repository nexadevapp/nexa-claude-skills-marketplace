# Requirements — `lnk.sh`

Source: [`vision.md`](./vision.md)

This catalog enumerates the functional requirements (FR), non-functional requirements (NFR), and constraints (C) for `lnk.sh`. Scope is limited to the three shipped use cases (UC-001/002/003); broader vision items (abuse reporting, moderator panel, analytics, claim-anonymous, sign-up/sign-in flows) are intentionally out of this release.

Authentication for Link Owners is treated as a foundational concern delivered by the `/setup-web-middleware` skill — not as a user-facing functional requirement.

---

## Functional Requirements

| ID     | Title                  | User Story                                                                                                  | Priority | Status | UC Mapping |
|--------|------------------------|-------------------------------------------------------------------------------------------------------------|----------|--------|------------|
| FR-001 | Shorten URL            | As an anonymous visitor, I want to paste a destination URL and receive a short link so that I can share it. | High     | Open   | UC-002     |
| FR-002 | Custom slug            | As an anonymous visitor, I want to optionally specify a custom slug so that the short link is memorable.    | Medium   | Open   | UC-002     |
| FR-003 | Redirect to destination | As anyone with a short link, I want the link to redirect to its destination so that it functions as expected. | High   | Open   | UC-003     |
| FR-004 | List owned links       | As a link owner, I want to see all my links in one place so that I can find and copy any of them.           | High     | Open   | UC-001     |

## Non-Functional Requirements

| ID      | Title                  | Requirement                                                                            | Category             | Priority | Status |
|---------|------------------------|----------------------------------------------------------------------------------------|----------------------|----------|--------|
| NFR-001 | Shorten latency        | Shortening a URL must complete within 200ms at the p95 under 100 RPS.                  | Performance          | High     | Open   |
| NFR-002 | Redirect latency       | Redirect resolution must complete within 100ms at the p95 over a rolling 7-day window. | Performance          | High     | Open   |
| NFR-003 | Slug uniqueness        | Slug uniqueness must hold under concurrent writes via DB-level constraint.             | Reliability          | High     | Open   |
| NFR-004 | Anonymous rate limit   | A single IP must not create more than 20 links per hour.                               | Security             | High     | Open   |
| NFR-005 | Anonymous link expiry  | Anonymous links must expire 30 days after creation; owned links must not expire.       | Business Rule        | High     | Open   |
| NFR-006 | TLS in transit         | All HTTP traffic must be served over TLS 1.3.                                          | Security             | High     | Open   |
| NFR-007 | Password storage       | Passwords must be hashed with Argon2id at memory cost ≥ 64MB.                          | Security             | High     | Open   |
| NFR-008 | No third-party tracker | No third-party tracking script must execute on public pages.                            | Privacy              | High     | Open   |
| NFR-009 | WCAG compliance        | All public pages must meet WCAG 2.1 AA contrast and keyboard navigation criteria.       | Accessibility        | Medium   | Open   |
| NFR-010 | Localization coverage  | English and Romanian must be available with 100% string coverage.                       | Internationalization | Medium   | Open   |
| NFR-011 | Test coverage          | Unit + integration test coverage must be ≥ 80% line coverage on the `src/` tree.        | Maintainability      | Medium   | Open   |

## Constraints

| ID    | Title              | Constraint                                                                | Category  | Priority | Status |
|-------|--------------------|---------------------------------------------------------------------------|-----------|----------|--------|
| C-001 | Frontend framework | Frontend must use Next.js 15 with the App Router.                          | Technical | High     | Open   |
| C-002 | Database platform  | Persistence layer must use PostgreSQL 16.                                  | Technical | High     | Open   |
| C-003 | ORM                | Database access must use Prisma.                                           | Technical | High     | Open   |
| C-004 | Deployment target  | Production deployment must target AWS App Runner.                          | Technical | High     | Open   |
| C-005 | Browser support    | UI must support Chrome, Firefox, and Safari (latest 2 versions).            | Technical | High     | Open   |
| C-006 | Day-one languages  | English and Romanian must ship in the first release.                       | Business  | High     | Open   |
| C-007 | No native apps     | The first release must be web-only — no iOS or Android applications.       | Business  | High     | Open   |
