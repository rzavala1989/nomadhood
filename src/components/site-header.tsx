import { useSession } from 'next-auth/react';
import { BellIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trpc } from '@/utils/trpc';

const menuItems = [
  { label: 'Browse', href: '/neighborhoods' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Favorites', href: '/favorites' },
];

export function SiteHeader({ title }: { title?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: unreadData } = trpc.news.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass h-[80px]">
      <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-6">
        {/* Left: Brand */}
        <Link href="/" className="font-brand text-lg text-[--text-primary] tracking-wide">
          NOMADHOOD
        </Link>

        {/* Center: Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-label tracking-[0.2em] transition-colors ${
                router.pathname.startsWith(item.href)
                  ? 'text-[--text-primary]'
                  : 'text-[--text-tertiary] hover:text-[--text-primary]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: CTA + Alert */}
        <div className="flex items-center gap-4">
          {session && unreadCount > 0 && (
            <Link
              href="/dashboard"
              className="relative text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
              title={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-1 bg-[--accent-rose] text-[--accent-charcoal] text-[9px] font-bold leading-[18px] text-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </Link>
          )}
          {session ? (
            <Link href="/dashboard" className="btn-pill">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/signin" className="btn-pill">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
