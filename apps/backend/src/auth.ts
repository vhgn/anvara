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

type AuthLocals = {
  user: User;
};

type AuthenticatedLocals<TRole extends Role> = {
  user: UserForRole<TRole>;
};

function getBetterAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return 'fallback-secret-for-dev';
  }

  throw new Error('BETTER_AUTH_SECRET must be set outside development and test environments');
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: getBetterAuthSecret(),
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
  AuthLocals
> = async (req, res, next) => {
  await optionalAuthMiddleware(req, res, () => {
    if (!res.locals.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    next();
  });
};
export const optionalAuthMiddleware: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  Partial<AuthLocals>
> = async (req, res, next) => {
  const authInfo = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!authInfo) {
    next();
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

  if (sponsor && publisher) {
    console.warn('Ambiguous user role', userId);
    res.status(403).json({ error: 'Ambiguous user role' });
    return;
  }

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
    const locals = res.locals;

    if (!locals.user || locals.user.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
