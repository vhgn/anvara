import { type Request, type Response, type NextFunction } from 'express';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from './db.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-dev',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4291',
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  plugins: [],
  advanced: {
    disableCSRFCheck: true,
  },
});

export type User =
  | {
      id: string;
      email: string;
      role: 'SPONSOR';
      sponsorId: string;
    }
  | {
      id: string;
      email: string;
      role: 'PUBLISHER';
      publisherId: string;
    };

type Locals = {
  user: User;
};

export async function authMiddleware(
  req: Request,
  res: Response<unknown, Locals>,
  next: NextFunction
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const [sponsor, publisher] = await Promise.all([
    prisma.sponsor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
    prisma.publisher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  ]);

  if (sponsor) {
    res.locals.user = {
      id: session.user.id,
      email: session.user.email,
      role: 'SPONSOR',
      sponsorId: sponsor.id,
    };
    next();
    return;
  }

  if (publisher) {
    res.locals.user = {
      id: session.user.id,
      email: session.user.email,
      role: 'PUBLISHER',
      publisherId: publisher.id,
    };
    next();
    return;
  }

  res.status(403).json({ error: 'No application role assigned' });
  return;
}

export function roleMiddleware(allowedRoles: Array<'SPONSOR' | 'PUBLISHER'>) {
  return (_req: Request, res: Response<unknown, Locals>, next: NextFunction): void => {
    if (!res.locals.user || !allowedRoles.includes(res.locals.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
