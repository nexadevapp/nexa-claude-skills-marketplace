---
name: aws-dockerize
description: >
  Creates a production-ready Dockerfile and .dockerignore for a Next.js
  project using multi-stage builds with standalone output. Use when the user
  asks to "dockerize", "containerize", "create a Dockerfile", "add Docker
  support", or mentions Docker, container image, or containerization.
---

# AWS Dockerize

## Instructions

Create a production-ready Docker setup for the current Next.js project: $ARGUMENTS.
$ARGUMENTS may specify special requirements or be empty.

## Workflow

1. **Verify the project is Next.js** by checking for `next.config.*` in the project root. If not found, inform the user this skill is for Next.js projects.

2. **Ensure standalone output is enabled** in `next.config.*`:
   - Check that `output: "standalone"` is set
   - If missing, add it and inform the user

3. **Create `.dockerignore`** excluding:
   - `node_modules`, `.next`, `out`
   - `.env*.local`
   - `.git`, `.gitignore`
   - `infra/`
   - IDE and OS files (`.idea`, `.vscode`, `.DS_Store`)

4. **Create `Dockerfile`** using a three-stage build:
   - **Stage 1 — deps**: `node:22-alpine`, install dependencies with `npm ci`
   - **Stage 2 — builder**: Copy source, run `npm run build`
   - **Stage 3 — runner**: Minimal alpine image with only standalone output + static assets, non-root user (`nextjs:nodejs`), port 3000

5. **Verify** the Dockerfile builds successfully:
   - Run `docker build -t test-build .` in the project root
   - If the build fails, fix the Dockerfile and retry
   - Remove the test image after verification

6. **Create `docker-compose.yml`** only if the project has external dependencies (database, Redis, etc.) or the user explicitly requests it.

## Reference Templates

- **Dockerfile**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/aws-dockerize/templates/Dockerfile.nextjs`
- **`.dockerignore`**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/aws-dockerize/templates/dockerignore`

## DO NOT

- Override an existing Dockerfile without reading it first and asking the user
- Use `latest` tags for base images — pin to major version
- Copy secrets, `.env` files, or credentials into the image
- Run the application as root in the final stage
- Install dev dependencies in the production stage

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.
