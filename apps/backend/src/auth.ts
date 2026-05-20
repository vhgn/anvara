import { type RequestHandler } from 'express';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from './db.js';

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

type Role = User['role'];
type UserForRole<TRole extends Role> = Extract<User, { role: TRole }>;

type Locals = {
  user: User;
};

type AuthenticatedLocals<TRole extends Role> = {
  user: UserForRole<TRole>;
};

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

export const authMiddleware: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  Locals
> = async (req, res, next) => {
  const authInfo = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!authInfo) {
    console.info('Headers', fromNodeHeaders(req.headers));
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const userId = authInfo.user.id;

  const [sponsor, publisher] = await Promise.all([
    prisma.sponsor.findUnique({
      where: { userId },
      select: { id: true, name: true },
    }),
    prisma.publisher.findUnique({
      where: { userId },
      select: { id: true, name: true },
    }),
  ]);

  if (sponsor) {
    res.locals.user = {
      id: userId,
      email: authInfo.user.email,
      role: 'SPONSOR',
      sponsorId: sponsor.id,
    };
  } else if (publisher) {
    res.locals.user = {
      id: userId,
      email: authInfo.user.email,
      role: 'PUBLISHER',
      publisherId: publisher.id,
    };
  } else {
    res.status(400).json({ error: 'Role not identified' });
    return;
  }

  next();
};

export function roleMiddleware<TRole extends Role>(
  role: TRole
): RequestHandler<Record<string, string>, unknown, unknown, unknown, AuthenticatedLocals<TRole>> {
  return (_req, res, next): void => {
    const locals = res.locals as Locals;

    if (!locals.user || locals.user.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
