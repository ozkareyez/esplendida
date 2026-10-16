import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-guard";
import { cloudinary, IMG } from "@/lib/cdn";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Iniciar sesión",
};

interface Props {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectTo, error } = await searchParams;
  const session = await getSession();

  if (session?.user.role === "ADMIN") {
    redirect(redirectTo || "/admin/productos");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src={cloudinary(IMG.logo)}
            alt="Espléndida Makeup"
            width={160}
            height={54}
            priority
            className="h-auto w-auto"
          />
          <div className="text-center">
            <h1 className="text-h2">Panel de administración</h1>
            <p className="text-body-sm mt-1 text-muted-foreground">
              Ingresa con tu cuenta de administrador
            </p>
          </div>
        </div>

        <div className="card-elevated p-6">
          {error === "forbidden" && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Tu cuenta no tiene permisos de administrador.
            </div>
          )}
          <LoginForm redirectTo={redirectTo || "/admin/productos"} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acceso restringido. El registro público está deshabilitado.
        </p>
      </div>
    </div>
  );
}
