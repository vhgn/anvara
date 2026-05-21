'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { deleteAdSlotAction, updateAdSlotAction, type AdSlotActionState } from '../actions';
import { AdSlotForm } from './ad-slot-form';
import type { AdSlotListItem } from '@/lib/types';

interface AdSlotCardProps {
  adSlot: AdSlotListItem;
}

const typeColors: Record<string, string> = {
  DISPLAY: 'bg-blue-100 text-blue-700',
  VIDEO: 'bg-red-100 text-red-700',
  NEWSLETTER: 'bg-purple-100 text-purple-700',
  PODCAST: 'bg-orange-100 text-orange-700',
};

const initialDeleteState: AdSlotActionState = {};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  );
}

function EditAdSlotDialog(props: {
  adSlot: AdSlotListItem;
  queryKey: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`edit-ad-slot-${props.adSlot.id}`}
      onClick={props.onClose}
    >
      <div
        className="mt-10 w-full max-w-3xl rounded-lg border border-[--color-border] p-4 text-[--color-foreground] shadow-xl"
        style={{ backgroundColor: 'var(--color-background)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={`edit-ad-slot-${props.adSlot.id}`} className="text-lg font-semibold">
            Edit ad slot
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded border border-[--color-border] px-3 py-1.5 text-sm font-medium"
          >
            Close
          </button>
        </div>

        <AdSlotForm
          action={updateAdSlotAction.bind(null, props.adSlot.id)}
          publisherId={props.adSlot.publisherId}
          adSlot={props.adSlot}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          onCancel={props.onClose}
          onSuccess={() => {
            props.onClose();
            void queryClient.invalidateQueries({ queryKey: props.queryKey });
          }}
        />
      </div>
    </div>
  );
}

export function AdSlotCard({ adSlot }: AdSlotCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const deleteAction = deleteAdSlotAction.bind(null, adSlot.id);
  const [deleteState, formAction] = useActionState(deleteAction, initialDeleteState);
  const queryKey = useMemo(
    () => ['ad-slots', 'publisher', adSlot.publisherId],
    [adSlot.publisherId]
  );

  useEffect(() => {
    if (deleteState.success) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [deleteState.success, queryClient, queryKey]);

  return (
    <div className="rounded-lg border border-[--color-border] p-4">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold">{adSlot.name}</h3>
        <span className={`rounded px-2 py-0.5 text-xs ${typeColors[adSlot.type] || 'bg-gray-100'}`}>
          {adSlot.type}
        </span>
      </div>

      {adSlot.description && (
        <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{adSlot.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${adSlot.isAvailable ? 'text-green-600' : 'text-[--color-muted]'}`}
        >
          {adSlot.isAvailable ? 'Available' : 'Booked'}
        </span>
        <span className="font-semibold text-[--color-primary]">
          ${Number(adSlot.basePrice).toLocaleString()}/mo
        </span>
      </div>

      {deleteState.error && <p className="mt-3 text-sm text-red-600">{deleteState.error}</p>}

      {deleteState.message && <p className="mt-3 text-sm text-green-700">{deleteState.message}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded border border-[--color-border] px-3 py-1.5 text-sm font-medium"
        >
          Edit
        </button>

        <form
          action={formAction}
          onSubmit={(event) => {
            if (!window.confirm(`Delete "${adSlot.name}"?`)) {
              event.preventDefault();
            }
          }}
        >
          <DeleteButton />
        </form>
      </div>

      {isEditing && (
        <EditAdSlotDialog adSlot={adSlot} queryKey={queryKey} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
}
