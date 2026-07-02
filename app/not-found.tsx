import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-sm-bg flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="font-serif text-6xl font-bold text-navy mb-3">404</p>
        <h1 className="text-base font-semibold text-navy mb-1">Page not found</h1>
        <p className="text-sm text-text-dim mb-6">
          This page doesn&apos;t exist — it may have been moved or deleted.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-white bg-navy px-4 py-2 rounded-md hover:bg-navy-mid transition-colors"
          >
            Go to Feed
          </Link>
          <Link
            href="/search"
            className="text-sm font-semibold text-navy border border-border bg-white px-4 py-2 rounded-md hover:border-border2 transition-colors"
          >
            Find Workers
          </Link>
        </div>
      </div>
    </main>
  );
}
