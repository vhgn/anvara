'use server';
import { cookies } from 'next/headers';

export async function getExtraHeaders() {
  let extraHeaders: Record<string, string> = {};
  const cookieValues = await cookies();
  const cookieHeader = cookieValues
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  if (cookieHeader) {
    extraHeaders = {
      Cookie: cookieHeader,
    };
  }

  return extraHeaders;
}
