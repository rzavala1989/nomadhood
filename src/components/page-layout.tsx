import { ReactNode } from 'react';

/**
 * Layout wrapper for public pages (no auth required).
 * Same visual structure as DashboardLayout but without session guard.
 */
export function PageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="py-12">
        <h1 className="text-display mb-12">{title}</h1>
        {children}
      </div>
    </div>
  );
}
