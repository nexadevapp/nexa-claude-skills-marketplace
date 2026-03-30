---
name: setup-env-profiles
description: >
  Sets up environment profiles (local, dev, test) with database connection strings
  and environment-specific configuration. Local uses Testcontainers, dev uses Supabase.
  Only prompts the user for the Supabase connection string. Use when the user asks to
  "set up environments", "configure profiles", "create .env files", "set up local/dev",
  or mentions environment profiles, environment configuration, or database connection setup.
---

# Setup Environment Profiles

## Instructions

Set up three environment profiles — **local**, **dev**, and **test** — each with its own
`.env` file and database connection string. Local and test both use Testcontainers;
dev uses Supabase.

This skill is **minimally interactive**. The only user input required is the Supabase
connection string for the dev profile.

## DO NOT

- Generate `docker-compose.yml` or any Docker infrastructure files
- Overwrite an existing `.env` file without showing the user what will change and asking for confirmation
- Store real credentials in committed files (all `.env*` files must be in `.gitignore`)
- Invent or guess database credentials — always ask the user

## Prerequisites

Check that `.gitignore` includes `.env*` entries. If not, add them before creating any
`.env` files:

```
.env
.env.*
.env.local
.env.development
.env.test
```

## Profiles and File Mapping

| Profile | File                 | Database                              | Purpose                                    |
|---------|----------------------|---------------------------------------|--------------------------------------------|
| local   | `.env.local`         | Testcontainers (dynamic at runtime)   | Local machine development                  |
| dev     | `.env.development`   | Supabase                              | Shared development / staging               |
| test    | `.env.test`          | Testcontainers (dynamic at runtime)   | Integration and e2e tests                  |

## Workflow

### Step 0: Consult Prisma Documentation

Before starting, use the **Context7 MCP tool** to fetch the latest Prisma documentation
on environment configuration and `prisma.config.ts`. This ensures the setup follows
the current Prisma conventions (e.g. config file format, env loading, `--config` flag usage).

Query Context7 for:
- `prisma.config.ts` configuration file setup and usage
- Prisma environment variables and `.env` file loading behavior

Use the documentation to inform decisions in subsequent steps — especially around
whether the project should use `prisma.config.ts` for env file resolution and how
Prisma CLI commands should reference the config.

### Step 1: Detect Existing Configuration

1. Check if Prisma is in use by looking for **any** of:
   - `prisma/schema.prisma`
   - `prisma.config.ts` (project root)
   - `prisma/prisma.config.ts`
2. If `prisma.config.ts` exists (at either location), note it as the **Prisma config path** —
   it will be used in later steps for CLI commands and env file resolution
3. Check if any `.env*` files already exist
4. If existing files are found, show the user which ones exist and ask whether to
   update them or skip

### Step 2: Local Profile (`.env.local`) — Auto-generated

This profile is **not interactive**. It uses Testcontainers, same as the test profile.

Generate `.env.local` with the following content:

```env
# =============================================================================
# Local Environment Profile (Testcontainers)
# =============================================================================
# DATABASE_URL is set dynamically by the dev script at startup.
# Testcontainers spins up a PostgreSQL container, runs migrations, and provides
# the connection string automatically.

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth (local-only values — never use in production)
AUTH_SECRET="local-secret-do-not-use-in-production"
AUTH_URL="http://localhost:3000"
```

Only include `AUTH_SECRET` and `AUTH_URL` if the project uses next-auth / Auth.js.
Add any other environment variables the project needs with safe local-only defaults.

### Step 3: Dev Profile (`.env.development`) — Supabase

Ask the user for both URLs:

> **Supabase connection strings for the dev environment:**
>
> Prisma requires two connection URLs. Please provide both:
>
> 1. **Pooled URL** (`DATABASE_URL`) — used by your application at runtime.
>    Typically looks like:
>    `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
>
> 2. **Direct URL** (`DIRECT_URL`) — used by Prisma for migrations and introspection.
>    Typically looks like:
>    `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
>
> You can find both in your Supabase dashboard under **Settings → Database → Connection string**.

