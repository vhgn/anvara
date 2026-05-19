import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime, getDayDifference } from './utils';

describe('getDayDifference', () => {
  it('returns 0 for dates on the same calendar day', () => {
    expect(getDayDifference(new Date(2026, 0, 15, 8, 30), new Date(2026, 0, 15, 23, 45))).toBe(0);
  });

  it('returns -1 for the previous calendar day even when less than 24 hours apart', () => {
    expect(getDayDifference(new Date(2026, 0, 15, 23, 30), new Date(2026, 0, 16, 0, 15))).toBe(-1);
  });

  it('returns a positive number when the target is after now', () => {
    expect(getDayDifference(new Date(2026, 0, 15), new Date(2026, 0, 12))).toBe(3);
  });

  it('handles month and year boundaries', () => {
    expect(getDayDifference(new Date(2025, 11, 31), new Date(2026, 0, 2))).toBe(-2);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Today for dates less than one day ago', () => {
    expect(formatRelativeTime(new Date(2026, 0, 15, 8))).toBe('Today');
  });

  it('returns Yesterday for dates one day ago', () => {
    expect(formatRelativeTime(new Date(2026, 0, 14, 8))).toBe('Yesterday');
  });

  it('returns days ago for dates less than one week ago', () => {
    expect(formatRelativeTime(new Date(2026, 0, 12, 8))).toBe('3 days ago');
  });

  it('returns a locale date for dates one week ago or older', () => {
    const date = new Date(2026, 0, 7, 8);

    expect(formatRelativeTime(date)).toBe(date.toLocaleDateString());
  });
});
