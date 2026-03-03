import * as React from 'react';
import { SignInForm } from '@/components/auth/SignInForm';
import Link from 'next/link';

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--space-6)]">
      <div className="w-full max-w-md space-y-[var(--space-8)]">
        <div className="text-center space-y-[var(--space-2)]">
          <h1 className="text-title">Sign In</h1>
          <p className="text-body text-[--text-secondary]">
            Welcome back. Enter your credentials to continue.
          </p>
        </div>

        <SignInForm />

        <p className="text-center text-caption text-[--text-tertiary]">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-[--text-primary] hover:text-[--text-secondary] transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
