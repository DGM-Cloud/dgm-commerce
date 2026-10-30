export default function AdminModuleSkeleton({
  cards = 4,
  rows = true,
}: {
  cards?: number;
  rows?: boolean;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando datos">
      {cards > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: cards }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white/70" />
          ))}
        </div>
      ) : null}
      {rows ? <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-white/70" /> : null}
    </div>
  );
}
