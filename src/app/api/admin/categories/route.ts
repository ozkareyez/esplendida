import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const body = await req.json();
    const { name, slug, parentId, description, imageUrl, visible } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        description: description || null,
        imageUrl: imageUrl || null,
        visible: typeof visible === "boolean" ? visible : true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear la categoría" }, { status: 500 });
  }
}
