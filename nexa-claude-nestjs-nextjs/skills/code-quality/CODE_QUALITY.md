# Code Quality — ESLint & Prettier

## When to Apply

Run these checks after generating or modifying TypeScript/JavaScript files.
This applies to implementation code, test files, and any `.ts`/`.tsx`/`.js`/`.jsx` files.
It does **not** apply to Prisma schema files.

## ESLint

### NestJS Backend

Run ESLint in the backend project:

```bash
npx eslint --fix 'src/**/*.ts'
```

### Next.js Frontend

Next.js ships with built-in ESLint support. Run the linter and fix all auto-fixable issues:

```bash
npx next lint --fix
```

If there are remaining warnings or errors that cannot be auto-fixed, resolve them manually before considering the task complete.

## Prettier

Format all changed files with Prettier:

```bash
npx prettier --write .
```

If the project does not yet have a Prettier config, create `.prettierrc` with these defaults:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

## Order

1. Fix code issues first (ESLint `--fix`)
2. Format last (Prettier `--write`)

This order matters because Prettier may reformat ESLint's fixes, but not vice versa.
