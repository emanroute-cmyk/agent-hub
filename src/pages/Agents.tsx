import { MOCK_AGENTS } from "@/lib/agents";
import { AgentCard } from "@/components/AgentCard";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const { t } = useI18n();
  const filtered = MOCK_AGENTS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const online = MOCK_AGENTS.filter((a) => a.status === "online").length;

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

        {/* Search */}
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

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">{t("agents.noResults")} "{search}"</p>
        </div>
      )}
    </div>
  );
}
