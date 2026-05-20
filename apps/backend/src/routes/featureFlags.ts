import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import { optionalAuthMiddleware } from '../auth.js';
import { validate } from '../validate.js';
import { weightedRandomPick } from '../utils/helpers.js';
import z from 'zod';

const router: IRouter = Router();

const FEATURE_FLAG_PARTICIPANT_KEY = "feature-flags.participant"

// GET /api/feature-flags/:key - Get overall platform stats
router.get(
  '/:key',
  optionalAuthMiddleware,
  validate({ params: z.object({ key: z.string() }) }),
  async (req, res) => {
    const participantIdCookie = req.cookies[FEATURE_FLAG_PARTICIPANT_KEY]

    let participantId: string
    if (participantIdCookie) {
      participantId = participantIdCookie
    } else {
      console.log("Generating participantId")
      participantId = crypto.randomUUID()
    }


    console.log("Cookies", JSON.stringify(req.cookies))
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
            participantId,
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
          participantId_featureId: {
            featureId: featureFlag.id,
            participantId,
          },
        },
        create: {
          featureId: featureFlag.id,
          rolloutId: rollout.id,
          participantId,
        },
        update: {},
      });

      // Not using rollout value to avoid providing two different rollout values on parallel requests
      value = participant.rollout.value;
    }

    const cacheTimeSeconds = 5 * 60

    res
      .status(200)
      .header('Cache-Control', `private, max-age=${cacheTimeSeconds}`)
      .header('Vary', 'Authorization')
      .cookie(FEATURE_FLAG_PARTICIPANT_KEY, participantId)
      .json({ value });
  }
);

export default router;
