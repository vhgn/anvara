import { describe, expect, it } from 'vitest';
import { clampValue } from './helpers.js';

describe('clampValue', () => {
  it('clamps positive values to the provided range', () => {
    expect(clampValue(3, 5, 10)).toBe(5);
    expect(clampValue(7, 5, 10)).toBe(7);
    expect(clampValue(12, 5, 10)).toBe(10);
  });

  it('clamps negative values to the provided range', () => {
    expect(clampValue(-12, -10, -5)).toBe(-10);
    expect(clampValue(-7, -10, -5)).toBe(-7);
    expect(clampValue(-3, -10, -5)).toBe(-5);
  });
});
