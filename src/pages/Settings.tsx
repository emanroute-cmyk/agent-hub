import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useTheme, THEMES } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Globe, Palette, Bell, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setNotifications((data as any).notifications_enabled ?? true);
        }
      });
    }
  }, [user]);

  const saveSettings = async (updates: Record<string, any>) => {
    if (!user) return;
    await supabase.from("user_settings").update(updates).eq("user_id", user.id);
    toast({ title: t("settings.saved") });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Language */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t("settings.language")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                saveSettings({ language: lang.code });
              }}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                language === lang.code ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-foreground hover:bg-surface-hover"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t("settings.theme")}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => {
                setTheme(th.id);
                saveSettings({ theme: th.id });
              }}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                theme === th.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-foreground hover:bg-surface-hover"
              }`}
            >
              <span>{th.icon}</span> {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("settings.notifications")}</h2>
              <p className="text-xs text-muted-foreground">{t("settings.notificationsDesc")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !notifications;
              setNotifications(next);
              saveSettings({ notifications_enabled: next });
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${notifications ? "bg-primary" : "bg-secondary"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${notifications ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-5 py-3 text-sm font-medium hover:bg-destructive/20 transition-all w-full justify-center"
      >
        <LogOut className="h-4 w-4" /> {t("auth.signOut")}
      </button>
    </motion.div>
  );
}
