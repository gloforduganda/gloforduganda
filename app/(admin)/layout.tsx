import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/admin");
  }

  const brand = getBrand();
  const settings = await db.siteSettings.findFirst({
    select: { siteName: true, logoUrl: true },
  });

  const logoUrl = settings?.logoUrl ?? brand.logoUrl ?? "/logo.png";
  const siteName = settings?.siteName ?? brand.name;

  return (
    <AdminShell
      user={{
        name: session.user.name ?? session.user.email ?? "Admin",
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        role: session.user.role,
      }}
      logoUrl={logoUrl}
      siteName={siteName}
    >
      {children}
    </AdminShell>
  );
}
