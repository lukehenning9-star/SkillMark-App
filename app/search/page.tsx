import AppNav from "@/components/AppNav";
import SearchClient from "./SearchClient";

// Public: guests can search and view profiles without an account.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string }>;
}) {
  const { trade } = await searchParams;
  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <SearchClient initialTrade={typeof trade === "string" ? trade : ""} />
      </main>
    </>
  );
}
