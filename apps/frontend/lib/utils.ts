// Frontend utility functions

// Format a price for display
export function formatPrice(price: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// Debounce function for search inputs
export function debounce<T extends Array<unknown>>(fn: (...args: T) => unknown, delay: number) {
  let timeoutId: NodeJS.Timeout | undefined;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Parse query string parameters
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(queryString);

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

// Check if we're running on the client side
export const isClient = typeof window !== 'undefined';

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Class name helper (simple cn alternative)
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Sleep utility for testing/debugging
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Deep clone an object
// NOTE: This doesn't handle circular references, dates, or functions
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Logger that only logs in development
export const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[App]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error('[App Error]', ...args);
  },
  warn: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn('[App Warning]', ...args);
  },
};

// TODO: Add a proper date formatting utility
export function formatRelativeTime(date: Date, now = new Date()): string {
  const then = new Date(date);
  const days = getDayDifference(then, now);

  if (days === 0) return 'Today';
  if (days === -1) return 'Yesterday';
  if (days > -7) return `${-days} days ago`;
  return then.toLocaleDateString();
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDayDifference(target: Date, now = new Date()): number {
  const originDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  return Math.round((targetDay - originDay) / MS_PER_DAY);
}
