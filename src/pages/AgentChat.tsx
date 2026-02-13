import { useParams, useNavigate } from "react-router-dom";
import { AGENT_ICONS } from "@/lib/agents";
import { ChatInterface } from "@/components/ChatInterface";
import { ChatSessionSidebar } from "@/components/ChatSessionSidebar";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  endpoint: string;
  icon: string;
  status: string;
  category: string | null;
}

export default function AgentChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("agents").select("*").eq("id", id).maybeSingle();
      setAgent(data as AgentRow | null);
      setLoading(false);
    };
    load();
  }, [id]);

  // Load most recent session on mount
  useEffect(() => {
    if (!user || !id) return;
    const loadLatest = async () => {
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("agent_id", id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (sessions && sessions.length > 0) {
        setActiveSessionId((sessions[0] as any).id);
      }
      // If no sessions, ChatInterface will create one
    };
    loadLatest();
  }, [user, id]);

  const handleNewSession = () => {
    setActiveSessionId(null);
  };

  const handleClearChat = async (sessionId: string) => {
    await supabase.from("messages").delete().eq("session_id", sessionId);
    // Force re-render by toggling session
    setActiveSessionId(null);
    setTimeout(() => setActiveSessionId(sessionId), 0);
  };

  if (loading) return null;

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  const IconComponent = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-5 py-3">
        <button onClick={() => navigate("/")} className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{agent.name}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">{agent.category}</Badge>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-pulse-glow" />
              {t("agents.online")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {user && (
          <ChatSessionSidebar
            userId={user.id}
            agentId={agent.id}
            agentName={agent.name}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onClearChat={handleClearChat}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            agentId={agent.id}
            agentName={agent.name}
            sessionId={activeSessionId}
            onSessionCreated={setActiveSessionId}
          />
        </div>
      </div>
    </motion.div>
  );
}
