// Utility helpers for the API

type QueryValue = string | string[] | undefined;
type QueryParams = Record<string, QueryValue>;
type Filters = Record<string, QueryValue>;

function getFirstQueryValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Helper to format currency values
export function formatCurrency(amount: number, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
}

// Helper to calculate percentage change
export function calculatePercentChange(oldValue: number, newValue: number) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Parse pagination params from query
export function parsePagination(query: QueryParams) {
  const page = Number.parseInt(getFirstQueryValue(query.page) ?? '', 10) || 1;
  const limit = Number.parseInt(getFirstQueryValue(query.limit) ?? '', 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to build filter object from query params
export const buildFilters = (query: QueryParams, allowedFields: string[]) => {
  const filters: Filters = {};

  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  }

  return filters;
};

export function clampValue(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// TODO: Add proper date formatting helper
// This is a stub that candidates might notice and implement
export function formatDate(date: string | number | Date): string {
  // BUG: Doesn't handle invalid dates
  // TODO: Do we need to handle invalid dates?
  return new Date(date).toLocaleDateString();
}
