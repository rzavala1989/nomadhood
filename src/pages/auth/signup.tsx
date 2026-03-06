import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUp() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-display mb-4">Create Account</h1>
        <p className="text-body text-[--text-secondary] mb-12">
          Sign up with GitHub to get started.
        </p>
        <div className="surface-flat rounded-lg p-8">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
