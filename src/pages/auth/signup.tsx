import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--space-6)]">
      <div className="w-full max-w-md space-y-[var(--space-8)]">
        <div className="text-center space-y-[var(--space-2)]">
          <h1 className="text-title">Create Account</h1>
          <p className="text-body text-[--text-secondary]">
            Sign up with GitHub, Google, or email.
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
