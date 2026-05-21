'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { CampaignActionState } from '../actions';
import type { CampaignListItem, CampaignStatus } from '@/lib/types';

const initialState: CampaignActionState = {};
const campaignStatuses: CampaignStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
];

type CampaignFormProps = {
  action: (state: CampaignActionState, formData: FormData) => Promise<CampaignActionState>;
  sponsorId: string;
  campaign?: CampaignListItem;
  includeStatus?: boolean;
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function SubmitButton(props: { submitLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-[--color-primary] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? props.pendingLabel : props.submitLabel}
    </button>
  );
}

function FieldError(props: { message?: string }) {
  if (!props.message) {
    return null;
  }

  return <p className="text-xs text-red-600">{props.message}</p>;
}

function toDateInputValue(value?: string) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

export function CampaignForm(props: CampaignFormProps) {
  const [state, formAction] = useFormState(props.action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { campaign, includeStatus = false, onSuccess } = props;
  const values = state.values;

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded border border-[--color-border] p-4"
    >
      <input type="hidden" name="sponsorId" value={props.sponsorId} />

      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.message && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <input
            name="name"
            defaultValue={values?.name ?? campaign?.name}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.name} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Budget</span>
          <input
            name="budget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={values?.budget ?? campaign?.budget}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.budget} />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={values?.description ?? campaign?.description ?? ''}
          rows={3}
          className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Start date</span>
          <input
            name="startDate"
            type="date"
            defaultValue={values?.startDate ?? toDateInputValue(campaign?.startDate)}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.startDate} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">End date</span>
          <input
            name="endDate"
            type="date"
            defaultValue={values?.endDate ?? toDateInputValue(campaign?.endDate)}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.endDate} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">CPM rate</span>
          <input
            name="cpmRate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={values?.cpmRate ?? campaign?.cpmRate ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.cpmRate} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">CPC rate</span>
          <input
            name="cpcRate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={values?.cpcRate ?? campaign?.cpcRate ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.cpcRate} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Target categories</span>
          <input
            name="targetCategories"
            defaultValue={values?.targetCategories ?? campaign?.targetCategories.join(', ') ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Target regions</span>
          <input
            name="targetRegions"
            defaultValue={values?.targetRegions ?? campaign?.targetRegions.join(', ') ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
        </label>
      </div>

      {includeStatus && (
        <label className="space-y-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            name="status"
            defaultValue={values?.status ?? campaign?.status ?? 'DRAFT'}
            className="w-full rounded border border-[--color-border] bg-[--color-background] px-3 py-2"
          >
            {campaignStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.status} />
        </label>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton submitLabel={props.submitLabel} pendingLabel={props.pendingLabel} />
        {props.onCancel && (
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded border border-[--color-border] px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
