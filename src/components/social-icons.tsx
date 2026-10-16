import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp } from "react-icons/si";

export interface SocialIconProps {
  className?: string;
}

export function InstagramIcon({ className = "h-5 w-5" }: SocialIconProps) {
  return <SiInstagram className={className} aria-hidden="true" />;
}

export function TikTokIcon({ className = "h-5 w-5" }: SocialIconProps) {
  return <SiTiktok className={className} aria-hidden="true" />;
}

export function FacebookIcon({ className = "h-5 w-5" }: SocialIconProps) {
  return <SiFacebook className={className} aria-hidden="true" />;
}

export function WhatsAppIcon({ className = "h-5 w-5" }: SocialIconProps) {
  return <SiWhatsapp className={className} aria-hidden="true" />;
}
