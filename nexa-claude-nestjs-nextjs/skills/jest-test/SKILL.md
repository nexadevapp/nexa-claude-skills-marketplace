---
name: jest-test
description: >
  Creates Jest integration tests for NestJS services, controllers, and
  guards using Testcontainers for external dependencies. Use when the user
  asks to "write integration tests", "test with a real database",
  "create Jest integration tests", or mentions Jest integration testing or
  Testcontainers. Unit tests are created by the implement skill.
---

# Jest Integration Test

## Instructions

Create Jest integration tests for NestJS services and controllers based on the use case $ARGUMENTS.
Unit tests are already created by the `/implement` skill — this skill focuses on integration tests that hit real dependencies via Testcontainers.

Read and follow the dependency strategies in `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/mocking/MOCKING.md`.

Use the context7 MCP server for NestJS testing documentation when needed.

## DO NOT

- Mock the database in integration tests (use a test database with Prisma)
- Test implementation details (test behavior, not internals)
- Use `any` type in test code
- Skip error case testing

## Test Data Strategy

| Approach        | Location                      | Purpose              |
|-----------------|-------------------------------|----------------------|
| Prisma seed     | prisma/seed.ts                | Baseline test data   |
| Test fixtures   | src/test/fixtures/            | Reusable test data   |
| Inline creation | Within test setup             | Test-specific data   |
| Manual cleanup  | afterEach / afterAll hooks    | Remove created data  |

## Template

Use [templates/example.service.spec.ts](templates/example.service.spec.ts) as the test class structure.

## Common Patterns

### Module Setup

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ExampleService,
      PrismaService,
    ],
  }).compile();

  service = module.get<ExampleService>(ExampleService);
  prisma = module.get<PrismaService>(PrismaService);
});
```

### Service Unit Tests

```typescript
describe('findAll', () => {
  it('should return all records', async () => {
    const result = await service.findAll();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('create', () => {
  it('should create a new record', async () => {
    const dto: CreateExampleDto = { name: 'Test', description: 'Test desc' };
    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(result.name).toBe('Test');
  });

  it('should throw on duplicate name', async () => {
    const dto: CreateExampleDto = { name: 'Existing', description: 'Test' };
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
});
```

### Controller Integration Tests

```typescript
describe('ExampleController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /examples should return list', () => {
    return request(app.getHttpServer())
      .get('/examples')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it('POST /examples should create record', () => {
    return request(app.getHttpServer())
      .post('/examples')
      .send({ name: 'New Item', description: 'Desc' })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('New Item');
      });
  });

  it('POST /examples should validate input', () => {
    return request(app.getHttpServer())
      .post('/examples')
      .send({ description: 'Missing name' })
      .expect(400);
  });
});
```

### DTO Validation Tests

```typescript
it('should reject invalid input', async () => {
  const dto = new CreateExampleDto();
  dto.name = ''; // too short

  const errors = await validate(dto);
  expect(errors.length).toBeGreaterThan(0);
});
```

## Assertions Reference

| Assertion Type      | Example                                          |
|---------------------|--------------------------------------------------|
| Defined             | `expect(result).toBeDefined()`                   |
| Equality            | `expect(result.name).toBe('Test')`               |
| Array length        | `expect(result).toHaveLength(5)`                 |
| Greater than        | `expect(result.length).toBeGreaterThan(0)`       |
| Exception           | `await expect(fn()).rejects.toThrow(Error)`      |
| HTTP status         | `.expect(200)`                                   |
| Object containing   | `expect(result).toMatchObject({ name: 'Test' })` |

## Workflow

1. Read the use case specification
2. Use TodoWrite to create a task for each test scenario
3. Create test file using the template
4. For each test:
    - Set up test module and dependencies
    - Create test data if needed
    - Execute the operation under test
    - Assert expected outcomes
    - Clean up test data if created during test
5. Run tests with `npx jest --runInBand` to verify they pass
6. If a test fails:
    - Check that the test database is running and seeded
    - Verify DTOs and validation pipes are configured correctly
    - Ensure async operations are properly awaited
7. Mark todos complete

## Resources

- Use the context7 MCP server for NestJS testing documentation
- Jest documentation: https://jestjs.io/docs/getting-started
