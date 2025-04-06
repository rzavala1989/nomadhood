import * as React from 'react';
import { SignInForm } from '@/components/auth/SignInForm';
import Link from 'next/link';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-white">Sign In</h1>

        <p className="text-center text-gray-400">
          Welcome back. Enter your credentials to continue.
        </p>

        <SignInForm />

        <p className="text-center text-gray-400">
          Don’t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-blue-500 hover:text-blue-400 font-medium"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
