"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import {
  Scissors, LayoutDashboard, CalendarDays, Settings,
  LogOut, Menu, X, Calendar,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Si está en /admin/login, no aplicar protección
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [user, loading, isLoginPage, router]);

  // Login page: renderizar sin shell
  if (isLoginPage) return <>{children}</>;

  // Cargando auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-border)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // No autenticado (redirect ya lanzado)
  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const NAV_ITEMS = [
    { href: "/admin", icon: LayoutDashboard, label: "Reservas" },
    { href: "/admin/servicios", icon: Settings, label: "Servicios" },
    { href: "/admin/clientes", icon: CalendarDays, label: "Clientes" },
    { href: "/admin/calendario", icon: Calendar, label: "Google Calendar" },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors size={22} style={{ color: "var(--color-accent)" }} />
            <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>
              Admin
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active ? "shadow-sm" : "hover:bg-gray-50"
                )}
                style={{
                  ...(active
                    ? { backgroundColor: "var(--color-accent)", color: "#fff" }
                    : { color: "var(--color-text-secondary)" }),
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Usuario + logout */}
        <div className="p-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                {user.nombre}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
              title="Cerrar sesión"
            >
              <LogOut size={16} style={{ color: "var(--color-text-secondary)" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar móvil */}
        <header
          className="lg:hidden border-b px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
        >
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
            Admin
          </span>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
