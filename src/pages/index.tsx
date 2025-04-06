import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import Link from 'next/link';

const IndexPage: NextPageWithLayout = () => {
  const { data: me, isLoading } = trpc.user.me.useQuery();

  if (isLoading) return <p className="text-white">Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold">🏡 Welcome to Nomadhood</h1>
        <p className="text-gray-400">
          A fullstack playground for exploring, favoriting, and reviewing neighborhoods.
        </p>

        {me ? (
          <>
            <p className="text-lg text-white">
              Hello, <span className="font-semibold">{me.name || me.email}</span>
            </p>
            <Link
              href="/profile"
              className="inline-block px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              Go to Profile
            </Link>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              Go to Dashboard →
            </Link>
          </>
        ) : (
          <>
            <p className="text-lg text-white">
              You’re not signed in yet.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signin"
                className="inline-block px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-block px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                Create an Account
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default IndexPage;
