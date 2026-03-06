import { DashboardLayout } from '@/components/dashboard-layout';
import { SectionCards } from '@/components/section-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { TopNeighborhoodsChart } from '@/components/dashboard/top-neighborhoods-chart';
import { ReviewTrendChart } from '@/components/dashboard/review-trend-chart';
import { RiskAlerts } from '@/components/dashboard/risk-alerts';
import { NewsTrending } from '@/components/dashboard/news-trending';

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-col gap-[var(--space-6)] py-[var(--space-6)]">
        {/* Row 0: Risk Alerts (logged-in users only, hidden if empty) */}
        <div className="px-[var(--space-6)] animate-fade-up">
          <RiskAlerts />
        </div>

        {/* Row 1: Stat strip */}
        <SectionCards />

        {/* Row 2: Charts — 60/40 split */}
        <div className="grid grid-cols-1 gap-px px-[var(--space-6)] lg:grid-cols-[3fr_2fr]">
          <div className="surface-1 p-[var(--space-5)] animate-fade-up" style={{ animationDelay: '100ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">
              REVIEW ACTIVITY
            </p>
            <ReviewTrendChart />
          </div>
          <div className="surface-1 p-[var(--space-5)] animate-fade-up" style={{ animationDelay: '160ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">
              TOP NEIGHBORHOODS
            </p>
            <TopNeighborhoodsChart />
          </div>
        </div>

        {/* Row 3: Recent Activity */}
        <div className="px-[var(--space-6)] animate-fade-up" style={{ animationDelay: '220ms' }}>
          <div className="surface-1 p-[var(--space-5)]">
            <div className="flex items-center justify-between mb-[var(--space-3)]">
              <p className="text-label text-[--text-ghost]">
                RECENT ACTIVITY
              </p>
            </div>
            <ActivityFeed />
          </div>
        </div>

        {/* Row 4: News Pulse (trending neighborhoods) */}
        <div className="px-[var(--space-6)] animate-fade-up" style={{ animationDelay: '280ms' }}>
          <NewsTrending />
        </div>
      </div>
    </DashboardLayout>
  );
}
