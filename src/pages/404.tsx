import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center gap-[var(--space-4)]">
      <h1 className="text-title">404</h1>
      <p className="text-caption text-[--text-tertiary]">Page not found.</p>
      <Link
        href="/"
        className="text-micro text-[--text-ghost] hover:text-[--text-secondary] transition-colors"
      >
        HOME
      </Link>
    </div>
  );
}
