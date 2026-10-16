"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cloudinary, IMG } from "@/lib/cdn";

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  variants: { id: string; sku: string; name: string; price: number; stock: number }[];
}

interface Props {
  initialProduct: ProductDetail;
}

const BENEFITS = [
  { icon: Truck, label: "Envío rápido" },
  { icon: ShieldCheck, label: "Pago seguro" },
  { icon: RotateCcw, label: "Cambios" },
];

export function ProductDetailClient({ initialProduct }: Props) {
  const product = initialProduct;
  const addItem = useCart((s) => s.addItem);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.variants[0]?.id ?? null
  );
  const [zoomed, setZoomed] = useState(false);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === selectedVariant) ?? null;
  const price = variant ? variant.price : product.price;
  const maxStock = variant ? variant.stock : product.variants[0]?.stock ?? 0;
  const soldOut = maxStock === 0;
  const freeShipping = price >= 150_000;

  const handleAddToCart = () => {
    const key = variant ? variant.id : product.id;
    addItem(
      {
        id: key,
        variantId: variant?.id ?? null,
        name: variant ? `${product.name} — ${variant.name}` : product.name,
        slug: product.slug,
        price,
        image: product.images[0] || "",
        brand: product.brand.name,
      },
      quantity
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:px-6 lg:py-12">
      <nav className="mb-6 text-body-sm text-muted-foreground" aria-label="Migas de pan">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true" className="text-primary">
            /
          </li>
          <li>
            <Link href="/tienda" className="transition-colors hover:text-primary">
              Tienda
            </Link>
          </li>
          <li aria-hidden="true" className="text-primary">
            /
          </li>
          <li>
            <Link
              href={`/tienda/${product.category.slug}`}
              className="transition-colors hover:text-primary"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true" className="text-primary">
            /
          </li>
          <li className="clamp-1 font-medium text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Galería — DESIGN.md §18 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="gallery-zoom relative aspect-square overflow-hidden rounded-xl bg-muted"
            data-zoomed={zoomed}
            onClick={() => setZoomed((prev) => !prev)}
            onMouseLeave={() => setZoomed(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setZoomed((prev) => !prev);
              }
            }}
            aria-label={zoomed ? "Alejar imagen" : "Ampliar imagen"}
          >
            <Image
              src={product.images[selectedImage] || cloudinary(IMG.landing.makeup)}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => {
                    setSelectedImage(i);
                    setZoomed(false);
                  }}
                  aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                  aria-current={i === selectedImage}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    i === selectedImage
                      ? "border-primary"
                      : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="20vw" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información — DESIGN.md §17 */}
        <div className="flex flex-col">
          <div>
            <p className="text-caption mb-2 text-muted-foreground">{product.brand.name}</p>
            <h1 className="text-h1">{product.name}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-price-lg text-primary">
                ${price.toLocaleString("es-CO")}
              </span>
              {freeShipping && (
                <span className="inline-flex items-center rounded-full bg-primary-lighter/50 px-3 py-1 text-body-sm font-semibold text-primary-dark">
                  Envío gratis
                </span>
              )}
              {soldOut && (
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-body-sm font-semibold text-destructive">
                  Agotado
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-body whitespace-pre-line text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}

          {product.variants.length > 1 && (
            <fieldset className="mt-6 border-t border-border pt-6">
              <legend className="mb-3 text-body font-semibold">Elige una variante</legend>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((option) => {
                  const active = option.id === selectedVariant;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(option.id);
                        setQuantity(1);
                      }}
                      aria-pressed={active}
                      className={`min-h-11 rounded-lg border-2 px-4 py-2 text-left text-body-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        active
                          ? "border-primary bg-primary/5 font-semibold text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {option.name}
                      <span className="block text-caption mt-0.5 normal-case tracking-normal">
                        ${option.price.toLocaleString("es-CO")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-4">
              <span className="text-body font-semibold">Cantidad</span>
              <div className="flex items-center overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span
                  className="w-11 text-center text-body font-semibold tabular-nums"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(q + 1, Math.max(1, maxStock)))}
                  disabled={soldOut || quantity >= maxStock}
                  className="inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {maxStock > 0 && maxStock <= 5 && (
                <span className="text-body-sm text-destructive">
                  Últimas {maxStock} unidades
                </span>
              )}
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={soldOut}
              className="h-13 w-full gap-2 text-base font-semibold"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {soldOut ? "Producto agotado" : added ? "Agregado al carrito" : "Agregar al carrito"}
            </Button>

            <p className="text-body-sm text-center text-muted-foreground" aria-live="polite">
              {added && "Producto agregado. Puedes continuar comprando."}
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <span className="text-body-sm text-muted-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
