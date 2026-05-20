'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdSlots } from '@/lib/api';
import { AdSlotCard } from './ad-slot-card';

export function AdSlotList(props: { publisherId: string }) {
  const { publisherId } = props;
  const {
    data: adSlots = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['ad-slots', 'publisher', publisherId],
    queryFn: () => getAdSlots({ publisherId }),
  });

  if (isLoading) {
    return <div className="py-8 text-center text-[--color-muted]">Loading ad slots...</div>;
  }

  if (isError) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
        Failed to load ad slots
      </div>
    );
  }

  if (adSlots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
        No ad slots yet. Create your first ad slot to start earning.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {adSlots.map((slot) => (
        <AdSlotCard key={slot.id} adSlot={slot} />
      ))}
    </div>
  );
}
