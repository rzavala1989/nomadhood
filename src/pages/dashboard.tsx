import { DashboardLayout } from '@/components/dashboard-layout';
import { SectionCards } from '@/components/section-cards';
import { RecentNeighborhoods } from '@/components/recent-neighborhoods';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { TopNeighborhoodsChart } from '@/components/dashboard/top-neighborhoods-chart';
import { ReviewTrendChart } from '@/components/dashboard/review-trend-chart';

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-col gap-[var(--space-8)] py-[var(--space-6)]">
        <SectionCards />

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-px px-[var(--space-6)] lg:grid-cols-2">
          <div className="surface-1 p-[var(--space-5)] animate-fade-up" style={{ animationDelay: '200ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">
              REVIEW TREND
            </p>
            <ReviewTrendChart />
          </div>
          <div className="surface-1 p-[var(--space-5)] animate-fade-up" style={{ animationDelay: '260ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">
              TOP NEIGHBORHOODS
            </p>
            <TopNeighborhoodsChart />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="px-[var(--space-6)] animate-fade-up" style={{ animationDelay: '320ms' }}>
          <div className="surface-1 p-[var(--space-5)]">
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">
              RECENT ACTIVITY
            </p>
            <ActivityFeed />
          </div>
        </div>

        {/* Recent Neighborhoods */}
        <div className="px-[var(--space-6)]">
          <RecentNeighborhoods />
        </div>
      </div>
    </DashboardLayout>
  );
}
