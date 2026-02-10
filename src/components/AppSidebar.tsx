import { NavLink, useLocation } from "react-router-dom";
import { Bot, LayoutGrid, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Agents", icon: LayoutGrid },
  { to: "/admin", label: "Admin", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Agent Portal</h1>
          <p className="text-[11px] font-mono text-muted-foreground">AI Command Center</p>
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
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-foreground bg-sidebar-accent"
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
      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            U
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">User</p>
            <p className="text-[10px] text-muted-foreground font-mono">user@company.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
