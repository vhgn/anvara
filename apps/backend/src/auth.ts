import { type RequestHandler } from 'express';

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

// TODO: This middleware doesn't actually validate anything!
// It should:
// 1. Check for Authorization header or session cookie
// 2. Validate the token/session
// 3. Look up the user in the database
// 4. Attach user info to req.user
// 5. Return 401 if invalid
export const authMiddleware: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  Locals
> = async (_req, res, next) => {
  // Better Auth will handle validation via headers
  // This is a placeholder for protected routes

  // FIXME: real implementation
  const locals = res.locals as Locals;
  locals.user = {
    id: 'abcd',
    email: 'test@example.com',
    role: 'SPONSOR',
    sponsorId: 'sp123',
  };

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
