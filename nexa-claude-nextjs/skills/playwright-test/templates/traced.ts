/**
 * Traceability helper for Playwright E2E tests.
 *
 * Provides three helpers that compose with the imported `@playwright/test`
 * `test` to link each test to its use case, change requests, and bug fixes:
 *
 *   - useCase(id, title, body)  — wraps tests in a UC-tagged describe block
 *   - meta(scenario, opts)      — returns Playwright's `{ tag, annotation }`
 *                                 second-arg object for a test inside useCase()
 *   - bug(id)                   — same, for a pure bug regression test that
 *                                 has no UC home
 *
 * Tests are still registered with the imported `test()` — never a
 * callback-scoped parameter — so IDE plugins (WebStorm/IntelliJ, VSCode
 * Playwright extension) can statically discover and run each test from the
 * gutter.
 *
 * Referenced UC/CR/BUG docs are validated at registration time: a typo'd
 * 'CR-002' throws before any browser starts.
 *
 * Usage:
 *
 *   import { test, expect } from '@playwright/test';
 *   import { useCase, meta, bug } from './helpers/traced';
 *
 *   useCase('UC-007', 'Manage Social Resume', () => {
 *     test('volunteer adds an entry via the modal',
 *       meta({ scenario: 'MSS', verifies: ['CR-002'] }),
 *       async ({ page }) => { ... });
 *
 *     test('ongoing checkbox disables end date',
 *       meta({ scenario: 'AF-1', verifies: ['CR-003'] }),
 *       async ({ page }) => { ... });
 *   });
 *
 *   test('login does not crash on Unicode emails',
 *     bug('BUG-002'),
 *     async ({ page }) => { ... });
 */

import { test as base } from '@playwright/test';
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

interface PlaywrightMeta {
  tag: string[];
  annotation: Annotation[];
}

// Playwright invokes a describe block's body synchronously during test
// collection, so this module-level slot is set throughout the body and
// cleared before any other test registers. Sufficient for the synchronous
// registration model — no async-context plumbing needed.
let currentUC: UCId | null = null;

export function useCase(
  id: UCId,
  title: string,
  body: () => void,
): void {
  assertDocExists('use_cases', id);
  base.describe(`${id}: ${title}`, { tag: [`@${id}`] }, () => {
    const prev = currentUC;
    currentUC = id;
    try {
      body();
    } finally {
      currentUC = prev;
    }
  });
}

export interface ScenarioMeta {
  scenario: Scenario;
  verifies?: CRId[];
  fixes?: BUGId[];
}

export function meta(input: ScenarioMeta): PlaywrightMeta {
  if (!currentUC) {
    throw new Error(
      `[traced] meta() must be called inside a useCase() body — use bug() for pure-bug tests`,
    );
  }
  const { scenario, verifies, fixes } = input;
  verifies?.forEach((cr) => assertDocExists('change_requests', cr));
  fixes?.forEach((b) => assertDocExists('bugs', b));

  return {
    tag: [
      `@${scenario}`,
      ...(verifies ?? []).map((c) => `@${c}`),
      ...(fixes ?? []).map((b) => `@${b}`),
    ],
    annotation: [
      { type: 'use-case', description: currentUC },
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
