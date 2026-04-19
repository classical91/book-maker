import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="paper-panel rounded-[36px] p-6 sm:p-10">
        <SignUp />
      </div>
    </main>
  );
}
