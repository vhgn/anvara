import { isClient, logger } from './utils';
import type {
  AdSlot,
  AdSlotBookingInput,
  AdSlotBookingResponse,
  AdSlotCreateInput,
  AdSlotDetail,
  AdSlotListItem,
  AdSlotType,
  AdSlotUpdateInput,
  Campaign,
  CampaignCreateInput,
  CampaignDetail,
  CampaignListItem,
  CampaignStatus,
  CampaignUpdateInput,
  DashboardStats,
  PlacementCreateInput,
  PlacementCreateResponse,
  PlacementListItem,
  PlacementStatus,
  Publisher,
  RoleData,
  Sponsor,
} from './types';
import { getExtraHeaders } from './ssr';

// TODO: Add authentication token to requests
// Hint: Include credentials: 'include' for cookie-based auth, or
// add Authorization header for token-based auth

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export async function api<T>(endpoint: string, options?: globalThis.RequestInit): Promise<T> {
  let extraHeaders: Record<string, string> = {};
  if (!isClient) {
    extraHeaders = await getExtraHeaders();
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers, ...extraHeaders },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const { error } = await res.json().catch((e) => {
      logger.error(e);
      return { error: 'Failed to parse error' };
    });
    throw new Error(error);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

type ServerSession = {
  user: {
    id: string;
    email: string;
  };
  session: unknown;
};

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    return await api<ServerSession>('/api/auth/get-session', {
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// Campaigns
export const getCampaigns = (sponsorId?: string, status?: CampaignStatus) =>
  api<CampaignListItem[]>(`/api/campaigns${queryString({ sponsorId, status })}`);
export const getCampaign = (id: string) => api<CampaignDetail>(`/api/campaigns/${id}`);
export const createCampaign = (data: CampaignCreateInput) =>
  api<Campaign & { sponsor: Pick<Sponsor, 'id' | 'name'> }>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateCampaign = (id: string, data: CampaignUpdateInput) =>
  api<CampaignListItem>(`/api/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCampaign = (id: string) =>
  api<void>(`/api/campaigns/${id}`, { method: 'DELETE' });

// Ad Slots
export const getAdSlots = (filters?: { type?: AdSlotType; available?: boolean } | string) =>
  api<AdSlotListItem[]>(
    `/api/ad-slots${queryString(typeof filters === 'string' ? {} : (filters ?? {}))}`
  );
export const getAdSlot = (id: string) => api<AdSlotDetail>(`/api/ad-slots/${id}`);
export const createAdSlot = (data: AdSlotCreateInput) =>
  api<AdSlot & { publisher: Pick<Publisher, 'id' | 'name'> }>('/api/ad-slots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateAdSlot = (id: string, data: AdSlotUpdateInput) =>
  api<AdSlotListItem>(`/api/ad-slots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAdSlot = (id: string) => api<void>(`/api/ad-slots/${id}`, { method: 'DELETE' });
export const bookAdSlot = (id: string, data: AdSlotBookingInput) =>
  api<AdSlotBookingResponse>(`/api/ad-slots/${id}/book`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const unbookAdSlot = (id: string) =>
  api<AdSlotBookingResponse>(`/api/ad-slots/${id}/unbook`, { method: 'POST' });

// Placements
export const getPlacements = (filters?: {
  campaignId?: string;
  publisherId?: string;
  status?: PlacementStatus;
}) => api<PlacementListItem[]>(`/api/placements${queryString(filters ?? {})}`);
export const createPlacement = (data: PlacementCreateInput) =>
  api<PlacementCreateResponse>('/api/placements', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Dashboard
export const getStats = () => api<DashboardStats>('/api/dashboard/stats');

// Feature flags
export const getFeatureFlag = (key: string) =>
  api<{ value: string }>(`/api/feature-flags/${key}`).then(({ value }) => value);

// User's role
export async function getUserRole(userId: string): Promise<RoleData> {
  try {
    return await api<RoleData>(`/api/auth/role/${userId}`, {
      cache: 'no-store', // Always fetch fresh role data
    });
  } catch {
    return { role: null };
  }
}
