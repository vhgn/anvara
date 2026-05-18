import { Suspense } from 'react';
import { AdSlotGrid } from './components/ad-slot-grid';

// FIXME: This page fetches all ad slots client-side. Consider:
// 1. Server-side pagination with searchParams
// 2. Filtering by category, price range, slot type
// 3. Search functionality

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-[--color-muted]">Browse available ad slots from our publishers</p>
        {/* TODO: Add search input and filter controls */}
      </div>

      <Suspense
        fallback={
          <div className="py-12 text-center text-[--color-muted]">Loading marketplace...</div>
        }
      >
        <AdSlotGrid />
      </Suspense>
    </div>
  );
}
