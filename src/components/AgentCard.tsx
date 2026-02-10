import { Agent, AGENT_ICONS } from "@/lib/agents";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-muted-foreground",
  maintenance: "bg-amber-500",
};

export function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const IconComponent = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;

  const statusLabel = t(`agents.${agent.status}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      onClick={() => agent.status === "online" && navigate(`/agent/${agent.id}`)}
      className={`group relative glass rounded-2xl p-6 transition-all duration-300 ${
        agent.status === "online"
          ? "cursor-pointer hover:glow-border-strong hover:scale-[1.02] hover:-translate-y-1"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-lg">
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusColors[agent.status]} ${agent.status === "online" ? "animate-pulse-glow" : ""}`} />
          <span className="text-[11px] font-mono text-muted-foreground">{statusLabel}</span>
        </div>
      </div>

      {/* Content */}
      <h3 className="mb-1.5 text-lg font-semibold text-foreground flex items-center gap-2">
        {agent.name}
        {agent.status === "online" && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary" />
        )}
      </h3>
      <Badge variant="secondary" className="mb-3 font-mono text-[10px] uppercase tracking-wider">
        {agent.category}
      </Badge>
      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{agent.description}</p>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}
