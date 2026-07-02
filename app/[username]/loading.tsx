export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="h-48 sm:h-64 bg-border/40 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-16 sm:-mt-24 mb-4">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-sm-bg bg-border/60 animate-pulse" />
        </div>
        <div className="space-y-2 mb-6">
          <div className="h-8 w-56 bg-border/60 rounded animate-pulse" />
          <div className="h-3.5 w-32 bg-border/40 rounded animate-pulse" />
          <div className="h-3.5 w-72 bg-border/40 rounded animate-pulse" />
        </div>
        <div className="grid md:grid-cols-3 gap-6 pb-10">
          <div className="space-y-4">
            <div className="h-40 bg-white border border-border rounded-xl animate-pulse" />
            <div className="h-32 bg-white border border-border rounded-xl animate-pulse" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-56 bg-white border border-border rounded-xl animate-pulse" />
            <div className="h-40 bg-white border border-border rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
