import { AdminPageMeta } from "@/components/admin/AdminPageContext";
import StoreCmsStudio from "@/components/admin/store/StoreCmsStudio";

export default function AdminStorePage() {
  return (
    <>
      <AdminPageMeta
        title="Tienda online"
        subtitle="Edita textos y portada. Pulsa Guardar cuando termines."
      />
      <StoreCmsStudio />
    </>
  );
}
