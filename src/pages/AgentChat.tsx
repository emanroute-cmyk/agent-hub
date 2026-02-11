import { useParams, useNavigate } from "react-router-dom";
import { AGENT_ICONS } from "@/lib/agents";
import { ChatInterface } from "@/components/ChatInterface";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { apiService } from "@/services/api";

interface AgentRow {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: string;
  status: string;
  category: string;
}

export default function AgentChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await apiService.getAgent(id);
        
        if (error) {
          console.error("Failed to load agent:", error);
          setAgent(null);
        } else {
          setAgent(data as AgentRow);
        }
      } catch (err) {
        console.error("Error loading agent:", err);
        setAgent(null);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Agent not found.</p>
          <button
            onClick={() => navigate("/agents")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    maintenance: "bg-yellow-500",
  };
  const statusColor = statusColors[agent.status as keyof typeof statusColors] || statusColors.online;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex h-[calc(100vh-4rem)] flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4 mb-0 glass rounded-xl px-5 py-4">
        <button 
          onClick={() => navigate("/agents")} 
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{agent.name}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
              {agent.category}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${agent.status === 'online' ? 'animate-pulse-glow' : ''}`} />
              {agent.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden mt-2">
        <ChatInterface agentId={agent.id} agentName={agent.name} />
      </div>
    </motion.div>
  );
}
