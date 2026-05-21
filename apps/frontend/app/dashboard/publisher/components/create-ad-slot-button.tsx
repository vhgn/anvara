'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createAdSlotAction } from '../actions';
import { AdSlotForm } from './ad-slot-form';

export function CreateAdSlotButton(props: { publisherId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-white"
        >
          Create Ad Slot
        </button>
      </div>

      {isOpen && (
        <AdSlotForm
          action={createAdSlotAction}
          publisherId={props.publisherId}
          submitLabel="Create ad slot"
          pendingLabel="Saving..."
          onCancel={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            void queryClient.invalidateQueries({
              queryKey: ['ad-slots', 'publisher', props.publisherId],
            });
          }}
        />
      )}
    </div>
  );
}
