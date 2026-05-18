import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { PlacementInputSchema, PlacementStatusSchema } from '../generated/zod/schemas/index.js';
import { validate } from '../validate.js';
import z from 'zod';

const router: IRouter = Router();

// GET /api/placements - List placements
router.get(
  '/',
  validate({
    query: z.object({
      campaignId: z.string().optional(),
      publisherId: z.string().optional(),
      status: PlacementStatusSchema.optional(),
    }),
  }),
  async (req, res) => {
    try {
      const { campaignId, publisherId, status } = req.query;

      const placements = await prisma.placement.findMany({
        where: {
          ...(campaignId && { campaignId }),
          ...(publisherId && { publisherId }),
          ...(status && {
            status,
          }),
        },
        include: {
          campaign: { select: { id: true, name: true } },
          creative: { select: { id: true, name: true, type: true } },
          adSlot: { select: { id: true, name: true, type: true } },
          publisher: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(placements);
    } catch (error) {
      console.error('Error fetching placements:', error);
      res.status(500).json({ error: 'Failed to fetch placements' });
    }
  }
);

// POST /api/placements - Create new placement
router.post(
  '/',
  validate({
    body: PlacementInputSchema.pick({
      campaignId: true,
      creativeId: true,
      adSlotId: true,
      publisherId: true,
      agreedPrice: true,
      pricingModel: true,
    }).extend({
      pricingModel: PlacementInputSchema.shape.pricingModel.default('CPM'),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    }),
  }),
  async (req, res) => {
    try {
      const {
        campaignId,
        creativeId,
        adSlotId,
        publisherId,
        agreedPrice,
        pricingModel,
        startDate,
        endDate,
      } = req.body;

      const placement = await prisma.placement.create({
        data: {
          campaignId,
          creativeId,
          adSlotId,
          publisherId,
          agreedPrice,
          pricingModel,
          startDate,
          endDate,
        },
        include: {
          campaign: { select: { name: true } },
          publisher: { select: { name: true } },
        },
      });

      res.status(201).json(placement);
    } catch (error) {
      console.error('Error creating placement:', error);
      res.status(500).json({ error: 'Failed to create placement' });
    }
  }
);

export default router;
