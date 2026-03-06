import { useSession } from 'next-auth/react';
import { BellIcon } from 'lucide-react';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { trpc } from '@/utils/trpc';

export function SiteHeader({ title = 'Dashboard' }: { title?: string }) {
  const { data: session } = useSession();
  const { data: unreadData } = trpc.news.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2" style={{ boxShadow: 'inset 0 -1px 0 var(--border-default)' }}>
      <div className="flex w-full items-center gap-[var(--space-3)] px-[var(--space-6)]">
        <SidebarTrigger className="-ml-1 text-[--text-ghost] hover:text-[--text-secondary]" />
        <div className="h-4 w-px" style={{ background: 'var(--border-default)' }} />
        <h1 className="text-label text-[--text-label]">{title}</h1>

        {session && unreadCount > 0 && (
          <Link
            href="/dashboard"
            className="ml-auto relative text-[--text-ghost] hover:text-[--text-secondary] transition-colors"
            title={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
          >
            <BellIcon className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-[14px] min-w-[14px] px-[3px] bg-[--vapor-pink] text-white text-[8px] leading-[14px] text-center tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
