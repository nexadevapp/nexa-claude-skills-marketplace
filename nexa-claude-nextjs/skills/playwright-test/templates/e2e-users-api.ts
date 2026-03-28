/**
 * E2E Test User API Endpoints
 *
 * These endpoints are ONLY available when NODE_ENV=test.
 * They allow Playwright tests to provision and clean up test users
 * without accessing the database directly.
 *
 * Create two files in your project:
 *
 * 1. app/api/e2e/users/route.ts        — POST handler (create user)
 * 2. app/api/e2e/users/[id]/route.ts   — DELETE handler (delete user)
 */

// ============================================================
// FILE: app/api/e2e/users/route.ts
// ============================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust import to your project
import bcrypt from 'bcryptjs';

function guardTestEnv() {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  return null;
}

export async function POST(request: Request) {
  const guard = guardTestEnv();
  if (guard) return guard;

  const body = await request.json();
  const { email, password, accountType, status, emailConfirmed } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'email and password are required' },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Adjust field names to match your Prisma schema
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      account_type: accountType ?? 'BUYER',
      status: status ?? 'ACTIVE',
      email_confirmed: emailConfirmed ?? true,
      consent_terms: true,
      consent_privacy: true,
      consent_marketing: true,
      auth_provider: 'EMAIL',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return NextResponse.json(user, { status: 201 });
}

// ============================================================
// FILE: app/api/e2e/users/[id]/route.ts
// ============================================================

// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// function guardTestEnv() { ... same as above ... }

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const guard = guardTestEnv();
  if (guard) return guard;

  const { id } = params;

  // Delete related records first if needed (adjust to your schema)
  // await prisma.order.deleteMany({ where: { userId: id } });
  // await prisma.session.deleteMany({ where: { userId: id } });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
