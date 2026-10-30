import { NextResponse } from "next/server";
import { requireStaffUser } from "@/backend/admin-api.server";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const apiKey = process.env.IMGBB_API_KEY || process.env.IMG_BB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta configurar IMGBB_API_KEY en el servidor." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Debes seleccionar una imagen." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG, WEBP o GIF." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen no puede superar 8 MB." }, { status: 400 });
  }

  const uploadForm = new FormData();
  uploadForm.append("image", file, file.name);
  uploadForm.append("name", file.name.replace(/\.[^.]+$/, "") || "product");

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    body: uploadForm,
  });
  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    return NextResponse.json(
      { error: payload?.error?.message || "No se pudo subir la imagen." },
      { status: 502 },
    );
  }

  const url = payload.data?.display_url || payload.data?.url;
  if (!url) {
    return NextResponse.json({ error: "ImgBB no devolvio una URL valida." }, { status: 502 });
  }

  return NextResponse.json({ url });
}
