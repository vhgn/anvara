import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware, roleMiddleware } from '../../auth.js';
import authRoutes from '../../routes/auth.js';

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
  toNodeHandler:
    () => (_req: unknown, res: { status: (status: number) => { json: (body: unknown) => void } }) =>
      res.status(404).json({ error: 'Not found' }),
}));

vi.mock('../../db.js', () => ({
  prisma: {
    sponsor: { findUnique: sponsorFindUnique },
    publisher: { findUnique: publisherFindUnique },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/api/test/sponsor-only', authMiddleware, roleMiddleware('SPONSOR'), (_req, res) => {
  res.json({ ok: true, user: res.locals.user });
});
app.get('/api/test/publisher-only', authMiddleware, roleMiddleware('PUBLISHER'), (_req, res) => {
  res.json({ ok: true, user: res.locals.user });
});

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('rejects /me when user has conflicting roles', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'a@b.com' } });
    sponsorFindUnique.mockResolvedValue({ id: 'sponsor-1', name: 'Sponsor' });
    publisherFindUnique.mockResolvedValue({ id: 'publisher-1', name: 'Publisher' });

    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Ambiguous user role' });
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

  it('allows sponsor users through sponsor-only routes', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'sponsor@example.com' } });
    sponsorFindUnique.mockResolvedValue({ id: 'sponsor-1', name: 'Sponsor' });
    publisherFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/test/sponsor-only');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      user: {
        id: 'user-1',
        role: 'SPONSOR',
        sponsorId: 'sponsor-1',
      },
    });
  });

  it('denies publisher users from sponsor-only routes', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-2', email: 'publisher@example.com' } });
    sponsorFindUnique.mockResolvedValue(null);
    publisherFindUnique.mockResolvedValue({ id: 'publisher-1', name: 'Publisher' });

    const res = await request(app).get('/api/test/sponsor-only');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('allows publisher users through publisher-only routes', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-2', email: 'publisher@example.com' } });
    sponsorFindUnique.mockResolvedValue(null);
    publisherFindUnique.mockResolvedValue({ id: 'publisher-1', name: 'Publisher' });

    const res = await request(app).get('/api/test/publisher-only');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      user: {
        id: 'user-2',
        role: 'PUBLISHER',
        publisherId: 'publisher-1',
      },
    });
  });

  it('denies sponsor users from publisher-only routes', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'sponsor@example.com' } });
    sponsorFindUnique.mockResolvedValue({ id: 'sponsor-1', name: 'Sponsor' });
    publisherFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/test/publisher-only');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Insufficient permissions' });
  });
});
