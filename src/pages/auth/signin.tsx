import { SignInForm } from '@/components/auth/SignInForm';

export default function SignIn() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-display mb-4">Sign In</h1>
        <p className="text-body text-[--text-secondary] mb-12">
          Sign in with GitHub to continue.
        </p>
        <div className="surface-flat rounded-lg p-8">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
