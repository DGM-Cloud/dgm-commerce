export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando módulo">
      <div className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white/70" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-white/70" />
    </div>
  );
}
