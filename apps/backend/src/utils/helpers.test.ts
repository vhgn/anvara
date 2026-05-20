import { describe, expect, it } from 'vitest';
import { clampValue, weightedRandomPick } from './helpers.js';

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

describe('weightedRandomPick', () => {
  const options = [
    { value: 'low', weight: 1 },
    { value: 'medium', weight: 3 },
    { value: 'high', weight: 6 },
  ];

  it('picks values based on deterministic weighted ranges', () => {
    expect(weightedRandomPick(options, () => 0)).toBe('low');
    expect(weightedRandomPick(options, () => 0.1)).toBe('medium');
    expect(weightedRandomPick(options, () => 0.39)).toBe('medium');
    expect(weightedRandomPick(options, () => 0.4)).toBe('high');
    expect(weightedRandomPick(options, () => 0.999)).toBe('high');
  });

  it('does not pick zero-weight options', () => {
    const weightedOptions = [
      { value: 'zero', weight: 0 },
      { value: 'winner', weight: 5 },
    ];

    expect(weightedRandomPick(weightedOptions, () => 0)).toBe('winner');
    expect(weightedRandomPick(weightedOptions, () => 0.999)).toBe('winner');
  });

  it('returns undefined when there is nothing pickable', () => {
    expect(weightedRandomPick([], () => 0)).toBeUndefined();
    expect(
      weightedRandomPick(
        [
          { value: 'zero', weight: 0 },
          { value: 'also-zero', weight: 0 },
        ],
        () => 0
      )
    ).toBeUndefined();
  });
});
