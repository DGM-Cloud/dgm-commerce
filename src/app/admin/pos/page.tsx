import { AdminPageMeta } from "@/components/admin/AdminPageContext";

const cartItems = [
  { sku: "POL-CR7-BLA-S", name: "Cristiano v1", qty: 1, unitPrice: 35 },
  { sku: "POL-MES-BLA-M", name: "Messi v3", qty: 2, unitPrice: 35 },
];

export default function AdminPOSPage() {
  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);

  return (
    <>
      <AdminPageMeta
        title="Punto de ventas"
        subtitle="Caja rapida para ventas presenciales con control de efectivo y stock."
      />
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Carrito de caja</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Producto</th>
                  <th className="py-2">Cant.</th>
                  <th className="py-2">Unit.</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.sku} className="border-t border-zinc-100">
                    <td className="py-2 font-mono text-xs">{item.sku}</td>
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.qty}</td>
                    <td className="py-2">S/ {item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 font-semibold">S/ {(item.qty * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Cobro</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>Descuento</span><span>S/ 0.00</span></div>
            <div className="flex items-center justify-between"><span>IGV</span><span>Incluido</span></div>
            <div className="mt-2 border-t border-zinc-200 pt-2 text-base font-bold flex items-center justify-between"><span>Total</span><span>S/ {subtotal.toFixed(2)}</span></div>
          </div>
          <div className="mt-4 grid gap-2">
            <button className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white">Cobrar en efectivo</button>
            <button className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white">Cobrar con tarjeta</button>
            <button className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold">Guardar como pendiente</button>
          </div>
        </article>
      </section>
    </>
  );
}
