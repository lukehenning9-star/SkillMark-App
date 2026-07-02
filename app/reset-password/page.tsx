import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-sm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-navy">
            Skill<span className="text-accent">Mark</span>
          </Link>
          <p className="mt-2 text-text-mid text-sm">Choose a new password</p>
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm p-8 text-center">
            <p className="text-sm text-text-mid leading-relaxed mb-4">
              This reset link has expired or was already used.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block text-sm font-semibold text-white bg-accent px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Request a New Link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
