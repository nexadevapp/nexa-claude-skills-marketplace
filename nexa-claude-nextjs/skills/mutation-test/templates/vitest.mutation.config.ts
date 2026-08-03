import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from './vitest.config';

// Stryker runs this config instead of vitest.config.ts. Each Stryker worker forks the test
// runner, so the Testcontainers globalSetup must be dropped — otherwise every worker boots
// its own PostgreSQL container. Mutation testing targets unit-testable business logic, so
// integration tests are excluded here rather than made to work under mutation.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      globalSetup: [],
      exclude: ['**/node_modules/**', '**/e2e/**', '**/*.integration.test.{ts,tsx}'],
      coverage: { enabled: false },
    },
  }),
);
