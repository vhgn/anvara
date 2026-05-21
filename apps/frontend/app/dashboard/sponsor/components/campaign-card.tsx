'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { deleteCampaignAction, updateCampaignAction, type CampaignActionState } from '../actions';
import { CampaignForm } from './campaign-form';
import type { CampaignListItem } from '@/lib/types';

interface CampaignCardProps {
  campaign: CampaignListItem;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const initialDeleteState: CampaignActionState = {};

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

function EditCampaignDialog(props: { campaign: CampaignListItem; onClose: () => void }) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`edit-campaign-${props.campaign.id}`}
      onClick={props.onClose}
    >
      <div
        className="mt-10 w-full max-w-3xl rounded-lg border border-[--color-border] p-4 text-[--color-foreground] shadow-xl"
        style={{ backgroundColor: 'var(--color-background)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={`edit-campaign-${props.campaign.id}`} className="text-lg font-semibold">
            Edit campaign
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded border border-[--color-border] px-3 py-1.5 text-sm font-medium"
          >
            Close
          </button>
        </div>

        <CampaignForm
          action={updateCampaignAction.bind(null, props.campaign.id)}
          sponsorId={props.campaign.sponsorId}
          campaign={props.campaign}
          includeStatus
          submitLabel="Save changes"
          pendingLabel="Saving..."
          onCancel={props.onClose}
          onSuccess={() => {
            props.onClose();
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const deleteAction = deleteCampaignAction.bind(null, campaign.id);
  const [deleteState, formAction] = useActionState(deleteAction, initialDeleteState);
  const progress =
    campaign.budget > 0 ? (Number(campaign.spent) / Number(campaign.budget)) * 100 : 0;

  useEffect(() => {
    if (deleteState.success) {
      router.refresh();
    }
  }, [deleteState.success, router]);

  return (
    <div className="rounded-lg border border-[--color-border] p-4">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold">{campaign.name}</h3>
        <span
          className={`rounded px-2 py-0.5 text-xs ${statusColors[campaign.status] || 'bg-gray-100'}`}
        >
          {campaign.status}
        </span>
      </div>

      {campaign.description && (
        <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{campaign.description}</p>
      )}

      <div className="mb-2">
        <div className="flex justify-between text-sm">
          <span className="text-[--color-muted]">Budget</span>
          <span>
            ${Number(campaign.spent).toLocaleString()} / ${Number(campaign.budget).toLocaleString()}
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-[--color-primary]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-[--color-muted]">
        {new Date(campaign.startDate).toLocaleDateString()} -{' '}
        {new Date(campaign.endDate).toLocaleDateString()}
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
            if (!window.confirm(`Delete "${campaign.name}"?`)) {
              event.preventDefault();
            }
          }}
        >
          <DeleteButton />
        </form>
      </div>

      {isEditing && <EditCampaignDialog campaign={campaign} onClose={() => setIsEditing(false)} />}
    </div>
  );
}
