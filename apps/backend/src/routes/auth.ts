import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { auth, authMiddleware } from '../auth.js';
import { toNodeHandler } from 'better-auth/node';

const router: IRouter = Router();

// NOTE: Authentication is handled by Better Auth
// This route is kept for any backend-specific auth utilities

// GET /api/auth/me - Get current user (for API clients)
router.get('/me', authMiddleware, async (_req, res) => {
  res.json({ user: res.locals.user });
});

// GET /api/auth/role/:userId - Get user role based on Sponsor/Publisher records
router.get('/role', authMiddleware, async (_req, res) => {
  try {
    const userId = res.locals.user.id;

    // Check if user is a sponsor
    const sponsor = await prisma.sponsor.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (sponsor) {
      res.json({ role: 'sponsor', sponsorId: sponsor.id, name: sponsor.name });
      return;
    }

    // Check if user is a publisher
    const publisher = await prisma.publisher.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (publisher) {
      res.json({ role: 'publisher', publisherId: publisher.id, name: publisher.name });
      return;
    }

    // User has no role assigned
    res.json({ role: null });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Failed to fetch user role' });
  }
});

router.all('/*splat', toNodeHandler(auth));

export default router;
