---
name: setup-env-profiles
description: >
  Sets up environment profiles (local, dev, prod) with database connection strings
  and environment-specific configuration. Interactive — prompts the user for each
  profile's database URL. Use when the user asks to "set up environments", "configure
  profiles", "create .env files", "set up local/dev/prod", or mentions environment
  profiles, environment configuration, or database connection setup.
---

# Setup Environment Profiles

## Instructions

Set up three environment profiles — **local**, **dev**, and **prod** — each with its own
`.env` file and database connection string.

This skill is **interactive**. Prompt the user for input at each step using the
questions described below.

## DO NOT

- Generate `docker-compose.yml` or any Docker infrastructure files
- Overwrite an existing `.env` file without showing the user what will change and asking for confirmation
- Store real credentials in committed files (all `.env*` files must be in `.gitignore`)
- Proceed to the next profile before the current one is confirmed
- Invent or guess database credentials — always ask the user

## Prerequisites

Check that `.gitignore` includes `.env*` entries. If not, add them before creating any
`.env` files:

```
.env
.env.*
.env.local
.env.development
.env.production
```

## Profiles and File Mapping

| Profile | File                 | Purpose                        |
|---------|----------------------|--------------------------------|
| local   | `.env.local`         | Local machine development      |
| dev     | `.env.development`   | Shared development / staging   |
| prod    | `.env.production`    | Production                     |

## Workflow

### Step 1: Detect Existing Configuration

1. Check if `prisma/schema.prisma` exists to confirm Prisma is in use
2. Check if any `.env*` files already exist
3. If existing files are found, show the user which ones exist and ask whether to
   update them or skip

### Step 2: Local Profile (`.env.local`)

Ask the user:

> **Local database setup — choose one:**
>
> 1. **Docker** (PostgreSQL container on localhost)
> 2. **Other** (provide your own connection string)

**If the user chooses Docker (option 1):**

Pre-fill the `DATABASE_URL` with:

```
postgresql://postgres:postgres@localhost:5432/<project_name>?schema=public
```

where `<project_name>` is derived from the project's `package.json` `name` field
(lowercase, hyphens replaced with underscores).

Show the pre-filled value and ask the user to confirm or adjust it.

**If the user chooses Other (option 2):**

Ask the user to provide their full `DATABASE_URL` connection string.

### Step 3: Dev Profile (`.env.development`)

Ask the user:

> **Dev database connection string:**
>
> Please provide a Supabase, AWS RDS, or other managed database connection string
> for your development/staging environment.
>
> Docker is not available for dev — use a managed database service.

Wait for the user to provide the connection string.

### Step 4: Prod Profile (`.env.production`)

Ask the user:

> **Production database connection string:**
>
> Please provide a Supabase, AWS RDS, or other managed database connection string
> for your production environment.
>
> Docker is not available for prod — use a managed database service.

Wait for the user to provide the connection string.

### Step 5: Additional Environment Variables

After all three database URLs are collected, check if the project uses any of
the following and ask the user to provide values per profile if applicable:

- `NEXTAUTH_SECRET` / `AUTH_SECRET` (if next-auth is a dependency)
- `NEXTAUTH_URL` / `AUTH_URL` (if next-auth is a dependency)
- `NEXT_PUBLIC_APP_URL` (if referenced in the codebase)

For any variables already present in existing `.env*` files, show current values
and ask whether to keep or update them.

### Step 6: Write Files

For each profile, generate the `.env` file with this structure:

```env
# =============================================================================
# <PROFILE_NAME> Environment Profile
# =============================================================================

# Database
DATABASE_URL="<user_provided_url>"

# Direct connection URL (for Prisma migrations — same as DATABASE_URL unless
# the provider requires a different connection mode, e.g. Supabase pooling)
DIRECT_URL="<user_provided_url>"

# App
# NEXT_PUBLIC_APP_URL="<if applicable>"

# Auth
# AUTH_SECRET="<if applicable>"
# AUTH_URL="<if applicable>"
```

Only include variables that are relevant to the project. Comment out optional
variables that were not provided rather than omitting them, so the user knows
they are available.

### Step 7: Update Prisma Schema (if needed)

If `prisma/schema.prisma` exists and does not already reference the `DIRECT_URL`
environment variable in the datasource block, update it:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Step 8: Summary

Present a summary of what was created:

```
## Environment Profiles Created

| Profile | File               | Database                          |
|---------|--------------------|-----------------------------------|
| local   | .env.local         | <short description, e.g. Docker>  |
| dev     | .env.development   | <short description, e.g. Supabase>|
| prod    | .env.production    | <short description, e.g. RDS>     |

### Next Steps
- Run `npx prisma migrate dev` to apply migrations against your local database
- Verify each profile by running: `dotenv -e .env.<profile> -- npx prisma db pull`
```
