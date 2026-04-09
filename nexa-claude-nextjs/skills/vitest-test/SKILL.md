---
name: vitest-test
description: >
  Creates Vitest integration tests for Next.js API route handlers,
  server actions, and components using Testcontainers for external dependencies.
  Use when the user asks to "write integration tests", "test with a real database",
  "create Vitest integration tests", or mentions Vitest integration testing or
  Testcontainers. Unit tests are created by the implement skill.
---

# Vitest Integration Test

## Instructions

Create Vitest integration tests for Next.js API routes, server actions, and components based on the use case $ARGUMENTS.
Unit tests are already created by the `/implement` skill — this skill focuses on integration tests that hit real dependencies via Testcontainers.

Use the context7 MCP server for Next.js documentation when needed.

## DO NOT

- Test implementation details (test behavior, not internals)
- Use `any` type in test code
- Skip error case testing
- Mock Prisma Client — integration tests use a real database via Testcontainers
- Hard-code database connection strings — `DATABASE_URL` is injected by global setup

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Test Data Conventions

- Use only `example.com` for test emails and accounts (e.g., `user@example.com`, `admin@example.com`). This is an IANA-reserved domain that will never route real mail.

## Testcontainers Global Setup

Before writing tests, ensure the project has a global setup file that starts a PostgreSQL
Testcontainer, runs Prisma migrations, and exports the `DATABASE_URL`.

If `src/test/global-setup.ts` does not exist, create it using [templates/global-setup.ts](templates/global-setup.ts).

If `src/test/test-prisma.ts` does not exist, create it using [templates/test-prisma.ts](templates/test-prisma.ts).

Ensure `vitest.config.ts` references the global setup:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globalSetup: ['src/test/global-setup.ts'],
    setupFiles: ['src/test/setup.ts'],
    env: {
      // Load static test variables; DATABASE_URL is set by global setup
      NODE_ENV: 'test',
    },
  },
});
```

Ensure `src/test/setup.ts` exists to load `.env.test` for static variables:

```typescript
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile('.env.test');
} catch {
  // .env.test is optional — DATABASE_URL comes from global setup
}
```

## Test Data Strategy

| Approach        | Location                      | Purpose              |
|-----------------|-------------------------------|----------------------|
| Prisma seed     | prisma/seed.ts                | Baseline test data   |
| Test fixtures   | src/test/fixtures/            | Reusable test data   |
| Inline creation | Within test setup             | Test-specific data   |
| Manual cleanup  | afterEach / afterAll hooks    | Remove created data  |

## Templates

- Global setup: [templates/global-setup.ts](templates/global-setup.ts)
- Prisma test client: [templates/test-prisma.ts](templates/test-prisma.ts)
- Test example: [templates/example.test.ts](templates/example.test.ts)

## Common Patterns

### API Route Handler Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/examples/route';
import { NextRequest } from 'next/server';
import { getTestPrisma } from '@/test/test-prisma';

const prisma = getTestPrisma();

describe('GET /api/examples', () => {
  afterEach(async () => {
    await prisma.example.deleteMany();
  });

  it('should return all records', async () => {
    await prisma.example.createMany({
      data: [
        { name: 'Item 1', description: 'First item' },
        { name: 'Item 2', description: 'Second item' },
      ],
    });

    const request = new NextRequest('http://localhost/api/examples');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
  });

  it('should return empty array when no records exist', async () => {
    const request = new NextRequest('http://localhost/api/examples');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});

describe('POST /api/examples', () => {
  afterEach(async () => {
    await prisma.example.deleteMany();
  });

  it('should create a new record', async () => {
    const request = new NextRequest('http://localhost/api/examples', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Item', description: 'A new item' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.name).toBe('New Item');

    // Verify it was persisted
    const stored = await prisma.example.findFirst({ where: { name: 'New Item' } });
    expect(stored).not.toBeNull();
  });

  it('should return 400 for invalid input', async () => {
    const request = new NextRequest('http://localhost/api/examples', {
      method: 'POST',
      body: JSON.stringify({ description: 'Missing name' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### Server Action Tests

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createExample } from '@/app/actions/examples';
import { getTestPrisma } from '@/test/test-prisma';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const prisma = getTestPrisma();

describe('createExample', () => {
  afterEach(async () => {
    await prisma.example.deleteMany();
  });

  it('should create a record and revalidate', async () => {
    const formData = new FormData();
    formData.set('name', 'Test');
    formData.set('description', 'Desc');

    const result = await createExample(formData);

    expect(result.name).toBe('Test');
    expect(revalidatePath).toHaveBeenCalledWith('/examples');

    // Verify persistence
    const stored = await prisma.example.findFirst({ where: { name: 'Test' } });
    expect(stored).not.toBeNull();
  });
});
```

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExampleForm } from '@/components/example-form';

describe('ExampleForm', () => {
  it('should call onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    render(<ExampleForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Test');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it('should show validation error for empty name', async () => {
    render(<ExampleForm onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
```

## Assertions Reference

| Assertion Type      | Example                                           |
|---------------------|---------------------------------------------------|
| Defined             | `expect(result).toBeDefined()`                    |
| Equality            | `expect(result.name).toBe('Test')`                |
| Array length        | `expect(result).toHaveLength(5)`                  |
| Object match        | `expect(result).toMatchObject({ name: 'Test' })`  |
| Exception           | `await expect(fn()).rejects.toThrow(Error)`        |
| HTTP status         | `expect(response.status).toBe(200)`               |
| Called with         | `expect(fn).toHaveBeenCalledWith('/path')`         |
| DOM element         | `expect(screen.getByText('Hi')).toBeInTheDocument()` |
| Not null            | `expect(result).not.toBeNull()`                   |

## Workflow

1. Read the use case specification
2. Use TodoWrite to create a task for each test scenario
3. Ensure Testcontainers global setup exists (`src/test/global-setup.ts`); create from template if missing
4. Ensure test Prisma client exists (`src/test/test-prisma.ts`); create from template if missing
5. Ensure `vitest.config.ts` references the global setup
6. Create test file using the template
7. For each test:
    - Set up test data using the real Prisma client from `src/test/test-prisma.ts`
    - Create test input (NextRequest, FormData, or component props)
    - Execute the operation under test
    - Assert expected outcomes (including database persistence where applicable)
    - Clean up test data in afterEach/afterAll hooks
8. Only mock Next.js framework modules (`next/cache`, `next/navigation`) — never mock Prisma
9. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
10. Run tests with `npx vitest run` to verify they pass
11. If a test fails:
    - Check that Testcontainers started successfully (Docker must be running)
    - Verify Prisma migrations are up to date
    - Ensure async operations are properly awaited
    - Check test data cleanup is not interfering with other tests
12. Mark todos complete

## Resources

- Use the context7 MCP server for Next.js documentation
