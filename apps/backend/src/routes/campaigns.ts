import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { validate } from '../validate.js';
import z from 'zod';
import { CampaignInputSchema, CampaignStatusSchema } from '../generated/zod/schemas/index.js';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router: IRouter = Router();

const campaignMoneySchema = z.number().positive();
const campaignCreateSchema = CampaignInputSchema.pick({
  name: true,
  description: true,
  budget: true,
  cpmRate: true,
  cpcRate: true,
  targetRegions: true,
  sponsorId: true,
})
  .extend({
    budget: campaignMoneySchema,
    cpmRate: campaignMoneySchema.optional().nullable(),
    cpcRate: campaignMoneySchema.optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    targetCategories: CampaignInputSchema.shape.targetCategories.default([]),
    targetRegions: CampaignInputSchema.shape.targetRegions.default([]),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    if (endDate <= startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'endDate must be after startDate',
      });
    }
  });

const campaignUpdateSchema = CampaignInputSchema.pick({
  name: true,
  description: true,
  budget: true,
  cpmRate: true,
  cpcRate: true,
  targetCategories: true,
  targetRegions: true,
  status: true,
})
  .partial()
  .extend({
    budget: campaignMoneySchema.optional(),
    cpmRate: campaignMoneySchema.optional().nullable(),
    cpcRate: campaignMoneySchema.optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: CampaignStatusSchema.optional(),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    if (startDate && endDate && endDate <= startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'endDate must be after startDate',
      });
    }
  });

// GET /api/campaigns - List all campaigns
router.get(
  '/',
  authMiddleware,
  roleMiddleware('SPONSOR'),
  validate({
    query: z.object({ status: CampaignStatusSchema.optional(), sponsorId: z.string().optional() }),
  }),
  async (req, res) => {
    try {
      const { status, sponsorId } = req.query;
      const user = res.locals.user;

      if (sponsorId && sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'Cannot access campaigns for another sponsor' });
        return;
      }

      const campaigns = await prisma.campaign.findMany({
        where: {
          ...(status && { status: status }),
          sponsorId: user.sponsorId,
        },
        include: {
          sponsor: { select: { id: true, name: true, logo: true } },
          _count: { select: { creatives: true, placements: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }
);

// GET /api/campaigns/:id - Get single campaign with details
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('SPONSOR'),
  validate({ params: z.object({ id: z.string() }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = res.locals.user;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          sponsor: true,
          creatives: true,
          placements: {
            include: {
              adSlot: true,
              publisher: { select: { id: true, name: true, category: true } },
            },
          },
        },
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'Cannot access another sponsor campaign' });
        return;
      }

      res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }
);

// POST /api/campaigns - Create new campaign
router.post(
  '/',
  authMiddleware,
  roleMiddleware('SPONSOR'),
  validate({
    body: campaignCreateSchema,
  }),
  async (req, res) => {
    try {
      const user = res.locals.user;

      const {
        name,
        description,
        budget,
        cpmRate,
        cpcRate,
        startDate,
        endDate,
        targetCategories,
        targetRegions,
        sponsorId,
      } = req.body;

      if (sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'Cannot create campaign for another sponsor' });
        return;
      }

      const campaign = await prisma.campaign.create({
        data: {
          name,
          description,
          budget,
          cpmRate,
          cpcRate,
          startDate,
          endDate,
          targetCategories,
          targetRegions,
          sponsorId,
        },
        include: {
          sponsor: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// PUT /api/campaigns/:id - Update campaign details
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('SPONSOR'),
  validate({
    params: z.object({ id: z.string() }),
    body: campaignUpdateSchema,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = res.locals.user;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        select: { id: true, sponsorId: true },
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'Cannot update another sponsor campaign' });
        return;
      }

      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: req.body,
        include: {
          sponsor: { select: { id: true, name: true } },
          _count: { select: { creatives: true, placements: true } },
        },
      });

      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
);

// DELETE /api/campaigns/:id - Delete campaign
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('SPONSOR'),
  validate({ params: z.object({ id: z.string() }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = res.locals.user;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        select: { id: true, sponsorId: true },
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.sponsorId !== user.sponsorId) {
        res.status(403).json({ error: 'Cannot delete another sponsor campaign' });
        return;
      }

      await prisma.campaign.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }
);

export default router;
