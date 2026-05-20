import { redirect } from 'next/navigation';
import { AdSlotList } from './components/ad-slot-list';
import { getServerSession, getUserRole } from '@/lib/api';

export default async function PublisherDashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'publisher' role
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'publisher') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Ad Slots</h1>
        {/* TODO: Add CreateAdSlotButton here */}
      </div>

      <AdSlotList publisherId={roleData.publisherId} />
    </div>
  );
}
