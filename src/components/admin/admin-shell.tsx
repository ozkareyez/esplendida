"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Receipt,
  Tag,
  Award,
  Menu,
  X,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSignOut } from "@/components/admin-sign-out";
import { Toaster } from "@/components/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type NavItem = { label: string; href: string; icon: typeof Package };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Panel",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Operación",
    items: [
      { label: "CRM / Punto de venta", href: "/admin/crm", icon: Package },
      { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
      { label: "Facturas", href: "/admin/facturas", icon: Receipt },
      { label: "Inventario", href: "/admin/inventario", icon: Boxes },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Productos", href: "/admin/productos", icon: Package },
      { label: "Categorías", href: "/admin/categorias", icon: Tag },
      { label: "Marcas", href: "/admin/marcas", icon: Award },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  user,
  children,
}: {
  user: { email: string; name?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/admin" className="flex items-center gap-2 px-2 pt-1">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-primary-foreground">
          E
        </span>
        <span className="text-base font-semibold text-foreground">
          Espléndida<span className="text-muted-foreground"> · Admin</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="Navegación de administración">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-caption mb-1.5 px-2">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 shrink-0", active && "text-primary")}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name || user.email}
          </p>
          {user.name && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Store className="h-4 w-4" aria-hidden="true" />
          Ver tienda
        </Link>
        <AdminSignOut />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">
        {sidebar}
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-[var(--shadow-lift)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
      <Link href="/admin" onClick={close} className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-primary-foreground">
          E
        </span>
            <span className="text-sm font-semibold text-foreground">Espléndida Admin</span>
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ver tienda</span>
          </Link>
        </header>

        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>

      <Toaster />
      <ConfirmDialog />
    </div>
  );
}
