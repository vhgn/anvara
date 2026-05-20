import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { validate } from '../validate.js';
import z from 'zod';
import { AdSlotInputSchema, AdSlotTypeSchema } from '../generated/zod/schemas/index.js';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router: IRouter = Router();

// GET /api/ad-slots - List available ad slots
router.get(
  '/',
  validate({
    query: z.object({
      type: AdSlotTypeSchema.optional(),
      available: z.coerce.boolean().optional(),
      publisherId: z.string().optional(),
    }),
  }),
  async (req, res) => {
    try {
      const { type, available, publisherId } = req.query;

      const adSlots = await prisma.adSlot.findMany({
        where: {
          ...(type && {
            type,
          }),
          ...(available !== undefined && { isAvailable: available }),
          ...(publisherId !== undefined && { publisherId }),
        },
        include: {
          publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
          _count: { select: { placements: true } },
        },
        orderBy: { basePrice: 'desc' },
      });

      res.json(adSlots);
    } catch (error) {
      console.error('Error fetching ad slots:', error);
      res.status(500).json({ error: 'Failed to fetch ad slots' });
    }
  }
);

// GET /api/ad-slots/:id - Get single ad slot with details
router.get(
  '/:id',
  authMiddleware,
  validate({ params: z.object({ id: z.string() }) }),
  async (req, res) => {
    try {
      const { id } = req.params;

      const adSlot = await prisma.adSlot.findUnique({
        where: { id },
        include: {
          publisher: true,
          placements: {
            include: {
              campaign: { select: { id: true, name: true, status: true } },
            },
          },
        },
      });

      if (!adSlot) {
        res.status(404).json({ error: 'Ad slot not found' });
        return;
      }

      // if (adSlot.publisherId !== user.publisherId) {
      //   res.status(403).json({ error: 'Cannot access another publisher ad slot' });
      //   return;
      // }

      res.json(adSlot);
    } catch (error) {
      console.error('Error fetching ad slot:', error);
      res.status(500).json({ error: 'Failed to fetch ad slot' });
    }
  }
);

// POST /api/ad-slots - Create new ad slot
router.post(
  '/',
  authMiddleware,
  roleMiddleware('PUBLISHER'),
  validate({
    body: AdSlotInputSchema.pick({
      name: true,
      description: true,
      type: true,
      position: true,
      width: true,
      height: true,
      basePrice: true,
      cpmFloor: true,
      isAvailable: true,
      publisherId: true,
    })
      .extend({
        basePrice: AdSlotInputSchema.shape.basePrice.positive(),
      })
      .partial({
        description: true,
        position: true,
        width: true,
        height: true,
        cpmFloor: true,
        isAvailable: true,
      }),
  }),
  async (req, res) => {
    try {
      const user = res.locals.user;

      const {
        name,
        description,
        type,
        position,
        width,
        height,
        basePrice,
        cpmFloor,
        isAvailable,
        publisherId,
      } = req.body;

      if (publisherId !== user.publisherId) {
        res.status(403).json({ error: 'Cannot create ad slot for another publisher' });
        return;
      }

      const adSlot = await prisma.adSlot.create({
        data: {
          name,
          description,
          type,
          position,
          width,
          height,
          basePrice,
          cpmFloor,
          isAvailable,
          publisherId,
        },
        include: {
          publisher: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(adSlot);
    } catch (error) {
      console.error('Error creating ad slot:', error);
      res.status(500).json({ error: 'Failed to create ad slot' });
    }
  }
);

// POST /api/ad-slots/:id/book - Book an ad slot (simplified booking flow)
// This marks the slot as unavailable and creates a simple booking record
router.post(
  '/:id/book',
  authMiddleware,
  validate({
    params: z.object({ id: z.string() }),
    body: z.object({ sponsorId: z.string(), message: z.string().optional() }),
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sponsorId, message } = req.body;

      // Check if slot exists and is available
      const adSlot = await prisma.adSlot.findUnique({
        where: { id },
        include: { publisher: true },
      });

      if (!adSlot) {
        res.status(404).json({ error: 'Ad slot not found' });
        return;
      }

      if (!adSlot.isAvailable) {
        res.status(400).json({ error: 'Ad slot is no longer available' });
        return;
      }

      // Mark slot as unavailable
      const updatedSlot = await prisma.adSlot.update({
        where: { id },
        data: { isAvailable: false },
        include: {
          publisher: { select: { id: true, name: true } },
        },
      });

      // In a real app, you'd create a Placement record here
      // For now, we just mark it as booked
      console.log(`Ad slot ${id} booked by sponsor ${sponsorId}. Message: ${message || 'None'}`);

      res.json({
        success: true,
        message: 'Ad slot booked successfully!',
        adSlot: updatedSlot,
      });
    } catch (error) {
      console.error('Error booking ad slot:', error);
      res.status(500).json({ error: 'Failed to book ad slot' });
    }
  }
);

// POST /api/ad-slots/:id/unbook - Reset ad slot to available (for testing)
router.post(
  '/:id/unbook',
  authMiddleware,
  validate({ params: z.object({ id: z.string() }) }),
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedSlot = await prisma.adSlot.update({
        where: { id },
        data: { isAvailable: true },
        include: {
          publisher: { select: { id: true, name: true } },
        },
      });

      res.json({
        success: true,
        message: 'Ad slot is now available again',
        adSlot: updatedSlot,
      });
    } catch (error) {
      console.error('Error unbooking ad slot:', error);
      res.status(500).json({ error: 'Failed to unbook ad slot' });
    }
  }
);

// PUT /api/ad-slots/:id - Update ad slot details
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('PUBLISHER'),
  validate({
    params: z.object({ id: z.string() }),
    body: AdSlotInputSchema.pick({
      name: true,
      description: true,
      type: true,
      position: true,
      width: true,
      height: true,
      basePrice: true,
      cpmFloor: true,
      isAvailable: true,
    })
      .partial()
      .extend({
        type: AdSlotTypeSchema.optional(),
        basePrice: AdSlotInputSchema.shape.basePrice.positive().optional(),
      }),
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = res.locals.user;

      const adSlot = await prisma.adSlot.findUnique({
        where: { id },
        select: { id: true, publisherId: true },
      });

      if (!adSlot) {
        res.status(404).json({ error: 'Ad slot not found' });
        return;
      }

      if (adSlot.publisherId !== user.publisherId) {
        res.status(403).json({ error: 'Cannot update another publisher ad slot' });
        return;
      }

      const updatedAdSlot = await prisma.adSlot.update({
        where: { id },
        data: req.body,
        include: {
          publisher: { select: { id: true, name: true } },
          _count: { select: { placements: true } },
        },
      });

      res.json(updatedAdSlot);
    } catch (error) {
      console.error('Error updating ad slot:', error);
      res.status(500).json({ error: 'Failed to update ad slot' });
    }
  }
);

// DELETE /api/ad-slots/:id - Delete ad slot
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('PUBLISHER'),
  validate({ params: z.object({ id: z.string() }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = res.locals.user;

      const adSlot = await prisma.adSlot.findUnique({
        where: { id },
        select: { id: true, publisherId: true },
      });

      if (!adSlot) {
        res.status(404).json({ error: 'Ad slot not found' });
        return;
      }

      if (adSlot.publisherId !== user.publisherId) {
        res.status(403).json({ error: 'Cannot delete another publisher ad slot' });
        return;
      }

      await prisma.adSlot.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting ad slot:', error);
      res.status(500).json({ error: 'Failed to delete ad slot' });
    }
  }
);

export default router;
