import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/examples/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    example: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('GET /api/examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all records', async () => {
    const mockData = [
      { id: '1', name: 'Item 1', description: 'First item' },
      { id: '2', name: 'Item 2', description: 'Second item' },
    ];
    vi.mocked(prisma.example.findMany).mockResolvedValue(mockData);

    const request = new NextRequest('http://localhost/api/examples');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockData);
    expect(body).toHaveLength(2);
  });

  it('should return empty array when no records exist', async () => {
    vi.mocked(prisma.example.findMany).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/examples');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});

describe('POST /api/examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new record', async () => {
    const newItem = { id: '1', name: 'New Item', description: 'A new item' };
    vi.mocked(prisma.example.create).mockResolvedValue(newItem);

    const request = new NextRequest('http://localhost/api/examples', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Item', description: 'A new item' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.name).toBe('New Item');
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
