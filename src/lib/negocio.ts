/**
 * Datos del salón Espléndida — un solo lugar para editar dirección,
 * horarios y videos de redes que se muestran en el home.
 */

export const BUSINESS = {
  name: "Espléndida Makeup",
  address: "Calle 45 # 11D-98",
  // Rellena la ciudad para afinar el mapa, ej. "Bogotá"
  city: "Cali",
  // Ej. "Lun – Sáb: 9:00 a.m. – 7:00 p.m."
  schedule: "",
};

const FALLBACK_WHATSAPP_NUMBER = "573000000000";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_WHATSAPP_NUMBER;

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const fullAddress = [BUSINESS.address, BUSINESS.city].filter(Boolean).join(", ");

export const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(
  fullAddress
)}&z=16&output=embed`;

export const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  fullAddress
)}`;

export const SOCIAL_PROFILES = {
  tiktok: "https://www.tiktok.com/@esplendida.tienda",
  instagram: "https://www.instagram.com/esplendida_tiendabelleza",
  facebook: "https://www.facebook.com/",
};

/**
 * Pega aquí los links de videos de TikTok (o solo su ID numérico).
 * Ej.: "https://www.tiktok.com/@esplendida/video/7412345678901234567"
 */
export const TIKTOK_VIDEOS: string[] = [
  "https://www.tiktok.com/@esplendida.tienda/video/7697380695567535381",
  "https://www.tiktok.com/@esplendida.tienda/video/7697041987387657478",
  "https://www.tiktok.com/@esplendida.tienda/video/7696290824098712853",
  "https://www.tiktok.com/@esplendida.tienda/video/7694774178066500884",
  "https://www.tiktok.com/@esplendida.tienda/video/7694062976147393812",
  "https://www.tiktok.com/@esplendida.tienda/video/7693757855211490581",
];

export function tiktokEmbedId(raw: string): string | null {
  const match = /video\/(\d+)/.exec(raw) || /^(\d{6,})$/.exec(raw.trim());
  return match ? match[1] : null;
}

export const tiktokEmbedUrl = (id: string) =>
  `https://www.tiktok.com/embed/v2/${id}`;
