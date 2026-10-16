import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(brands);
  } catch (error) {
    console.error("GET /api/admin/brands error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();
    const { name, slug, logoUrl, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/brands error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear la marca" }, { status: 500 });
  }
}
