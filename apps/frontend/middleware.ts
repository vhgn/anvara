import { NextResponse, type NextRequest } from 'next/server';

const FEATURE_FLAG_PARTICIPANT_KEY = "feature-flags.participant"
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // This ensures we can have a streaming page with server loaded feature flag value
  if (!request.cookies.has(FEATURE_FLAG_PARTICIPANT_KEY)) {
    response.cookies.set(FEATURE_FLAG_PARTICIPANT_KEY, crypto.randomUUID(), {
      maxAge: ONE_YEAR_IN_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
