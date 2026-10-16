import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  brand: { name: string };
}

interface ProductCardProps {
  product: ProductCardData;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <li
      className="group animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.04, 0.28)}s` }}
    >
      <article className="card-elevated flex h-full flex-col">
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={product.name}
        >
          <div className="img-zoom-container relative aspect-square bg-muted">
            {product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10" aria-hidden="true" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <p className="text-caption mb-1.5 truncate text-muted-foreground">
            {product.brand.name}
          </p>
          <h3 className="clamp-2 text-body-sm font-semibold leading-snug">
            <Link
              href={`/producto/${product.slug}`}
              className="transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
            >
              {product.name}
            </Link>
          </h3>

          <div className="mt-auto flex flex-col gap-3 pt-3">
            <span className="text-price text-primary">
              ${product.price.toLocaleString("es-CO")}
            </span>
            <Link
              href={`/producto/${product.slug}`}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-background text-body-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Ver producto
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}
