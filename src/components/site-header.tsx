import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader({ title = 'Dashboard' }: { title?: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2" style={{ boxShadow: 'inset 0 -1px 0 var(--border-default)' }}>
      <div className="flex w-full items-center gap-[var(--space-3)] px-[var(--space-6)]">
        <SidebarTrigger className="-ml-1 text-[--text-ghost] hover:text-[--text-secondary]" />
        <div className="h-4 w-px" style={{ background: 'var(--border-default)' }} />
        <h1 className="text-label text-[--text-label]">{title}</h1>
      </div>
    </header>
  );
}
