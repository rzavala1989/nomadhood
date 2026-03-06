import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[--bg-root]">
        <div className="h-8 w-32 bg-[--bg-surface-2] animate-skeleton rounded-lg" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="py-12">
        <h1 className="text-display mb-12">{title}</h1>
        {children}
      </div>
    </div>
  );
}
