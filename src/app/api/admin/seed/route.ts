import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import { cloudinary, IMG } from "@/lib/cdn";

export async function POST() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const brands = [
      { name: "Purpure", slug: "purpure", logoUrl: cloudinary(IMG.brands.purpure) },
      { name: "Milagros", slug: "milagros", logoUrl: cloudinary(IMG.brands.milagros) },
      { name: "Poción", slug: "pocion", logoUrl: cloudinary(IMG.brands.pocion) },
      { name: "Menta Hair", slug: "menta-hair", logoUrl: cloudinary(IMG.brands.menta) },
      { name: "Ritual Botánico", slug: "ritual-botanico", logoUrl: cloudinary(IMG.brands.ritual) },
      { name: "Click Hair", slug: "click-hair", logoUrl: cloudinary(IMG.brands.click) },
    ];
    const categories = [
      {
        name: "Maquillaje",
        slug: "maquillaje",
        description: "Labiales, sombras, bases y más",
        imageUrl: cloudinary(IMG.landing.makeup),
        visible: true,
      },
      {
        name: "Skincare",
        slug: "skincare",
        description: "Cuidado facial y rutinas",
        imageUrl: cloudinary(IMG.landing.skincare),
        visible: true,
      },
      {
        name: "Cuidado Capilar",
        slug: "capilar",
        description: "Shampoos, tratamientos y estilos",
        imageUrl: cloudinary(IMG.landing.hair),
        visible: true,
      },
    ];

    for (const b of brands) {
      await prisma.brand.upsert({ where: { slug: b.slug }, update: b, create: b });
    }
    for (const c of categories) {
      await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al sembrar datos" }, { status: 500 });
  }
}
