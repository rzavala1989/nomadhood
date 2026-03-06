'use client';

import { GithubIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Link from 'next/link';

type CredentialFields = {
  email: string;
  password: string;
};

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CredentialFields>();

  async function onSubmit(data: CredentialFields) {
    setError(null);
    setLoading(true);
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      callbackUrl: '/dashboard',
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password');
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="w-full max-w-md space-y-[var(--space-5)]">
      <div className="space-y-[var(--space-3)]">
        <Button
          className="w-full"
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
        >
          <GithubIcon className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>
      </div>

      <div className="flex items-center gap-[var(--space-4)]">
        <div className="flex-1" style={{ boxShadow: 'inset 0 -1px 0 var(--border-subtle)' }} />
        <span className="text-label uppercase tracking-widest text-[--text-label]">or</span>
        <div className="flex-1" style={{ boxShadow: 'inset 0 -1px 0 var(--border-subtle)' }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--space-3)]">
        <div className="space-y-[var(--space-2)]">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="w-full bg-[--bg-secondary] rounded-lg px-[var(--space-4)] py-[var(--space-3)] text-body text-[--text-primary] placeholder:text-[--text-ghost] outline-none"
            style={{ boxShadow: 'inset 0 0 0 1px var(--border-default)' }}
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && (
            <p className="text-caption text-[--text-secondary]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-[var(--space-2)]">
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-[--bg-secondary] rounded-lg px-[var(--space-4)] py-[var(--space-3)] text-body text-[--text-primary] placeholder:text-[--text-ghost] outline-none"
            style={{ boxShadow: 'inset 0 0 0 1px var(--border-default)' }}
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && (
            <p className="text-caption text-[--text-secondary]">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-caption text-[--text-secondary]">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-caption text-[--text-tertiary]">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-[--text-secondary] underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}
