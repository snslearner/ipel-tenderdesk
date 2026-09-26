import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getOptionalSessionUser, type SessionUser } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Sign in · IPEL TenderDesk" };

// Always the sign-in page, even when signed in, so demo users can switch accounts.
export default async function SignInPage() {
  let current: SessionUser | null = null;
  try {
    current = await getOptionalSessionUser();
  } catch {
    // Profile or role lookup failed: still show the sign-in form, just without the banner.
  }

  return (
    <div className="flex flex-1 flex-col">
      {current && (
        <div
          data-testid="signed-in-banner"
          className="border-b bg-muted px-4 py-2 text-center text-sm"
        >
          Signed in as {current.fullName} ({roleLabel(current.role)}) –{" "}
          <Link href="/dashboard" className="font-medium underline underline-offset-4">
            Continue
          </Link>
        </div>
      )}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">IPEL TenderDesk</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
