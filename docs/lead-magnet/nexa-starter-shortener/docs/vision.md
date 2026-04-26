# Vision — `lnk.sh`

## Problem

Existing URL shorteners trade convenience for privacy. They harvest click data, sell it, and lock owners into proprietary dashboards. Anonymous users have no way to shorten a link without an account, and link owners have no way to know whether their links are still alive.

## Product

`lnk.sh` is a privacy-respecting URL shortener with three audiences:

- **Anonymous Visitors** can shorten a URL in one click. Their links expire after 30 days unless claimed.
- **Link Owners** sign up to keep links permanent and see lightweight analytics (click counts, referrers).
- **Moderators** review abuse reports and maintain a blocklist of destinations.

The product fits in a single Next.js application: a homepage with the shortening form, a logged-in dashboard for link owners, a redirect endpoint, and a moderator panel.

## Goals

- Anonymous visitor can shorten a URL in under 5 seconds.
- Link owner can find any of their links in under 3 seconds.
- Redirect resolution is faster than 100ms at the p95.
- Abuse reports are reviewed within 24 hours.
- No third-party tracker fires on the public pages.

## Non-goals

- Native mobile apps. Web-only.
- Custom domains, branded short links, or QR generation.
- Enterprise features (SSO, audit log, role hierarchies beyond the three actors).
- Migrating links from competitors.

## Target users

| Actor | Volume | Primary device | Anonymity |
|-------|--------|----------------|-----------|
| Anonymous Visitor | ~80% of traffic | Mobile + Desktop | Full anonymity, IP rate-limited |
| Link Owner | ~18% | Desktop | Email + password |
| Moderator | ~2% | Desktop | Email + password + role flag |

## Success metrics

- 30-day retention of Link Owners > 40%.
- < 0.5% of created links flagged as abuse.
- p95 redirect latency < 100ms over a rolling 7-day window.
- Anonymous-to-Owner conversion rate > 8% within the first session.

## Constraints

- Must use Next.js 15 (App Router) and PostgreSQL — these are fixed by the platform team.
- Must be deployable to AWS App Runner.
- Must support English and Romanian on day one.
