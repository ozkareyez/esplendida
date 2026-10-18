import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "";
const FOLDER = "esplendor/products";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    if (!CLOUD_NAME) {
      return NextResponse.json(
        { error: "Falta configurar NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG, WEBP, GIF o AVIF" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 });

    if (!UPLOAD_PRESET) {
      return NextResponse.json(
        { error: "Falta configurar CLOUDINARY_UPLOAD_PRESET" },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();

    const uploadForm = new FormData();
    uploadForm.append("file", new Blob([bytes], { type: file.type }), file.name || "image");
    uploadForm.append("upload_preset", UPLOAD_PRESET);
    uploadForm.append("folder", FOLDER);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Cloudinary error:", JSON.stringify(body));
      return NextResponse.json(
        { error: body?.error?.message || "Error al subir a Cloudinary" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: body.secure_url });
  } catch (error) {
    console.error("Upload Cloudinary error:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}
