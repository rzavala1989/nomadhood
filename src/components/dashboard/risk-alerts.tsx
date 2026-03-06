import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { useSession } from 'next-auth/react';
import { XIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';

export function RiskAlerts() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const { data: alerts } = trpc.news.getAlerts.useQuery(
    { unreadOnly: false, limit: 5 },
    { enabled: !!session },
  );

  const markRead = trpc.news.markRead.useMutation({
    onSuccess: () => {
      utils.news.getAlerts.invalidate();
      utils.news.getUnreadCount.invalidate();
    },
  });

  if (!session || !alerts || alerts.length === 0) return null;

  return (
    <div>
      <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">RISK ALERTS</p>
      <div className="space-y-0">
        {alerts.map((alert, i) => (
          <div
            key={alert.id}
            className={`flex items-start gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] min-h-[48px] border-t border-[rgba(120,80,200,0.06)] animate-fade-up ${
              alert.isRead ? 'surface-1' : 'bg-[--bg-surface-2]'
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Severity dot */}
            <span
              className={`mt-[6px] h-[8px] w-[8px] shrink-0 ${
                alert.severity === 'high' ? 'bg-[--vapor-pink]' : 'bg-[rgba(120,80,200,0.22)]'
              }`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-caption text-[--text-secondary]">{alert.title}</p>
              {alert.summary && (
                <p className="text-micro text-[--text-ghost] line-clamp-1 mt-[2px]">
                  {alert.summary}
                </p>
              )}
              <Link
                href={`/neighborhoods/${alert.neighborhoodId}`}
                className="text-micro text-[--vapor-purple] hover:text-[--vapor-pink] transition-colors"
              >
                {alert.neighborhood.name}, {alert.neighborhood.city}
              </Link>
            </div>

            {/* Right side: time + dismiss */}
            <div className="flex items-center gap-[var(--space-2)] shrink-0">
              <span className="text-micro text-[--text-ghost] tabular-nums">
                {formatDistanceToNowStrict(new Date(alert.createdAt), { addSuffix: true })}
              </span>
              {!alert.isRead && (
                <button
                  onClick={() => markRead.mutate({ alertIds: [alert.id] })}
                  className="text-[--text-ghost] hover:text-[--text-secondary] transition-colors p-1"
                  title="Mark as read"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
