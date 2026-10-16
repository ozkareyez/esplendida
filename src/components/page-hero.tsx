import Link from "next/link";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHero({ eyebrow, title, description, breadcrumb }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-primary-lighter/30">
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 py-12 lg:px-6 lg:py-16">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-4 text-body-sm text-muted-foreground" aria-label="Migas de pan">
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumb.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-2">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-primary">
                      /
                    </span>
                  )}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="text-caption mb-2 text-primary">{eyebrow}</p>}
        <h1 className="text-h1">{title}</h1>
        {description && (
          <p className="text-body mt-3 max-w-2xl text-muted-foreground">{description}</p>
        )}
      </div>
    </section>
  );
}
