/**
 * Traceability helper for Playwright E2E tests.
 *
 * Wraps Playwright's test() with structured metadata that links each test to:
 *   - exactly one Use Case (UC-NNN)
 *   - one scenario (MSS, AF-N, EX-N)
 *   - zero or more Change Requests (CR-NNN) the test verifies
 *   - zero or more Bugs (BUG-NNN) the test guards against regressing
 *
 * Metadata is emitted as both Playwright tags (filterable via --grep) and
 * structured annotations (visible in the HTML report). Referenced docs are
 * validated at registration time — typo'd IDs fail before any browser starts.
 *
 * Usage:
 *
 *   import { useCase } from './helpers/traced';
 *   import { expect } from '@playwright/test';
 *
 *   useCase('UC-007', 'Manage Social Resume', (test) => {
 *     test('volunteer adds an entry via the modal', {
 *       scenario: 'MSS',
 *       verifies: ['CR-002', 'CR-003'],
 *     }, async ({ page }) => {
 *       // ...
 *     });
 *
 *     test('ongoing checkbox disables end date', {
 *       scenario: 'AF-1',
 *       verifies: ['CR-003'],
 *     }, async ({ page }) => {
 *       // ...
 *     });
 *   });
 *
 * The callback parameter `test` shadows the imported `@playwright/test` `test`
 * inside the callback body. Register framework hooks (test.beforeAll,
 * test.afterEach, test.afterAll) at module top level, outside this call.
 */

import { test as base } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type UCId = `UC-${string}`;
export type CRId = `CR-${string}`;
export type BUGId = `BUG-${string}`;
export type Scenario = 'MSS' | `AF-${number}` | `EX-${number}`;

type FullTestArgs = Parameters<Parameters<typeof base>[2]>[0];
// The fixtures the helper forwards explicitly. Keep in sync with the
// destructure inside `useCase` below.
type ForwardedFixtures = Pick<
  FullTestArgs,
  'page' | 'request' | 'context' | 'browser' | 'browserName' | 'baseURL'
>;
type TestBody = (args: ForwardedFixtures) => Promise<void>;

export interface ScenarioMeta {
  scenario: Scenario;
  verifies?: CRId[];
  fixes?: BUGId[];
}

type ScopedTest = (title: string, meta: ScenarioMeta, body: TestBody) => void;

export function useCase(
  id: UCId,
  title: string,
  body: (test: ScopedTest) => void,
): void {
  assertDocExists('use_cases', id);

  base.describe(`${id}: ${title}`, { tag: [`@${id}`] }, () => {
    const test: ScopedTest = (testTitle, meta, fn) => {
      meta.verifies?.forEach((cr) => assertDocExists('change_requests', cr));
      meta.fixes?.forEach((bug) => assertDocExists('bugs', bug));

      const tags = [
        `@${id}`,
        `@${meta.scenario}`,
        ...(meta.verifies ?? []).map((c) => `@${c}`),
        ...(meta.fixes ?? []).map((b) => `@${b}`),
      ];

      // NOTE: Playwright determines which fixtures to inject by parsing the
      // first parameter of the test function as a string. A non-destructured
      // parameter name like `(args)` requests zero fixtures — `page`,
      // `request`, etc. would be undefined inside `fn`. We therefore
      // explicitly destructure the built-in fixtures the codebase relies on.
      // If you add a custom fixture via `test.extend()`, list it here too.
      base(
        `${meta.scenario}: ${testTitle}`,
        { tag: tags },
        async ({ page, request, context, browser, browserName, baseURL }) => {
          const a = base.info().annotations;
          a.push({ type: 'use-case', description: id });
          a.push({ type: 'scenario', description: meta.scenario });
          meta.verifies?.forEach((c) =>
            a.push({ type: 'change-request', description: c }),
          );
          meta.fixes?.forEach((b) =>
            a.push({ type: 'bug-fix', description: b }),
          );
          await fn({ page, request, context, browser, browserName, baseURL });
        },
      );
    };
    body(test);
  });
}

export function bugTest(bug: BUGId, title: string, body: TestBody): void {
  assertDocExists('bugs', bug);
  base(
    `${bug}: ${title}`,
    { tag: [`@${bug}`] },
    async ({ page, request, context, browser, browserName, baseURL }) => {
      base.info().annotations.push({ type: 'bug-fix', description: bug });
      await body({ page, request, context, browser, browserName, baseURL });
    },
  );
}

const cache = new Map<string, string[]>();

function assertDocExists(folder: string, id: string): void {
  const dir = join(process.cwd(), 'docs', folder);
  if (!cache.has(folder)) {
    if (!existsSync(dir)) {
      throw new Error(
        `[traced] docs/${folder}/ not found — Nexa project layout expected`,
      );
    }
    cache.set(folder, readdirSync(dir));
  }
  const found = cache
    .get(folder)!
    .some(
      (f) =>
        f === `${id}.md` ||
        f.startsWith(`${id}-`) ||
        f.startsWith(`${id}.`),
    );
  if (!found) {
    throw new Error(
      `[traced] ${id} not found under docs/${folder}/ — broken reference`,
    );
  }
}
