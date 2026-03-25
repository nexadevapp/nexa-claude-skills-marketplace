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

Read and follow the dependency strategies in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

Use the context7 MCP server for Next.js documentation when needed.

## DO NOT

- Test implementation details (test behavior, not internals)
- Use `any` type in test code
- Skip error case testing
- Import from `"next/server"` in test files without mocking (use `vi.mock`)

## Test Data Strategy

| Approach        | Location                      | Purpose              |
|-----------------|-------------------------------|----------------------|
| Prisma seed     | prisma/seed.ts                | Baseline test data   |
| Test fixtures   | src/test/fixtures/            | Reusable test data   |
| Inline creation | Within test setup             | Test-specific data   |
| Manual cleanup  | afterEach / afterAll hooks    | Remove created data  |

## Template

Use [templates/example.test.ts](templates/example.test.ts) as the test structure.

## Common Patterns

### API Route Handler Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/examples/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    example: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('GET /api/examples', () => {
  it('should return all records', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    vi.mocked(prisma.example.findMany).mockResolvedValue(mockData);

    const request = new NextRequest('http://localhost/api/examples');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockData);
  });
});

describe('POST /api/examples', () => {
  it('should create a new record', async () => {
    const newItem = { id: '1', name: 'New Item', description: 'Desc' };
    vi.mocked(prisma.example.create).mockResolvedValue(newItem);

    const request = new NextRequest('http://localhost/api/examples', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Item', description: 'Desc' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.name).toBe('New Item');
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
import { describe, it, expect, vi } from 'vitest';
import { createExample } from '@/app/actions/examples';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    example: { create: vi.fn() },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('createExample', () => {
  it('should create a record and revalidate', async () => {
    const created = { id: '1', name: 'Test', description: 'Desc' };
    vi.mocked(prisma.example.create).mockResolvedValue(created);

    const formData = new FormData();
    formData.set('name', 'Test');
    formData.set('description', 'Desc');

    const result = await createExample(formData);

    expect(result).toEqual(created);
    expect(revalidatePath).toHaveBeenCalledWith('/examples');
  });
});
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
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

## Workflow

1. Read the use case specification
2. Use TodoWrite to create a task for each test scenario
3. Create test file using the template
4. For each test:
    - Set up mocks for Prisma and Next.js modules
    - Create test input (NextRequest, FormData, or component props)
    - Execute the operation under test
    - Assert expected outcomes
    - Reset mocks in beforeEach if needed
5. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
6. Run tests with `npx vitest run` to verify they pass
7. If a test fails:
    - Check that mocks are correctly set up for Prisma and Next.js modules
    - Verify async operations are properly awaited
    - Ensure `vi.mock` calls are at the top level of the test file
8. Mark todos complete

## Resources

- Use the context7 MCP server for Next.js documentation
