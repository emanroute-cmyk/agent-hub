import { Agent, AGENT_ICONS } from "@/lib/agents";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-muted-foreground",
  maintenance: "bg-amber-500",
  checking: "bg-yellow-400",
};

// Flask backend configuration
const FLASK_API_URL = "http://127.0.0.1:5000";

export function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const IconComponent = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;
  
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [healthChecked, setHealthChecked] = useState(false);

  // Check backend health only once when component mounts (page reload)
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setBackendStatus('checking');
        
        // Try to reach the Flask backend
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${FLASK_API_URL}/health`, {
          method: "GET",
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setBackendStatus(data.status === "offline_mode" ? 'offline' : 'online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        console.error(`Health check error for ${agent.name}:`, error);
        setBackendStatus('offline');
      } finally {
        setHealthChecked(true);
      }
    };

    checkBackendHealth();
    
    // No interval - only check once on mount/refresh
  }, []); // Empty dependency array = only runs once

  // Determine the actual status to display
  const displayStatus = !healthChecked 
    ? agent.status // Show database status while checking
    : backendStatus === 'online' 
      ? 'online' 
      : 'offline';

  const statusLabel = !healthChecked
    ? t('agents.checking')
    : displayStatus === 'online' 
      ? t('agents.online')
      : t('agents.offline');

  const isClickable = displayStatus === 'online' && agent.status === 'online';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      onClick={() => isClickable && navigate(`/agent/${agent.id}`)}
      className={`group relative glass rounded-2xl p-6 transition-all duration-300 ${
        isClickable
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
          {/* Status indicator with real-time health */}
          <div className="flex items-center gap-1.5">
            <span 
              className={`h-2 w-2 rounded-full ${
                !healthChecked 
                  ? 'bg-yellow-400 animate-pulse'
                  : displayStatus === 'online'
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground'
              }`} 
            />
            {!healthChecked && (
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping absolute opacity-75" />
            )}
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {statusLabel}
          </span>
          
          {/* Show warning if backend offline but agent marked online */}
          {/* {healthChecked && backendStatus === 'offline' && agent.status === 'online' && (
            <span className="text-[10px] text-amber-500 font-mono ml-1">
              (backend offline)
            </span>
          )} */}
        </div>
      </div>

      {/* Content */}
      <h3 className="mb-1.5 text-lg font-semibold text-foreground flex items-center gap-2">
        {agent.name}
        {isClickable && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary" />
        )}
      </h3>
      <Badge variant="secondary" className="mb-3 font-mono text-[10px] uppercase tracking-wider">
        {agent.category}
      </Badge>
      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{agent.description}</p>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Offline overlay tooltip */}
      {!isClickable && healthChecked && displayStatus === 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs font-mono text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border">
            {backendStatus === 'offline' ? 'Backend offline' : agent.status}
          </span>
        </div>
      )}
    </motion.div>
  );
}