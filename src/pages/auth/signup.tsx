import { SignUpForm } from '@/components/auth/SignUpForm.tsx';

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--space-6)]">
      <div className="w-full max-w-md space-y-[var(--space-8)]">
        <h1 className="text-center text-title">Sign Up</h1>
        <SignUpForm />
      </div>
    </div>
  );
}
