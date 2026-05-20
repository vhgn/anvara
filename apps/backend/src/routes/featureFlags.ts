import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../auth.js';
import { validate } from '../validate.js';
import { weightedRandomPick } from '../utils/helpers.js';
import z from 'zod';

const router: IRouter = Router();

// GET /api/feature-flags/:key - Get overall platform stats
router.get(
  '/:key',
  authMiddleware,
  validate({ params: z.object({ key: z.string() }) }),
  async (req, res) => {
    const featureFlag = await prisma.featureFlag.findUnique({
      where: {
        key: req.params.key,
      },
      select: {
        id: true,
        participants: {
          select: {
            rollout: {
              select: {
                value: true,
              },
            },
          },
          where: {
            userId: res.locals.user.id,
          },
        },
      },
    });

    if (!featureFlag) {
      res.status(404).json({ error: 'Feature flag not found' });
      return;
    }

    const participant = featureFlag.participants.at(0);
    let value: string;
    if (participant) {
      value = participant.rollout.value;
    } else {
      const rollouts = await prisma.featureRollout.findMany({
        where: {
          featureId: featureFlag.id,
        },
      });

      const rollout = weightedRandomPick(
        rollouts.map((rollout) => ({ weight: rollout.percentage.toNumber(), value: rollout }))
      );

      // Feature flag should be used on frontend when at least one option is configured
      if (!rollout) {
        res.status(501).json({ error: 'Feature flag does not have rollout values' });
        return;
      }

      const participant = await prisma.rolloutParticipant.upsert({
        select: {
          rollout: {
            select: {
              value: true,
            },
          },
        },
        where: {
          userId_featureId: {
            featureId: featureFlag.id,
            userId: res.locals.user.id,
          },
        },
        create: {
          featureId: featureFlag.id,
          rolloutId: rollout.id,
          userId: res.locals.user.id,
        },
        update: {},
      });

      // Not using rollout value to avoid providing two different rollout values on parallel requests
      value = participant.rollout.value;
    }

    res
      .status(200)
      .header('Cache-Control', 'private, max-age=300')
      .header('Vary', 'Authorization')
      .json({ value });
  }
);

export default router;
