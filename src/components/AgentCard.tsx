import { Agent, AGENT_ICONS } from "@/lib/agents";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-muted-foreground",
  maintenance: "bg-amber-500",
};

export function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const navigate = useNavigate();
  const IconComponent = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={() => agent.status === "online" && navigate(`/agent/${agent.id}`)}
      className={`group relative glass rounded-xl p-6 transition-all duration-300 ${
        agent.status === "online"
          ? "cursor-pointer hover:glow-border-strong hover:scale-[1.02]"
          : "opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Status dot */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusColors[agent.status]} ${agent.status === "online" ? "animate-pulse-glow" : ""}`} />
        <span className="text-xs font-mono text-muted-foreground capitalize">{agent.status}</span>
      </div>

      {/* Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <IconComponent className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="mb-1 text-lg font-semibold text-foreground">{agent.name}</h3>
      <Badge variant="secondary" className="mb-3 font-mono text-xs">
        {agent.category}
      </Badge>
      <p className="text-sm leading-relaxed text-muted-foreground">{agent.description}</p>

      {/* Hover glow effect */}
      {agent.status === "online" && (
        <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: "var(--shadow-glow)" }}
        />
      )}
    </motion.div>
  );
}
