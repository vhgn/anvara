'use server';

import { revalidatePath } from 'next/cache';
import { createAdSlot, deleteAdSlot, updateAdSlot } from '@/lib/api';
import type { AdSlotCreateInput, AdSlotType, AdSlotUpdateInput } from '@/lib/types';

export type AdSlotActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const dashboardPath = '/dashboard/publisher';
const adSlotTypes: AdSlotType[] = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || undefined;
}

function positiveNumber(formData: FormData, key: string, label: string) {
  const rawValue = getString(formData, key);
  const value = Number(rawValue);

  if (!rawValue) {
    return { error: `${label} is required` };
  }

  if (!Number.isFinite(value) || value <= 0) {
    return { error: `${label} must be greater than 0` };
  }

  return { value };
}

function optionalPositiveInteger(formData: FormData, key: string, label: string) {
  const rawValue = getString(formData, key);

  if (!rawValue) {
    return {};
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    return { error: `${label} must be a positive whole number` };
  }

  return { value };
}

function optionalPositiveNumber(formData: FormData, key: string, label: string) {
  const rawValue = getString(formData, key);

  if (!rawValue) {
    return {};
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: `${label} must be greater than 0` };
  }

  return { value };
}

function validateAdSlot(formData: FormData) {
  const fieldErrors: Record<string, string> = {};
  const name = getString(formData, 'name');
  const publisherId = getString(formData, 'publisherId');
  const type = getString(formData, 'type') as AdSlotType;
  const basePrice = positiveNumber(formData, 'basePrice', 'Base price');
  const width = optionalPositiveInteger(formData, 'width', 'Width');
  const height = optionalPositiveInteger(formData, 'height', 'Height');
  const cpmFloor = optionalPositiveNumber(formData, 'cpmFloor', 'CPM floor');

  if (!name) {
    fieldErrors.name = 'Name is required';
  }

  if (!publisherId) {
    fieldErrors.publisherId = 'Publisher is required';
  }

  if (!adSlotTypes.includes(type)) {
    fieldErrors.type = 'Select a valid ad slot type';
  }

  if (basePrice.error) {
    fieldErrors.basePrice = basePrice.error;
  }

  if (width.error) {
    fieldErrors.width = width.error;
  }

  if (height.error) {
    fieldErrors.height = height.error;
  }

  if (cpmFloor.error) {
    fieldErrors.cpmFloor = cpmFloor.error;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const values: AdSlotCreateInput = {
    name,
    publisherId,
    type,
    basePrice: basePrice.value!,
    description: optionalString(formData, 'description'),
    position: optionalString(formData, 'position'),
    width: width.value,
    height: height.value,
    cpmFloor: cpmFloor.value,
    isAvailable: formData.get('isAvailable') === 'on',
  };

  return { values };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createAdSlotAction(
  _prevState: AdSlotActionState,
  formData: FormData
): Promise<AdSlotActionState> {
  const validation = validateAdSlot(formData);

  if (validation.fieldErrors) {
    return { fieldErrors: validation.fieldErrors, error: 'Please fix the highlighted fields.' };
  }

  try {
    await createAdSlot(validation.values!);
    revalidatePath(dashboardPath);
    return { success: true, message: 'Ad slot created.' };
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to create ad slot') };
  }
}

export async function updateAdSlotAction(
  id: string,
  _prevState: AdSlotActionState,
  formData: FormData
): Promise<AdSlotActionState> {
  const validation = validateAdSlot(formData);

  if (validation.fieldErrors) {
    return { fieldErrors: validation.fieldErrors, error: 'Please fix the highlighted fields.' };
  }

  const values = validation.values!;
  const updateValues: AdSlotUpdateInput = {
    name: values.name,
    description: values.description,
    type: values.type,
    position: values.position,
    width: values.width,
    height: values.height,
    basePrice: values.basePrice,
    cpmFloor: values.cpmFloor,
    isAvailable: values.isAvailable,
  };

  try {
    await updateAdSlot(id, updateValues);
    revalidatePath(dashboardPath);
    return { success: true, message: 'Ad slot updated.' };
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to update ad slot') };
  }
}

export async function deleteAdSlotAction(
  id: string,
  _prevState: AdSlotActionState,
  _formData: FormData
): Promise<AdSlotActionState> {
  try {
    await deleteAdSlot(id);
    revalidatePath(dashboardPath);
    return { success: true, message: 'Ad slot deleted.' };
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to delete ad slot') };
  }
}
