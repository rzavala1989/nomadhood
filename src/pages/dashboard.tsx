import { DashboardLayout } from '@/components/dashboard-layout';
import { SectionCards } from '@/components/section-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { TopNeighborhoodsChart } from '@/components/dashboard/top-neighborhoods-chart';
import { ReviewTrendChart } from '@/components/dashboard/review-trend-chart';
import { RiskAlerts } from '@/components/dashboard/risk-alerts';
import { NewsTrending } from '@/components/dashboard/news-trending';
import { useReveal } from '@/hooks/useReveal';
import { ReactNode } from 'react';

function RevealSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, isVisible } = useReveal();
  return (
    <div
      ref={ref}
      className={isVisible ? 'animate-reveal' : 'opacity-0'}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-12">
        <RevealSection>
          <RiskAlerts />
        </RevealSection>

        <SectionCards />

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          <RevealSection delay={100}>
            <div className="surface-flat rounded-lg p-8">
              <p className="text-label text-[--text-ghost] mb-6">Review Activity</p>
              <ReviewTrendChart />
            </div>
          </RevealSection>
          <RevealSection delay={200}>
            <div className="surface-flat rounded-lg p-8">
              <p className="text-label text-[--text-ghost] mb-6">Top Neighborhoods</p>
              <TopNeighborhoodsChart />
            </div>
          </RevealSection>
        </div>

        <RevealSection delay={300}>
          <div className="surface-flat rounded-lg p-8">
            <p className="text-label text-[--text-ghost] mb-6">Recent Activity</p>
            <ActivityFeed />
          </div>
        </RevealSection>

        <RevealSection delay={400}>
          <NewsTrending />
        </RevealSection>
      </div>
    </DashboardLayout>
  );
}
