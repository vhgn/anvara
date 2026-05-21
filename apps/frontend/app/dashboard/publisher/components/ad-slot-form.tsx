'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { AdSlotActionState } from '../actions';
import type { AdSlotListItem, AdSlotType } from '@/lib/types';

const initialState: AdSlotActionState = {};
const adSlotTypes: AdSlotType[] = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'];

type AdSlotFormProps = {
  action: (state: AdSlotActionState, formData: FormData) => Promise<AdSlotActionState>;
  publisherId: string;
  adSlot?: AdSlotListItem;
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

export function AdSlotForm(props: AdSlotFormProps) {
  const [state, formAction] = useFormState(props.action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { adSlot } = props;

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      props.onSuccess?.();
    }
  }, [props, state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded border border-[--color-border] p-4"
    >
      <input type="hidden" name="publisherId" value={props.publisherId} />

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
            defaultValue={adSlot?.name}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.name} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            name="type"
            defaultValue={adSlot?.type ?? 'DISPLAY'}
            className="w-full rounded border border-[--color-border] bg-[--color-background] px-3 py-2"
          >
            {adSlotTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.type} />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={adSlot?.description ?? ''}
          rows={3}
          className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Base price</span>
          <input
            name="basePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={adSlot?.basePrice}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.basePrice} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Position</span>
          <input
            name="position"
            defaultValue={adSlot?.position ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">CPM floor</span>
          <input
            name="cpmFloor"
            type="number"
            min="0"
            step="0.01"
            defaultValue={adSlot?.cpmFloor ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.cpmFloor} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Width</span>
          <input
            name="width"
            type="number"
            min="1"
            defaultValue={adSlot?.width ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.width} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Height</span>
          <input
            name="height"
            type="number"
            min="1"
            defaultValue={adSlot?.height ?? ''}
            className="w-full rounded border border-[--color-border] bg-transparent px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.height} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input name="isAvailable" type="checkbox" defaultChecked={adSlot?.isAvailable ?? true} />
        <span>Available for booking</span>
      </label>

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
