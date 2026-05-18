import { type Request, type Response, type NextFunction } from 'express';

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
  user?: User;
};

// TODO: This middleware doesn't actually validate anything!
// It should:
// 1. Check for Authorization header or session cookie
// 2. Validate the token/session
// 3. Look up the user in the database
// 4. Attach user info to req.user
// 5. Return 401 if invalid
export async function authMiddleware(
  _req: Request,
  res: Response<any, Locals>,
  next: NextFunction
) {
  // Better Auth will handle validation via headers
  // This is a placeholder for protected routes

  // FIXME: real implementation
  res.locals.user = {
    id: 'abcd',
    email: 'test@example.com',
    role: 'SPONSOR',
    sponsorId: 'sp123',
  };

  next();
}

export function roleMiddleware(allowedRoles: Array<'SPONSOR' | 'PUBLISHER'>) {
  return (_req: Request, res: Response<any, Locals>, next: NextFunction): void => {
    if (!res.locals.user || !allowedRoles.includes(res.locals.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
