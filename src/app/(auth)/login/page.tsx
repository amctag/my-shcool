import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <GuestOnly>
      <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-primary">My School</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            School admin sign in
          </h1>
          <p className="mt-2 text-sm text-muted">
            Use the school email and password from the school record. Parents,
            students, and teachers cannot sign in here.
          </p>
          <LoginForm />
        </div>
      </main>
    </GuestOnly>
  );
}
