---
name: aws-dockerize
description: >
  Creates production-ready Dockerfiles and .dockerignore for a NestJS + Next.js
  project using multi-stage builds. Use when the user asks to "dockerize",
  "containerize", "create a Dockerfile", "add Docker support", or mentions
  Docker, container image, or containerization.
---

# AWS Dockerize

## Instructions

Create a production-ready Docker setup for the current NestJS + Next.js project: $ARGUMENTS.
$ARGUMENTS may specify special requirements or be empty.

## Workflow

1. **Verify the project structure** by checking for both a NestJS backend and a Next.js frontend. Identify the project layout:
   - **Monorepo**: backend and frontend in separate directories (e.g., `apps/api` and `apps/web`, or `backend/` and `frontend/`)
   - **Single repo with separate roots**: check `package.json` for NestJS and Next.js dependencies
   - If the structure is unclear, ask the user to clarify

2. **For the Next.js frontend**, ensure standalone output is enabled in `next.config.*`:
   - Check that `output: "standalone"` is set
   - If missing, add it and inform the user

3. **Create `.dockerignore`** excluding:
   - `node_modules`, `.next`, `out`, `dist`
   - `.env*.local`
   - `.git`, `.gitignore`
   - `infra/`
   - IDE and OS files (`.idea`, `.vscode`, `.DS_Store`)

4. **Create Dockerfile for the NestJS backend** using a three-stage build:
   - **Stage 1 — deps**: `node:22-alpine`, install dependencies with `npm ci`
   - **Stage 2 — builder**: Copy source, run `npm run build`
   - **Stage 3 — runner**: Minimal alpine image with only `dist/` output + `node_modules`, non-root user, exposed port (default 3000)

5. **Create Dockerfile for the Next.js frontend** using a three-stage build:
   - **Stage 1 — deps**: `node:22-alpine`, install dependencies with `npm ci`
   - **Stage 2 — builder**: Copy source, run `npm run build`
   - **Stage 3 — runner**: Minimal alpine image with only standalone output + static assets, non-root user (`nextjs:nodejs`), port 3000

6. **Verify** each Dockerfile builds successfully:
   - Run `docker build` in the appropriate context for each Dockerfile
   - If the build fails, fix the Dockerfile and retry
   - Remove test images after verification

7. **Create `docker-compose.yml`** if the project has external dependencies (database, Redis, etc.) or the user explicitly requests it. Include both services (backend + frontend) with proper networking.

## Reference Templates

- **Next.js Dockerfile**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nestjs-nextjs/1.0.0/skills/aws-dockerize/templates/Dockerfile.nextjs`
- **NestJS Dockerfile**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nestjs-nextjs/1.0.0/skills/aws-dockerize/templates/Dockerfile.nestjs`
- **`.dockerignore`**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nestjs-nextjs/1.0.0/skills/aws-dockerize/templates/dockerignore`

## DO NOT

- Override an existing Dockerfile without reading it first and asking the user
- Use `latest` tags for base images — pin to major version
- Copy secrets, `.env` files, or credentials into the image
- Run the application as root in the final stage
- Install dev dependencies in the production stage
