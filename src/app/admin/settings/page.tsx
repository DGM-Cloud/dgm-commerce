import { AdminPageMeta } from "@/components/admin/AdminPageContext";
import StoreSettingsStudio from "@/components/admin/settings/StoreSettingsStudio";

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageMeta
        title="Configuración"
        subtitle="Datos legales, dominio, moneda y zona horaria."
      />
      <StoreSettingsStudio />
    </>
  );
}
