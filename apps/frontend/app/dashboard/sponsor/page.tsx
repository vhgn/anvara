import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth-helpers';
import { CampaignList } from './components/campaign-list';
import { Suspense } from 'react';
import { getServerSession } from '@/lib/api';

export default async function SponsorDashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'sponsor' role
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'sponsor' || !roleData.sponsorId) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        {/* TODO: Add CreateCampaignButton here */}
      </div>

      <Suspense
        fallback={<div className="py-8 text-center text-[--color-muted]">Loading campaigns...</div>}
      >
        <CampaignList sponsorId={roleData.sponsorId} />
      </Suspense>
    </div>
  );
}
