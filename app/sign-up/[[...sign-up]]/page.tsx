import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { CLERK_SETUP_MESSAGE, hasClerkConfig } from "@/lib/runtime-config";

export const metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  if (!hasClerkConfig()) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <div className="paper-panel max-w-xl rounded-[36px] p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Sign up unavailable
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-[var(--foreground)]">
            Clerk keys still need to be configured for this deployment.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            {CLERK_SETUP_MESSAGE}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="paper-panel rounded-[36px] p-6 sm:p-10">
        <SignUp />
      </div>
    </main>
  );
}
