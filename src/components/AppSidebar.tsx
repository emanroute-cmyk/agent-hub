import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, Settings, Zap, Globe, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n, LANGUAGES, Language } from "@/lib/i18n";
import { useTheme, THEMES, Theme } from "@/lib/theme";
import { useState } from "react";

export function AppSidebar() {
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [showLang, setShowLang] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const links = [
    { to: "/", label: t("nav.agents"), icon: LayoutGrid },
    { to: "/admin", label: t("nav.admin"), icon: Settings },
  ];

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

      {/* Settings */}
      <div className="px-3 pb-2 space-y-1">
        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => { setShowLang(!showLang); setShowTheme(false); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Globe className="h-4 w-4" />
            {t("settings.language")}
          </button>
          {showLang && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-border bg-card p-1 shadow-lg z-50"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setShowLang(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    language === lang.code ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Theme picker */}
        <div className="relative">
          <button
            onClick={() => { setShowTheme(!showTheme); setShowLang(false); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Palette className="h-4 w-4" />
            {t("settings.theme")}
          </button>
          {showTheme && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-border bg-card p-1 shadow-lg z-50"
            >
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => { setTheme(th.id); setShowTheme(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    theme === th.id ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{th.icon}</span> {th.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/10">
            U
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{t("user.name")}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{t("user.email")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
