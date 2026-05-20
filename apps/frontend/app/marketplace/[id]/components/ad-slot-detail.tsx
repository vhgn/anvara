'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookAdSlot, getAdSlot, getUserRole, unbookAdSlot } from '@/lib/api';
import { authClient } from '@/auth-client';
import type { AdSlotDetail as AdSlot, User } from '@/lib/types';

const typeColors: Record<string, string> = {
  DISPLAY: 'bg-blue-100 text-blue-700',
  VIDEO: 'bg-red-100 text-red-700',
  NEWSLETTER: 'bg-purple-100 text-purple-700',
  PODCAST: 'bg-orange-100 text-orange-700',
};

interface Props {
  id: string;
}

export function AdSlotDetail({ id }: Props) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const user: User | null = session?.user ?? null;
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const {
    data: adSlot,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ['ad-slot', id],
    queryFn: () => getAdSlot(id),
  });

  const { data: roleInfo, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: () => getUserRole(user!.id),
    enabled: Boolean(user?.id),
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!roleInfo?.sponsorId || !adSlot) {
        throw new Error('Missing booking details');
      }

      await bookAdSlot(adSlot.id, {
        sponsorId: roleInfo.sponsorId,
        message: message || undefined,
      });

      return adSlot.id;
    },
    onMutate: () => {
      setBookingError(null);
    },
    onSuccess: (adSlotId) => {
      setBookingSuccess(true);
      queryClient.setQueryData<AdSlot>(['ad-slot', adSlotId], (current) =>
        current ? { ...current, isAvailable: false } : current
      );
      void queryClient.invalidateQueries({ queryKey: ['ad-slots'] });
    },
    onError: (err) => {
      setBookingError(err instanceof Error ? err.message : 'Failed to book placement');
    },
  });

  const unbookMutation = useMutation({
    mutationFn: async () => {
      if (!adSlot) {
        throw new Error('Missing ad slot');
      }

      await unbookAdSlot(adSlot.id);

      return adSlot.id;
    },
    onSuccess: (adSlotId) => {
      setBookingSuccess(false);
      setMessage('');
      queryClient.setQueryData<AdSlot>(['ad-slot', adSlotId], (current) =>
        current ? { ...current, isAvailable: true } : current
      );
      void queryClient.invalidateQueries({ queryKey: ['ad-slots'] });
    },
    onError: () => {
      setBookingError('Failed to reset booking');
    },
  });

  const handleBooking = async () => {
    bookMutation.mutate();
  };

  const handleUnbook = async () => {
    unbookMutation.mutate();
  };

  if (loading) {
    return <div className="py-12 text-center text-[--color-muted]">Loading...</div>;
  }

  if (isError || !adSlot) {
    return (
      <div className="space-y-4">
        <Link href="/marketplace" className="text-[--color-primary] hover:underline">
          ← Back to Marketplace
        </Link>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          {isError ? 'Failed to load ad slot details' : 'Ad slot not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/marketplace" className="text-[--color-primary] hover:underline">
        ← Back to Marketplace
      </Link>

      <div className="rounded-lg border border-[--color-border] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{adSlot.name}</h1>
            {adSlot.publisher && (
              <p className="text-[--color-muted]">
                by {adSlot.publisher.name}
                {adSlot.publisher.website && (
                  <>
                    {' '}
                    ·{' '}
                    <a
                      href={adSlot.publisher.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[--color-primary] hover:underline"
                    >
                      {adSlot.publisher.website}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
          <span className={`rounded px-3 py-1 text-sm ${typeColors[adSlot.type] || 'bg-gray-100'}`}>
            {adSlot.type}
          </span>
        </div>

        {adSlot.description && <p className="mb-6 text-[--color-muted]">{adSlot.description}</p>}

        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <div>
            <span
              className={`text-sm font-medium ${adSlot.isAvailable ? 'text-green-600' : 'text-[--color-muted]'}`}
            >
              {adSlot.isAvailable ? '● Available' : '○ Currently Booked'}
            </span>
            {!adSlot.isAvailable && !bookingSuccess && (
              <button
                onClick={handleUnbook}
                className="ml-3 text-sm text-[--color-primary] underline hover:opacity-80"
              >
                Reset listing
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[--color-primary]">
              ${Number(adSlot.basePrice).toLocaleString()}
            </p>
            <p className="text-sm text-[--color-muted]">per month</p>
          </div>
        </div>

        {adSlot.isAvailable && !bookingSuccess && (
          <div className="mt-6 border-t border-[--color-border] pt-6">
            <h2 className="mb-4 text-lg font-semibold">Request This Placement</h2>

            {roleLoading ? (
              <div className="py-4 text-center text-[--color-muted]">Loading...</div>
            ) : roleInfo?.role === 'sponsor' && roleInfo?.sponsorId ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[--color-muted]">
                    Your Company
                  </label>
                  <p className="text-[--color-foreground]">{roleInfo.name || user?.name}</p>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1 block text-sm font-medium text-[--color-muted]"
                  >
                    Message to Publisher (optional)
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the publisher about your campaign goals..."
                    className="w-full rounded-lg border border-[--color-border] bg-[--color-background] px-3 py-2 text-[--color-foreground] placeholder:text-[--color-muted] focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
                    rows={3}
                  />
                </div>
                {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
                <button
                  onClick={handleBooking}
                  disabled={bookMutation.isPending}
                  className="w-full rounded-lg bg-[--color-primary] px-4 py-3 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {bookMutation.isPending ? 'Booking...' : 'Book This Placement'}
                </button>
              </div>
            ) : (
              <div>
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-3 font-semibold text-gray-500"
                >
                  Request This Placement
                </button>
                <p className="mt-2 text-center text-sm text-[--color-muted]">
                  {user
                    ? 'Only sponsors can request placements'
                    : 'Log in as a sponsor to request this placement'}
                </p>
              </div>
            )}
          </div>
        )}

        {bookingSuccess && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="font-semibold text-green-800">Placement Booked!</h3>
            <p className="mt-1 text-sm text-green-700">
              Your request has been submitted. The publisher will be in touch soon.
            </p>
            <button
              onClick={handleUnbook}
              className="mt-3 text-sm text-green-700 underline hover:text-green-800"
            >
              Remove Booking (reset for testing)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
