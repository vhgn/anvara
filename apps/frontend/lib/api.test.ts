import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlacement } from './api';

vi.mock('./utils', () => ({
  isClient: true,
  logger: {
    error: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('placement API errors', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces backend placement authorization errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Cannot create placement for another sponsor campaign' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 403,
      })
    );

    await expect(
      createPlacement({
        campaignId: 'campaign-1',
        creativeId: 'creative-1',
        adSlotId: 'ad-slot-1',
        publisherId: 'publisher-1',
        agreedPrice: 100,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      })
    ).rejects.toThrow('Cannot create placement for another sponsor campaign');
  });

  it('surfaces backend placement validation errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Creative does not belong to the selected campaign' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    );

    await expect(
      createPlacement({
        campaignId: 'campaign-1',
        creativeId: 'creative-2',
        adSlotId: 'ad-slot-1',
        publisherId: 'publisher-1',
        agreedPrice: 100,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      })
    ).rejects.toThrow('Creative does not belong to the selected campaign');
  });
});
