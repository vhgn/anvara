'use server';
import { cookies, headers } from 'next/headers';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export async function getExtraHeaders() {
  let extraHeaders: Record<string, string> = {};
  const headerValues = await headers();

  const cookieHeader = headerValues.get("cookie")
  if (cookieHeader) {
    extraHeaders = {
      Cookie: cookieHeader
    };
  }

  return extraHeaders;
}
