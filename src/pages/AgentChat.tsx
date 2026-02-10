import { useParams, useNavigate } from "react-router-dom";
import { MOCK_AGENTS, AGENT_ICONS } from "@/lib/agents";
import { ChatInterface } from "@/components/ChatInterface";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function AgentChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const agent = MOCK_AGENTS.find((a) => a.id === id);

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  const IconComponent = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[calc(100vh-2rem)] flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4 mb-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconComponent className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{agent.name}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">{agent.category}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface agentName={agent.name} />
      </div>
    </motion.div>
  );
}
