import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="paper-panel rounded-[36px] p-6 sm:p-10">
        <SignIn />
      </div>
    </main>
  );
}
