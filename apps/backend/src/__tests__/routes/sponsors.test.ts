import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sponsorsRoutes from '../../routes/sponsors.js';

const getSession = vi.hoisted(() => vi.fn());
const sponsorFindUnique = vi.hoisted(() => vi.fn());
const sponsorCreate = vi.hoisted(() => vi.fn());
const publisherFindUnique = vi.hoisted(() => vi.fn());

vi.mock('better-auth', () => ({
  betterAuth: () => ({ api: { getSession } }),
}));

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: () => ({}),
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: (headers: unknown) => headers,
}));

vi.mock('../../db.js', () => ({
  prisma: {
    sponsor: {
      findMany: vi.fn(),
      findUnique: sponsorFindUnique,
      create: sponsorCreate,
    },
    publisher: {
      findUnique: publisherFindUnique,
    },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/sponsors', sponsorsRoutes);

describe('Sponsors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects sponsor creation without a session', async () => {
    getSession.mockResolvedValue(null);

    const res = await request(app).post('/api/sponsors').send({ name: 'Acme' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthenticated' });
    expect(sponsorCreate).not.toHaveBeenCalled();
  });

  it('ties created sponsors to the authenticated user and session email', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'owner@example.com' } });
    sponsorFindUnique.mockResolvedValue(null);
    publisherFindUnique.mockResolvedValue(null);
    sponsorCreate.mockResolvedValue({
      id: 'sponsor-1',
      userId: 'user-1',
      name: 'Acme',
      email: 'owner@example.com',
    });

    const res = await request(app).post('/api/sponsors').send({
      name: 'Acme',
      email: 'impersonated@example.com',
      website: 'https://example.com',
    });

    expect(res.status).toBe(201);
    expect(sponsorCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        name: 'Acme',
        email: 'owner@example.com',
        website: 'https://example.com',
      }),
    });
  });

  it('returns a conflict when the authenticated user already has a sponsor', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'owner@example.com' } });
    sponsorFindUnique
      .mockResolvedValueOnce({ id: 'existing-sponsor' })
      .mockResolvedValueOnce(null);
    publisherFindUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/sponsors').send({ name: 'Acme' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Sponsor already exists for this user' });
    expect(sponsorCreate).not.toHaveBeenCalled();
  });
});
