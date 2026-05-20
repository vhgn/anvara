import { getCampaigns } from '@/lib/api';
import { CampaignCard } from './campaign-card';
import { logger } from '@/lib/utils';

export async function CampaignList(props: { sponsorId: string }) {
  // TODO: Add refetch on tab focus for better UX
  // TODO: Add optimistic updates when creating/editing campaigns
  let campaigns;

  try {
    campaigns = await getCampaigns(props.sponsorId);
  } catch (e) {
    logger.error(e);
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
        Failed to load campaigns
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
        No campaigns yet. Create your first campaign to get started.
      </div>
    );
  }

  // TODO: Add sorting options (by date, budget, status)
  // TODO: Add pagination if campaigns list gets large
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
