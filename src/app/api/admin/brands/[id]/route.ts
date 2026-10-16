import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guard";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    const body = await req.json();
    const { name, slug, logoUrl, description } = body;

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        description: description === undefined ? undefined : description?.trim() || null,
        logoUrl: logoUrl === "" ? null : logoUrl || undefined,
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error("PUT /api/admin/brands/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "No se pudo actualizar la marca" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/brands/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "No se puede eliminar: hay productos asociados" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo eliminar la marca" }, { status: 500 });
  }
}
