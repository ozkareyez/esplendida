"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MapPin,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useMounted } from "@/hooks/use-mounted";
import { WHATSAPP_NUMBER } from "@/lib/negocio";

const FREE_SHIPPING_THRESHOLD = 150_000;

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCart();
  const mounted = useMounted();
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    ciudad: "",
    entrega: "domicilio",
  });

  const total = getTotal();
  const itemCount = getItemCount();
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  const handleSendWhatsApp = async () => {
    if (items.length === 0) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.nombre,
          phone: formData.telefono,
          city: formData.ciudad,
          entrega: formData.entrega,
          items: items.map((item) =>
            item.variantId
              ? { variantId: item.variantId, quantity: item.quantity }
              : { productId: item.id, quantity: item.quantity }
          ),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el pedido");
      }

      const lines = items.map(
        (item, i) =>
          `${i + 1}. ${item.name} — ${item.brand} — $${item.price.toLocaleString("es-CO")} x ${item.quantity}`
      );

      const mensaje = `Hola Espléndida, quiero hacer este pedido (pedido #${data.numero}):

${lines.join("\n")}

Total: $${total.toLocaleString("es-CO")}

Nombre: ${formData.nombre}
Teléfono: ${formData.telefono}
Dirección / ciudad: ${formData.ciudad}
Método de entrega: ${formData.entrega === "domicilio" ? "Domicilio" : "Recoger en tienda"}`;

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`,
        "_blank",
        "noopener,noreferrer"
      );

      clearCart();
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el pedido");
    } finally {
      setSending(false);
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-20 text-center lg:px-6">
        <p className="text-body text-muted-foreground">Cargando carrito…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto max-w-md text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-h1 mb-3">Tu carrito está vacío</h1>
          <p className="text-body mb-8 text-muted-foreground">
            Aún no has agregado productos. Explora la tienda y descubre algo
            hermoso.
          </p>
          <Link href="/tienda" className="inline-block">
            <Button className="h-12 w-full px-8 sm:w-auto">Ir a la tienda</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 lg:px-6 lg:py-14">
      <div className="mb-8 animate-fade-in lg:mb-10">
        <nav className="mb-4 text-body-sm text-muted-foreground" aria-label="Migas de pan">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-primary">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true" className="text-primary">
              /
            </li>
            <li className="font-medium text-foreground">Carrito</li>
          </ol>
        </nav>
        <h1 className="text-h1">Carrito de compras</h1>
        <p className="text-body mt-2 text-muted-foreground">
          Revisa tu pedido antes de enviarlo por WhatsApp
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Artículos */}
        <ul className="space-y-4 lg:col-span-2 animate-fade-in stagger-1">
          {items.map((item) => (
            <li key={item.id}>
              <article className="card-elevated p-0">
                <div className="flex flex-col gap-0 sm:flex-row sm:gap-4">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted sm:h-28 sm:w-28 sm:aspect-auto"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="112px"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-8 w-8" aria-hidden="true" />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="clamp-2 text-body font-semibold">
                          <Link
                            href={`/producto/${item.slug}`}
                            className="transition-colors duration-200 hover:text-primary"
                          >
                            {item.name}
                          </Link>
                        </h2>
                        <p className="text-body-sm mt-1 text-muted-foreground">
                          {item.brand}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar ${item.name} del carrito`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                      <div className="flex items-center overflow-hidden rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors duration-150 hover:bg-muted"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="w-10 text-center text-body font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors duration-150 hover:bg-muted"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-price text-primary">
                          ${(item.price * item.quantity).toLocaleString("es-CO")}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-body-sm text-muted-foreground">
                            ${item.price.toLocaleString("es-CO")} c/u
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {/* Resumen */}
        <div className="animate-fade-in stagger-2">
          <div className="card-elevated p-5 lg:sticky lg:top-24 lg:p-6">
            <h2 className="text-h3 mb-5">Resumen del pedido</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-body">
                <span className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})
                </span>
                <span className="font-semibold">${total.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex items-center justify-between text-body">
                <span className="text-muted-foreground">Envío</span>
                <span className={cn("font-semibold", missingForFreeShipping === 0 && "text-success")}>
                  {missingForFreeShipping === 0 ? "Gratis" : "Se coordina"}
                </span>
              </div>

              {missingForFreeShipping > 0 && (
                <div className="rounded-lg bg-primary-lighter/40 p-3">
                  <p className="text-body-sm text-primary-dark">
                    Te faltan{" "}
                    <strong className="font-bold">
                      ${missingForFreeShipping.toLocaleString("es-CO")}
                    </strong>{" "}
                    para envío gratis
                  </p>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70"
                    role="progressbar"
                    aria-valuenow={Math.round((total / FREE_SHIPPING_THRESHOLD) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progreso para envío gratis"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{
                        width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
              <span className="text-body font-semibold">Total</span>
              <span className="text-price-lg text-primary">
                ${total.toLocaleString("es-CO")}
              </span>
            </div>

            {!showForm ? (
              <Button
                onClick={() => {
                  setError(null);
                  setShowForm(true);
                }}
                className="mt-6 h-12 w-full gap-2 bg-[#25D366] text-base font-semibold text-white shadow-[0_4px_20px_-4px_rgba(37,211,102,0.4)] hover:bg-[#20c558]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Enviar pedido por WhatsApp
              </Button>
            ) : (
              <div className="mt-6 space-y-4 animate-slide-up">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-body-sm font-semibold">
                    Nombre completo
                  </label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="telefono" className="block text-body-sm font-semibold">
                    Teléfono
                  </label>
                  <Input
                    id="telefono"
                    type="tel"
                    inputMode="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="300 000 0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ciudad" className="block text-body-sm font-semibold">
                    Ciudad / Dirección
                  </label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Ciudad y dirección de entrega"
                    required
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-body-sm font-semibold">
                    Método de entrega
                  </legend>
                  {[
                    { value: "domicilio", label: "Domicilio", icon: Truck },
                    { value: "tienda", label: "Recoger en tienda", icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => {
                    const active = formData.entrega === value;
                    return (
                      <label
                        key={value}
                        className={cn(
                          "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all duration-200",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="entrega"
                          value={value}
                          checked={active}
                          onChange={(e) => setFormData({ ...formData, entrega: e.target.value })}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="flex items-center gap-2 text-body font-medium">
                          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>

                {error && (
                  <p className="text-body-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSendWhatsApp}
                    disabled={
                      sending || !formData.nombre || !formData.telefono || !formData.ciudad
                    }
                    className="h-12 flex-1 gap-2 bg-[#25D366] text-base font-semibold text-white hover:bg-[#20c558]"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    {sending ? "Registrando pedido…" : "Enviar"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="h-12 px-3"
                    aria-label="Cancelar"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {!showForm && (
              <p className="text-body-sm mt-4 text-center text-muted-foreground">
                Se abrirá WhatsApp con tu pedido listo para enviar.
              </p>
            )}
          </div>

          <ul className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-5 text-center">
            {[
              { icon: Truck, label: "Envío rápido", tone: "text-primary bg-primary/10" },
              { icon: ShieldCheck, label: "Pago seguro", tone: "text-accent bg-accent/10" },
              {
                icon: MessageCircle,
                label: "Soporte",
                tone: "text-[#25D366] bg-[#25D366]/10",
              },
            ].map(({ icon: Icon, label, tone }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full",
                    tone
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-body-sm text-muted-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 text-center animate-fade-in stagger-3">
        <Link href="/tienda" className="inline-block">
          <Button variant="outline" className="h-12 px-6">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            Seguir comprando
          </Button>
        </Link>
      </div>
    </div>
  );
}