Wait for the user to provide both connection strings.

### Step 4: Test Profile (`.env.test`) — Auto-generated

This profile is **not interactive** — it is auto-generated for Testcontainers-driven
integration and e2e tests.

Generate `.env.test` with the following content:

```env
# =============================================================================
# Test Environment Profile (Testcontainers)
# =============================================================================
# DATABASE_URL is set dynamically by Testcontainers global setup at test runtime.
# Do not set DATABASE_URL here — it will be overridden by the test harness.

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth (test-only values — never use in production)
AUTH_SECRET="test-secret-do-not-use-in-production"
AUTH_URL="http://localhost:3000"
```

Only include `AUTH_SECRET` and `AUTH_URL` if the project uses next-auth / Auth.js.
Add any other environment variables the project needs with safe test-only defaults.

Inform the user:

> Both **local** and **test** profiles use Testcontainers. `DATABASE_URL` is provided
> dynamically at runtime — by the dev script for local, and by Vitest/Playwright
> global setup for tests. PostgreSQL containers are started automatically, migrations
> are applied, and the connection string is injected into `process.env`.

### Step 5: Additional Environment Variables

Check if the project uses any of the following and, for the **dev profile only**,
ask the user to provide values if applicable:

- `NEXTAUTH_SECRET` / `AUTH_SECRET` (if next-auth is a dependency)
- `NEXTAUTH_URL` / `AUTH_URL` (if next-auth is a dependency)
- `NEXT_PUBLIC_APP_URL` (if referenced in the codebase)

For local and test profiles, use safe defaults automatically (as shown in Steps 2 and 4).
For any variables already present in existing `.env*` files, show current values
and ask whether to keep or update them.

### Step 6: Write Files

For the **dev** profile, generate the `.env` file with this structure:

```env
# =============================================================================
# Development Environment Profile (Supabase)
# =============================================================================

# Database
DATABASE_URL="<user_provided_pooled_url>"

# Direct connection URL (for Prisma migrations — bypasses connection pooling)
DIRECT_URL="<user_provided_direct_url>"

# App
# NEXT_PUBLIC_APP_URL="<if applicable>"

# Auth
# AUTH_SECRET="<if applicable>"
# AUTH_URL="<if applicable>"
```

Only include variables that are relevant to the project. Comment out optional
variables that were not provided rather than omitting them, so the user knows
they are available.

For the **local** and **test** profiles, write the files as defined in Steps 2 and 4.

### Step 7: Create `.env` Symlink

Create a `.env` symlink pointing to `.env.local` if one does not already exist:

```bash
ln -sf .env.local .env
```

This ensures tools that read `.env` by default (like Prisma) pick up the local profile.

### Step 8: Update Prisma Datasource (if needed)

Ensure the Prisma datasource includes `directUrl`. The location depends on the project setup:

- If `prisma.config.ts` exists: check whether the datasource `directUrl` is configured there
  (per the Context7 documentation fetched in Step 0). Update the config file accordingly.
- If `prisma/schema.prisma` is used (no `prisma.config.ts`): ensure the datasource block
  references `DIRECT_URL`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

If the project does **not** yet have a `prisma.config.ts` but the Context7 documentation
indicates it is the recommended approach for the project's Prisma version, suggest creating
one to the user and explain the benefits (centralized config, TypeScript support, env file
resolution). Do not create it without user confirmation.

### Step 9: Summary

Present a summary of what was created:

```
## Environment Profiles Created

| Profile | File               | Database                                |
|---------|--------------------|-----------------------------------------|
| local   | .env.local         | Testcontainers (dynamic at runtime)     |
| dev     | .env.development   | Supabase                                |
| test    | .env.test          | Testcontainers (dynamic at runtime)     |

### Next Steps
- Run `npx prisma migrate dev` to apply migrations (add `--config <path>` if using `prisma.config.ts`)
- Verify the dev profile by running: `dotenv -e .env.development -- npx prisma db pull`
```
