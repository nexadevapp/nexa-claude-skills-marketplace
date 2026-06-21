---
name: setup-xquik
description: >
  Sets up a server-only Xquik integration in a Next.js application for public X data
  lookup, search, monitoring, exports, MCP-adjacent agent workflows, or webhook-backed
  delivery. Use when the user asks to add Xquik, x-developer, X/Twitter data, tweet
  search, user lookup, X data monitoring, or Xquik webhooks to a Next.js project.
---

# Setup Xquik

## Instructions

Set up Xquik as a server-only data integration in a Next.js project. The integration
must keep API keys out of client bundles, verify public source truth before choosing
endpoints, and produce a minimal typed boundary that application code can call safely.

## DO NOT

- Put `XQUIK_API_KEY` or webhook secrets in `NEXT_PUBLIC_*` variables
- Expose raw request headers, API keys, cookies, or webhook secrets to client components
- Invent Xquik endpoints, request fields, response fields, pricing, limits, or capabilities
- Add browser automation or local dev servers as verification unless the user explicitly asks
- Log raw Xquik responses if they may contain user data or secrets

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Source Truth

Before implementing endpoint-specific code, check the current public sources:

1. API overview: `https://docs.xquik.com/api-reference/overview`
2. MCP overview, when the request mentions agents or MCP: `https://docs.xquik.com/mcp/overview`
3. OpenAPI schema: `https://xquik.com/openapi.json`
4. SDK package metadata: `npm view x-developer version license repository.url`

If docs and OpenAPI disagree, trust OpenAPI for request and response shapes and note the
mismatch in the implementation summary.

## Workflow

### Step 1: Confirm the Xquik Use Case

Classify the requested integration:

- **Lookup/search**: tweet, user, timeline, follower, trend, or other documented read workflow
- **Monitoring/export**: recurring data collection, export, or dashboard ingestion
- **Webhook delivery**: event delivery from Xquik into the Next.js app
- **Agent workflow**: MCP-adjacent setup or server-side route used by an agent

Stop if the requested capability is not present in the public docs or OpenAPI schema.

### Step 2: Protect Configuration

Check `.gitignore` for `.env*` entries. If they are missing, add them before creating or
documenting environment files.

Use these server-only variables as needed:

```env
XQUIK_API_KEY=
XQUIK_BASE_URL=https://xquik.com
XQUIK_WEBHOOK_SECRET=
```

Add placeholders to `.env.example` or the project's documented example env file. Never write
real values.

### Step 3: Install the SDK When It Fits

For TypeScript or JavaScript projects, prefer the published SDK when it matches the workflow:

```bash
npm view x-developer version license repository.url
npm install x-developer
```

Use the project's actual package manager if it already uses `pnpm`, `yarn`, or `bun`.
Use direct REST calls only when the SDK does not cover the documented workflow or when the
project intentionally avoids another dependency.

### Step 4: Create a Server Boundary

Create a small server-only module or route handler that owns all Xquik calls:

1. Read `XQUIK_API_KEY` only on the server.
2. Validate user input before calling Xquik.
3. Call only documented endpoints or SDK methods.
4. Return a narrowed response shape that the app actually needs.
5. Map Xquik errors into application errors without exposing raw headers or secrets.

Prefer one boundary per use case rather than a broad generic passthrough endpoint.

### Step 5: Add Webhooks Only When Requested

If the workflow uses webhooks:

1. Confirm the documented webhook event and signature requirements.
2. Store the webhook secret in `XQUIK_WEBHOOK_SECRET`.
3. Verify signatures before parsing or processing the event.
4. Keep the route idempotent and return a clear non-2xx response for invalid signatures.
5. Add tests for valid signature, invalid signature, and replay or duplicate delivery if the
   project has a test harness.

### Step 6: Verification

Run focused checks that match the change:

- Package manager install or lockfile check, if a dependency was added
- Typecheck or lint for the touched files
- Unit tests for server boundary validation and error mapping, if the project has tests
- Static scan that no `NEXT_PUBLIC_XQUIK_API_KEY`, raw key value, or webhook secret was added
- Link or schema check for the Xquik docs and OpenAPI source used

If no live API key is available, stop at static validation and clearly state that live request
validation was skipped because credentials were not present.
