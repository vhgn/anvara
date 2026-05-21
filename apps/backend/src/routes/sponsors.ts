import { Router, type IRouter } from 'express';
import { prisma } from '../db.js';
import z from 'zod';
import { validate } from '../validate.js';
import { SponsorInputSchema } from '../generated/zod/schemas/index.js';

const router: IRouter = Router();

// GET /api/sponsors - List all sponsors
router.get('/', async (_req, res) => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sponsors);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
});

// GET /api/sponsors/:id - Get single sponsor with campaigns
// TODO: understand requirements behind sponsor visibility
// This is now unused, so I am unsure where it will be used
// router.get('/:id', validate({ params: z.object({ id: z.string() }) }), async (req, res) => {
//   try {
//     const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
//     const sponsor = await prisma.sponsor.findUnique({
//       where: { id },
//       include: {
//         campaigns: {
//           include: {
//             _count: { select: { placements: true } },
//           },
//         },
//         payments: {
//           orderBy: { createdAt: 'desc' },
//           take: 5,
//         },
//       },
//     });
//
//     if (!sponsor) {
//       res.status(404).json({ error: 'Sponsor not found' });
//       return;
//     }
//
//     res.json(sponsor);
//   } catch (error) {
//     console.error('Error fetching sponsor:', error);
//     res.status(500).json({ error: 'Failed to fetch sponsor' });
//   }
// });

// POST /api/sponsors - Create new sponsor
router.post(
  '/',
  validate({
    body: SponsorInputSchema.pick({
      name: true,
      email: true,
      website: true,
      logo: true,
      description: true,
      industry: true,
    }),
  }),
  async (req, res) => {
    try {
      const { name, email, website, logo, description, industry } = req.body;

      const sponsor = await prisma.sponsor.create({
        data: { name, email, website, logo, description, industry },
      });

      res.status(201).json(sponsor);
    } catch (error) {
      console.error('Error creating sponsor:', error);
      res.status(500).json({ error: 'Failed to create sponsor' });
    }
  }
);

// TODO: Add PUT /api/sponsors/:id endpoint
// Update sponsor details

export default router;
