export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-[470px] mx-auto px-4 py-6">
        <div className="h-6 w-32 bg-border/60 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-border/60 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-border/60 rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-border/40 rounded animate-pulse" />
                </div>
              </div>
              <div className="px-4 pb-3 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-border/60 rounded animate-pulse" />
                <div className="h-3 w-full bg-border/40 rounded animate-pulse" />
              </div>
              <div className="aspect-video bg-border/40 animate-pulse" />
              <div className="px-4 py-3 flex gap-1.5">
                <div className="h-5 w-16 bg-border/40 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-border/40 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
