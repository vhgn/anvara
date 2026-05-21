'use server';
import { headers } from 'next/headers';

export async function getExtraHeaders() {
  let extraHeaders: Record<string, string> = {};
  const headerValues = await headers();

  const cookieHeader = headerValues.get('cookie');
  if (cookieHeader) {
    extraHeaders = {
      Cookie: cookieHeader,
    };
  }

  return extraHeaders;
}
