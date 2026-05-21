'use server';

import { revalidatePath } from 'next/cache';
import { createCampaign, deleteCampaign, updateCampaign } from '@/lib/api';
import type { CampaignCreateInput, CampaignStatus, CampaignUpdateInput } from '@/lib/types';

export type CampaignActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const dashboardPath = '/dashboard/sponsor';
const campaignStatuses: CampaignStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || undefined;
}

function parseList(formData: FormData, key: string) {
  return getString(formData, key)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
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

function validateCampaign(formData: FormData, includeStatus: boolean) {
  const fieldErrors: Record<string, string> = {};
  const name = getString(formData, 'name');
  const sponsorId = getString(formData, 'sponsorId');
  const startDate = getString(formData, 'startDate');
  const endDate = getString(formData, 'endDate');
  const budget = positiveNumber(formData, 'budget', 'Budget');
  const cpmRate = optionalPositiveNumber(formData, 'cpmRate', 'CPM rate');
  const cpcRate = optionalPositiveNumber(formData, 'cpcRate', 'CPC rate');
  const status = getString(formData, 'status') as CampaignStatus;

  if (!name) {
    fieldErrors.name = 'Name is required';
  }

  if (!sponsorId) {
    fieldErrors.sponsorId = 'Sponsor is required';
  }

  if (budget.error) {
    fieldErrors.budget = budget.error;
  }

  if (!startDate) {
    fieldErrors.startDate = 'Start date is required';
  }

  if (!endDate) {
    fieldErrors.endDate = 'End date is required';
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    fieldErrors.endDate = 'End date must be after the start date';
  }

  if (cpmRate.error) {
    fieldErrors.cpmRate = cpmRate.error;
  }

  if (cpcRate.error) {
    fieldErrors.cpcRate = cpcRate.error;
  }

  if (includeStatus && !campaignStatuses.includes(status)) {
    fieldErrors.status = 'Select a valid status';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const values: CampaignCreateInput & { status?: CampaignStatus } = {
    name,
    sponsorId,
    budget: budget.value!,
    description: optionalString(formData, 'description'),
    startDate,
    endDate,
    cpmRate: cpmRate.value,
    cpcRate: cpcRate.value,
    targetCategories: parseList(formData, 'targetCategories'),
    targetRegions: parseList(formData, 'targetRegions'),
    ...(includeStatus ? { status } : {}),
  };

  return { values };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createCampaignAction(
  _prevState: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const validation = validateCampaign(formData, false);

  if (validation.fieldErrors) {
    return { fieldErrors: validation.fieldErrors, error: 'Please fix the highlighted fields.' };
  }

  try {
    await createCampaign(validation.values!);
    revalidatePath(dashboardPath);
    return { success: true, message: 'Campaign created.' };
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to create campaign') };
  }
}

export async function updateCampaignAction(
  id: string,
  _prevState: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const validation = validateCampaign(formData, true);

  if (validation.fieldErrors) {
    return { fieldErrors: validation.fieldErrors, error: 'Please fix the highlighted fields.' };
  }

  const values = validation.values!;
  const updateValues: CampaignUpdateInput = {
    name: values.name,
    description: values.description,
    budget: values.budget,
    cpmRate: values.cpmRate,
    cpcRate: values.cpcRate,
    startDate: values.startDate,
    endDate: values.endDate,
    targetCategories: values.targetCategories,
    targetRegions: values.targetRegions,
    status: values.status,
  };

  try {
    await updateCampaign(id, updateValues);
    revalidatePath(dashboardPath);
    return { success: true, message: 'Campaign updated.' };
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to update campaign') };
  }
}

export async function deleteCampaignAction(
  id: string,
  _prevState: CampaignActionState,
  _formData: FormData
): Promise<CampaignActionState> {
  try {
    await deleteCampaign(id);
    revalidatePath(dashboardPath);
    return { success: true, message: 'Campaign deleted.' };
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to delete campaign') };
  }
}
