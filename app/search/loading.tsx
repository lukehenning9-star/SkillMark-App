export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-7 w-52 bg-border/60 rounded animate-pulse mb-2" />
        <div className="h-3.5 w-80 bg-border/40 rounded animate-pulse mb-6" />
        <div className="h-28 bg-white border border-border rounded-xl animate-pulse mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 bg-white border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
