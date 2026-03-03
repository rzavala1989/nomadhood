import { SignInForm } from '@/components/auth/SignInForm';

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--space-6)]">
      <div className="w-full max-w-md space-y-[var(--space-8)]">
        <div className="text-center space-y-[var(--space-2)]">
          <h1 className="text-title">Sign In</h1>
          <p className="text-body text-[--text-secondary]">
            New here? Your account is created automatically on first sign in.
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}
