import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="text-center py-[var(--space-16)]">
      <h1 className="text-title mb-[var(--space-4)]">
        Welcome to <em className="font-brand not-italic">Nomadhood</em>
      </h1>
      <p className="text-body text-[--text-secondary] mb-[var(--space-8)]">
        Explore, review, and save neighborhoods worldwide.
      </p>
      <Button asChild>
        <a href="/auth/signin">Get Started</a>
      </Button>
    </section>
  );
}
