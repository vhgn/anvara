import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { PlacementInputSchema, PlacementStatusSchema } from '../generated/zod/schemas/index.js';
import { validate } from '../validate.js';
import z from 'zod';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router: IRouter = Router();

// GET /api/placements - List placements
router.get(
  '/',
  authMiddleware,
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
      const user = res.locals.user;

      if (user.role === 'PUBLISHER' && publisherId && publisherId !== user.publisherId) {
        res.status(403).json({ error: 'Cannot access placements for another publisher' });
        return;
      }

      const placements = await prisma.placement.findMany({
        where: {
          ...(user.role === 'SPONSOR'
            ? { campaign: { sponsorId: user.sponsorId } }
            : { publisherId: user.publisherId }),
          ...(campaignId && { campaignId }),
          ...(publisherId && user.role === 'SPONSOR' && { publisherId }),
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
  authMiddleware,
  roleMiddleware('SPONSOR'),
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
      const user = res.locals.user;
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

      if (endDate <= startDate) {
        res.status(400).json({ error: 'Placement end date must be after start date' });
        return;
      }

      const [campaign, creative, adSlot] = await Promise.all([
        prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, sponsorId: true },
        }),
        prisma.creative.findUnique({
          where: { id: creativeId },
          select: { id: true, campaignId: true },
        }),
        prisma.adSlot.findUnique({
          where: { id: adSlotId },
          select: { id: true, publisherId: true, isAvailable: true },
        }),
      ]);

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'Cannot create placement for another sponsor campaign' });
        return;
      }

      if (!creative) {
        res.status(404).json({ error: 'Creative not found' });
        return;
      }

      if (creative.campaignId !== campaign.id) {
        res.status(400).json({ error: 'Creative does not belong to the selected campaign' });
        return;
      }

      if (!adSlot) {
        res.status(404).json({ error: 'Ad slot not found' });
        return;
      }

      if (adSlot.publisherId !== publisherId) {
        res.status(400).json({ error: 'Publisher does not own the selected ad slot' });
        return;
      }

      if (!adSlot.isAvailable) {
        res.status(400).json({ error: 'Ad slot is no longer available' });
        return;
      }

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
