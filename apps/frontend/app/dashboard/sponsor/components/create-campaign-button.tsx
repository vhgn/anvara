'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaignAction } from '../actions';
import { CampaignForm } from './campaign-form';

export function CreateCampaignButton(props: { sponsorId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-white"
        >
          Create Campaign
        </button>
      </div>

      {isOpen && (
        <CampaignForm
          action={createCampaignAction}
          sponsorId={props.sponsorId}
          submitLabel="Create campaign"
          pendingLabel="Saving..."
          onCancel={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
