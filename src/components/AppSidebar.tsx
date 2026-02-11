import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, Settings, Zap, User, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export function AppSidebar() {
  const location = useLocation();
  const { t } = useI18n();
  const { user, profile, roles, signOut, isAdminOrManager } = useAuth();

  const links = [
    { to: "/", label: t("nav.agents"), icon: LayoutGrid },
    ...(isAdminOrManager ? [{ to: "/admin", label: t("nav.admin"), icon: Shield }] : []),
    { to: "/profile", label: t("nav.profile"), icon: User },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const displayName = profile?.display_name || user?.email?.split("@")[0] || t("user.name");
  const avatarUrl = profile?.avatar_url;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary glow-border">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">{t("app.title")}</h1>
          <p className="text-[11px] font-mono text-muted-foreground">{t("app.subtitle")}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || (to === "/" && location.pathname.startsWith("/agent/"));
          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-foreground bg-sidebar-accent glow-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 pb-3">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden text-xs font-bold text-primary ring-2 ring-primary/10 shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("auth.signOut")}
        </button>
      </div>
    </aside>
  );
}
