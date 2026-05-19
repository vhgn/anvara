import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import z from 'zod';
import { validate } from '../validate.js';

const router: IRouter = Router();

// GET /api/publishers - List all publishers
router.get('/', async (_req, res) => {
  try {
    const publishers = await prisma.publisher.findMany({
      include: {
        _count: {
          select: { adSlots: true, placements: true },
        },
      },
      orderBy: { monthlyViews: 'desc' },
    });
    res.json(publishers);
  } catch (error) {
    console.error('Error fetching publishers:', error);
    res.status(500).json({ error: 'Failed to fetch publishers' });
  }
});

// GET /api/publishers/:id - Get single publisher with ad slots
router.get('/:id', validate({ params: z.object({ id: z.string() }) }), async (req, res) => {
  try {
    const { id } = req.params;
    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        adSlots: true,
        placements: {
          include: {
            campaign: { select: { name: true, sponsor: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!publisher) {
      res.status(404).json({ error: 'Publisher not found' });
      return;
    }

    res.json(publisher);
  } catch (error) {
    console.error('Error fetching publisher:', error);
    res.status(500).json({ error: 'Failed to fetch publisher' });
  }
});

export default router;
