import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import SearchClient from "./SearchClient";

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <SearchClient />
      </main>
    </>
  );
}
