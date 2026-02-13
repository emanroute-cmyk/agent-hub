import { AgentCard } from "@/components/AgentCard";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AGENT_ICONS } from "@/lib/agents";

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  endpoint: string;
  icon: string;
  status: string;
  category: string | null;
}

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const { t } = useI18n();
  const { user, isAdminOrManager } = useAuth();

  useEffect(() => {
    const loadAgents = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setAgents((data as AgentRow[]) || []);
    };

    loadAgents();
  }, [user]);

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const online = agents.filter((a) => a.status === "online").length;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">{online} {t("agents.online").toLowerCase()}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("agents.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("agents.subtitle")}</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("agents.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl glass pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent, i) => (
          <AgentCard key={agent.id} agent={{ ...agent, description: agent.description || "", category: agent.category || "", status: agent.status as "online" | "offline" | "maintenance", assignedUsers: [] }} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">{agents.length === 0 ? t("agents.noAgents") : `${t("agents.noResults")} "${search}"`}</p>
        </div>
      )}
    </div>
  );
}
