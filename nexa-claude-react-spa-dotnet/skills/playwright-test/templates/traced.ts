/**
 * Traceability helper for Playwright E2E tests.
 *
 * Provides three helpers that compose with the imported `@playwright/test`
 * `test` to link each test to its use case, change requests, and bug fixes:
 *
 *   - uc(id)              — returns the `{ tag }` options object for
 *                           `test.describe('UC-NNN: ...', uc('UC-NNN'), () => {...})`.
 *                           Validates the UC doc exists.
 *   - meta(uc, opts)      — returns Playwright's `{ tag, annotation }`
 *                           second-arg object for a test inside the describe.
 *                           Validates referenced CR/BUG docs exist.
 *   - bug(id)             — same shape, for a pure bug regression test that
 *                           has no UC home.
 *
 * Why these and not a `useCase(...)` wrapper: IDE plugins (WebStorm/IntelliJ,
 * VSCode Playwright) only walk `test()` and `test.describe()` calls — they
 * don't enter callbacks of custom helper functions. Keeping `test.describe`
 * literally in source is what makes the gutter run/debug icons appear.
 *
 * Referenced UC/CR/BUG docs are validated at registration time: a typo'd
 * 'CR-002' throws before any browser starts.
 *
 * Usage:
 *
 *   import { test, expect } from '@playwright/test';
 *   import { uc, meta, bug } from './helpers/traced';
 *
 *   test.describe('UC-007: Manage Social Resume', uc('UC-007'), () => {
 *     test('volunteer adds an entry via the modal',
 *       meta('UC-007', { scenario: 'MSS', verifies: ['CR-002'] }),
 *       async ({ page }) => { ... });
 *
 *     test('ongoing checkbox disables end date',
 *       meta('UC-007', { scenario: 'AF-1', verifies: ['CR-003'] }),
 *       async ({ page }) => { ... });
 *   });
 *
 *   test('login does not crash on Unicode emails',
 *     bug('BUG-002'),
 *     async ({ page }) => { ... });
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type UCId = `UC-${string}`;
export type CRId = `CR-${string}`;
export type BUGId = `BUG-${string}`;
export type Scenario = 'MSS' | `AF-${number}` | `EX-${number}`;

interface Annotation {
  type: string;
  description: string;
}

interface DescribeMeta {
  tag: string[];
}

interface PlaywrightMeta {
  tag: string[];
  annotation: Annotation[];
}

export function uc(id: UCId): DescribeMeta {
  assertDocExists('use_cases', id);
  return { tag: [`@${id}`] };
}

export function meta(
  id: UCId,
  opts: { scenario: Scenario; verifies?: CRId[]; fixes?: BUGId[] },
): PlaywrightMeta {
  assertDocExists('use_cases', id);
  const { scenario, verifies, fixes } = opts;
  verifies?.forEach((cr) => assertDocExists('change_requests', cr));
  fixes?.forEach((b) => assertDocExists('bugs', b));

  return {
    tag: [
      `@${id}`,
      `@${scenario}`,
      ...(verifies ?? []).map((c) => `@${c}`),
      ...(fixes ?? []).map((b) => `@${b}`),
    ],
    annotation: [
      { type: 'use-case', description: id },
      { type: 'scenario', description: scenario },
      ...(verifies ?? []).map((c) => ({ type: 'change-request', description: c })),
      ...(fixes ?? []).map((b) => ({ type: 'bug-fix', description: b })),
    ],
  };
}

export function bug(id: BUGId): PlaywrightMeta {
  assertDocExists('bugs', id);
  return {
    tag: [`@${id}`],
    annotation: [{ type: 'bug-fix', description: id }],
  };
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
