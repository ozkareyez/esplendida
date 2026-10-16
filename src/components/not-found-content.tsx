import Link from "next/link";

export function NotFoundContent() {
  return (
    <section className="container mx-auto flex flex-col items-center px-4 py-24 text-center lg:py-36">
      <p className="text-display text-primary/80">404</p>
      <h1 className="text-h2 mt-4">Página no encontrada</h1>
      <p className="text-body mt-3 max-w-md text-muted-foreground">
        La página que buscas no existe o cambió de dirección. Sigue explorando el catálogo o
        vuelve al inicio.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
        <Link href="/tienda" className="btn-secondary">
          Ver la tienda
        </Link>
      </div>
    </section>
  );
}
