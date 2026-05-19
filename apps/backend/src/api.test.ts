import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authRoutes from './routes/auth.js';

const getSession = vi.hoisted(() => vi.fn());
const sponsorFindUnique = vi.hoisted(() => vi.fn());
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

vi.mock('./db.js', () => ({
  prisma: {
    sponsor: { findUnique: sponsorFindUnique },
    publisher: { findUnique: publisherFindUnique },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps login on frontend', async () => {
    const res = await request(app).post('/api/auth/login');

    expect(res.status).toBe(400);
  });

  it('rejects /me without session', async () => {
    getSession.mockResolvedValue(null);

    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthenticated' });
  });

  it('rejects /me when user has no role', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'a@b.com' } });
    sponsorFindUnique.mockResolvedValue(null);
    publisherFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Role not identified' });
  });

  it('returns sponsor user from /me', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'sponsor@example.com' } });
    sponsorFindUnique.mockResolvedValue({ id: 'sponsor-1', name: 'Sponsor' });
    publisherFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 'user-1',
      email: 'sponsor@example.com',
      role: 'SPONSOR',
      sponsorId: 'sponsor-1',
    });
  });
});
