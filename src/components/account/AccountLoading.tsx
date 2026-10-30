export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-zinc-200" />
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-zinc-100" />
                <div className="h-5 w-40 rounded bg-zinc-200" />
              </div>
            </div>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
            <div className="h-36 rounded-2xl bg-zinc-100" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-28 rounded-2xl bg-zinc-100" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-80 rounded-2xl bg-zinc-100 lg:col-span-2" />
              <div className="h-80 rounded-2xl bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
