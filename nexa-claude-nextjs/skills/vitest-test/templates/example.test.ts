import { describe, it, expect, afterEach } from 'vitest';
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

    // Verify it was persisted in the real database
    const stored = await prisma.example.findFirst({ where: { name: 'New Item' } });
    expect(stored).not.toBeNull();
  });

  it('should return 400 for invalid input', async () => {
    const request = new NextRequest('http://localhost/api/examples', {
      method: 'POST',
      body: JSON.stringify({ description: 'Missing required name field' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
