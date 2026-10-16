import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function isAdmin() {
  const session = await getSession();
  return session?.user.role === "ADMIN";
}

/**
 * Guard para Route Handlers. Devuelve una respuesta 401/403 si la petición
 * no proviene de un usuario ADMIN autenticado, o null si está autorizada.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  return null;
}
