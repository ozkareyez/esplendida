import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/login?error=forbidden");
  }

  return (
    <AdminShell user={{ email: session.user.email, name: session.user.name }}>
      {children}
    </AdminShell>
  );
}
