import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="text-center py-20">
      <h1 className="text-5xl font-bold mb-6">
        Welcome to the Future of Fullstack
      </h1>
      <p className="text-gray-400 mb-8">
        Built with tRPC, Prisma, Next.js, Shadcn UI, and Bun.
      </p>
      <Button asChild>
        <a href="/auth/signin">Get Started</a>
      </Button>
    </section>
  );
}
