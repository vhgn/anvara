export type UserRole = 'sponsor' | 'publisher';

export interface User {
  id: string;
  name: string;
  email: string;
}

export type RoleData =
  | {
      role: 'sponsor';
      sponsorId: string;
      name: string;

      publisherId?: undefined;
    }
  | {
      role: 'publisher';
      publisherId: string;
      name: string;

      sponsorId?: undefined;
    }
  | {
      role: null;

      name?: undefined;
      sponsorId?: undefined;
      publisherId?: undefined;
    };

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AdSlotType = 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST';

export type PricingModel = 'CPM' | 'CPC' | 'CPA' | 'FLAT_RATE';

export type PlacementStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'REJECTED';

type JsonDate = string;

export interface SponsorSummary {
  id: string;
  name: string;
  logo?: string | null;
}

export interface Sponsor extends SponsorSummary {
  userId?: string | null;
  email: string;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  subscriptionTier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  subscriptionEndsAt?: JsonDate | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: JsonDate;
  updatedAt: JsonDate;
}

export interface PublisherSummary {
  id: string;
  name: string;
  category?: string | null;
  monthlyViews?: number;
}

export interface Publisher extends PublisherSummary {
  userId?: string | null;
  email: string;
  website?: string | null;
  avatar?: string | null;
  bio?: string | null;
  monthlyViews: number;
  subscriberCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: JsonDate;
  updatedAt: JsonDate;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  budget: number;
  spent: number;
  cpmRate?: number | null;
  cpcRate?: number | null;
  startDate: JsonDate;
  endDate: JsonDate;
  targetCategories: string[];
  targetRegions: string[];
  status: CampaignStatus;
  createdAt: JsonDate;
  updatedAt: JsonDate;
  sponsorId: string;
}

export interface Creative {
  id: string;
  name: string;
  type: 'BANNER' | 'VIDEO' | 'NATIVE' | 'SPONSORED_POST' | 'PODCAST_READ';
  assetUrl: string;
  clickUrl: string;
  altText?: string;
  width?: number | null;
  height?: number | null;
  isApproved: boolean;
  isActive: boolean;
  createdAt: JsonDate;
  updatedAt: JsonDate;
  campaignId: string;
}

export interface AdSlot {
  id: string;
  name: string;
  description?: string;
  type: AdSlotType;
  position?: string | null;
  width?: number | null;
  height?: number | null;
  basePrice: number;
  cpmFloor?: number | null;
  isAvailable: boolean;
  createdAt: JsonDate;
  updatedAt: JsonDate;
  publisherId: string;
}

export interface Placement {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  agreedPrice: number;
  pricingModel: PricingModel;
  startDate: JsonDate;
  endDate: JsonDate;
  status: PlacementStatus;
  createdAt: JsonDate;
  updatedAt: JsonDate;
  campaignId: string;
  creativeId: string;
  adSlotId: string;
  publisherId: string;
}

export type CampaignListItem = Campaign & {
  sponsor: Pick<SponsorSummary, 'id' | 'name' | 'logo'>;
  _count: {
    creatives: number;
    placements: number;
  };
};

export type CampaignDetail = Campaign & {
  sponsor: Sponsor;
  creatives: Creative[];
  placements: Array<
    Placement & {
      adSlot: AdSlot;
      publisher: Pick<PublisherSummary, 'id' | 'name' | 'category'>;
    }
  >;
};

export type CampaignCreateInput = Pick<Campaign, 'name' | 'budget' | 'sponsorId'> & {
  description?: string;
  cpmRate?: number | null;
  cpcRate?: number | null;
  startDate: Date | string;
  endDate: Date | string;
  targetCategories?: string[];
  targetRegions?: string[];
};

export type CampaignUpdateInput = Partial<
  Pick<
    Campaign,
    | 'name'
    | 'description'
    | 'budget'
    | 'cpmRate'
    | 'cpcRate'
    | 'targetCategories'
    | 'targetRegions'
    | 'status'
  >
> & {
  startDate?: Date | string;
  endDate?: Date | string;
};

export type AdSlotListItem = AdSlot & {
  publisher: Pick<Publisher, 'id' | 'name' | 'category' | 'monthlyViews'>;
  _count: {
    placements: number;
  };
};

export type AdSlotDetail = AdSlot & {
  publisher: Publisher;
  placements: Array<
    Placement & {
      campaign: Pick<Campaign, 'id' | 'name' | 'status'>;
    }
  >;
};

export type AdSlotCreateInput = Pick<AdSlot, 'name' | 'type' | 'basePrice' | 'publisherId'> &
  Partial<
    Pick<AdSlot, 'description' | 'position' | 'width' | 'height' | 'cpmFloor' | 'isAvailable'>
  >;

export type AdSlotUpdateInput = Partial<
  Pick<
    AdSlot,
    | 'name'
    | 'description'
    | 'type'
    | 'position'
    | 'width'
    | 'height'
    | 'basePrice'
    | 'cpmFloor'
    | 'isAvailable'
  >
>;

export type PlacementListItem = Placement & {
  campaign: Pick<Campaign, 'id' | 'name'>;
  creative: Pick<Creative, 'id' | 'name' | 'type'>;
  adSlot: Pick<AdSlot, 'id' | 'name' | 'type'>;
  publisher: Pick<Publisher, 'id' | 'name'>;
};

export type PlacementCreateInput = Pick<
  Placement,
  'campaignId' | 'creativeId' | 'adSlotId' | 'publisherId' | 'agreedPrice'
> & {
  pricingModel?: PricingModel;
  startDate: Date | string;
  endDate: Date | string;
};

export type PlacementCreateResponse = Placement & {
  campaign: Pick<Campaign, 'name'>;
  publisher: Pick<Publisher, 'name'>;
};

export interface AdSlotBookingInput {
  sponsorId: string;
  message?: string;
}

export interface AdSlotBookingResponse {
  success: true;
  message: string;
  adSlot: AdSlot & {
    publisher: Pick<Publisher, 'id' | 'name'>;
  };
}

export interface DashboardStats {
  sponsors: number;
  publishers: number;
  activeCampaigns: number;
  totalPlacements: number;
  metrics: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCtr: string | number;
  };
}
