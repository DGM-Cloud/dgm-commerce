import { AdminPageMeta } from "@/components/admin/AdminPageContext";
import BannerEditor from "@/components/admin/store/BannerEditor";

export default async function AdminBannerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <AdminPageMeta
        title="Editar banner"
        subtitle="Cambia textos, foto y color. Guarda para publicarlo en la portada."
      />
      <BannerEditor bannerId={id} />
    </>
  );
}
