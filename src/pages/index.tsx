import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import Link from 'next/link';

const IndexPage: NextPageWithLayout = () => {
  const { data: me, isLoading } = trpc.user.me.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-32 bg-[--bg-surface-2] animate-skeleton" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-[var(--space-6)]">
      <div className="w-full max-w-md space-y-[var(--space-8)] text-center">
        <h1 className="text-title">
          Nomad<em>hood</em>
        </h1>
        <p className="text-body text-[--text-secondary]">
          Explore, review, and save neighborhoods worldwide.
        </p>

        {me ? (
          <div className="space-y-[var(--space-4)]">
            <p className="text-caption text-[--text-secondary]">
              Hello, <span className="text-[--text-primary]">{me.name || me.email}</span>
            </p>
            <div className="flex flex-col items-center gap-px sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="bg-[--bg-inverse] text-[--text-inverse] px-[var(--space-4)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] transition-all hover:bg-[#1A1A18]/90"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="surface-1 px-[var(--space-4)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-all hover:bg-[--bg-surface-2] hover:text-[--text-secondary]"
              >
                Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-[var(--space-4)]">
            <p className="text-caption text-[--text-tertiary]">
              Sign in to get started.
            </p>
            <div className="flex flex-col items-center gap-px sm:flex-row sm:justify-center">
              <Link
                href="/auth/signin"
                className="bg-[--bg-inverse] text-[--text-inverse] px-[var(--space-4)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] transition-all hover:bg-[#1A1A18]/90"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="surface-1 px-[var(--space-4)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-all hover:bg-[--bg-surface-2] hover:text-[--text-secondary]"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default IndexPage;
