import { DashboardLayout } from '@/components/dashboard-layout';
import { SectionCards } from '@/components/section-cards';
import { RecentNeighborhoods } from '@/components/recent-neighborhoods';

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-col gap-[var(--space-10)] py-[var(--space-6)]">
        <SectionCards />
        <div className="px-[var(--space-6)]">
          <RecentNeighborhoods />
        </div>
      </div>
    </DashboardLayout>
  );
}
