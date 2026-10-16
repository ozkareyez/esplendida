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
    const { name, slug, parentId, description, imageUrl, visible } = body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        parentId: parentId === "" ? null : parentId || undefined,
        description: description === undefined ? undefined : description || null,
        imageUrl: imageUrl === undefined ? undefined : imageUrl || null,
        visible: typeof visible === "boolean" ? visible : undefined,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("PUT /api/admin/categories/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "No se pudo actualizar la categoría" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "No se puede eliminar: hay productos o subcategorías asociadas" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo eliminar la categoría" }, { status: 500 });
  }
}
