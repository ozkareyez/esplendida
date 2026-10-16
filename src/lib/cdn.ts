/**
 * Imágenes servidas desde Cloudinary (CDN).
 * Las URLs "sin versión" (`/image/upload/<publicId>`) apuntan siempre a la
 * última subida, así que reemplazar una imagen en Cloudinary actualiza el
 * sitio sin tocar el código.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dz3qod5uh";

export function cloudinary(publicId: string, transformations = ""): string {
  const clean = publicId.replace(/^\//, "");
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  return transformations ? `${base}/${transformations}/${clean}` : `${base}/${clean}`;
}

/** Imágenes servidas directo en <img> (sin next/image): auto-formato del CDN. */
export const cloudinaryAuto = (publicId: string) => cloudinary(publicId, "f_auto,q_auto");

/** Assets estáticos del sitio (antes en /public). */
export const IMG = {
  logo: "esplendor/branding/logo",
  landing: {
    hero: "esplendor/landing/hero",
    hero2: "esplendor/landing/hero-2",
    hero3: "esplendor/landing/hero-3",
    hero4: "esplendor/landing/hero-4",
    makeup: "esplendor/landing/makeup",
    skincare: "esplendor/landing/skincare",
    hair: "esplendor/landing/hair",
  },
  brands: {
    purpure: "esplendor/brands/purpure1",
    milagros: "esplendor/brands/milagros",
    pocion: "esplendor/brands/pocion",
    menta: "esplendor/brands/menta",
    ritual: "esplendor/brands/Ritual",
    click: "esplendor/brands/click",
    logo: "esplendor/brands/Logo-1",
  },
} as const;
