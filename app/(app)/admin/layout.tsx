import { AppNav } from "@/components/app-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav links={[{ href: "/admin", label: "Dashboard" }]} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
