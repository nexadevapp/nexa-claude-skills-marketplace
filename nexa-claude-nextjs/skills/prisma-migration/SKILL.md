---
name: prisma-migration
description: >
  Creates Prisma schema models and generates database migrations from the entity
  model. Use when the user asks to "create a migration", "update the schema",
  "set up database tables", "write a Prisma migration", or mentions schema
  migration, DB migration, database versioning, or Prisma schema changes.
---

# Prisma Migration

## Instructions

Create or update the Prisma schema and generate migrations based on `docs/entity_model.md`.

## DO NOT

- Manually write SQL migration files (use `npx prisma migrate dev` to generate them)
- Drop existing tables or models without explicit user confirmation
- Skip relations defined in the entity model
- Use `autoincrement()` unless the entity model explicitly requires it (prefer `uuid()` or `cuid()` for IDs)

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Schema Location

```
prisma/schema.prisma
```

## Example Schema

```prisma
model RoomType {
  id          String  @id @default(cuid())
  name        String  @unique @db.VarChar(50)
  description String? @db.VarChar(500)
  capacity    Int
  price       Decimal @db.Decimal(10, 2)
  rooms       Room[]

  @@map("room_type")
}

model Room {
  id           String       @id @default(cuid())
  number       String       @unique @db.VarChar(10)
  roomType     RoomType     @relation(fields: [roomTypeId], references: [id])
  roomTypeId   String       @map("room_type_id")
  reservations Reservation[]

  @@map("room")
}
```

## Workflow

1. Read `docs/entity_model.md`
2. Read the existing `prisma/schema.prisma` if it exists
3. Create or update Prisma models with fields, types, relations, and constraints
4. Map entity model validation rules to Prisma attributes (`@unique`, `@db.*`, `@default`, etc.)
5. Ensure relations match the entity model (one-to-many, many-to-many, etc.)
6. Run `npx prisma migrate dev --name <descriptive_name>` to generate the migration
7. Validate the migration:
    - Verify all entities from the entity model have corresponding models
    - Verify all relations are bidirectional where needed
    - Verify field types and constraints match the entity model
    - Verify the generated SQL migration is correct
