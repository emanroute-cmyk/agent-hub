import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, MessageSquare, Pencil, Check, X, PanelLeftClose } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/lib/api";

interface Session {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  userId: string;
  agentId: string;
  agentName: string;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onClearChat: (sessionId: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  sessionTitles?: Record<string, string>;
}

export function ChatSessionSidebar({
  userId,
  agentId,
  agentName,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onClearChat,
  collapsed,
  onToggle,
  sessionTitles = {},
}: Props) {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCleanupDone, setInitialCleanupDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSessions = async () => {
    try {
      const data = await api.fetchSessions(agentId);
      setSessions((data as Session[]) || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete all empty chats on page load/refresh
  const deleteAllEmptyChats = async () => {
    if (!userId || !agentId || initialCleanupDone) return;

    try {
      console.log("🧹 Cleaning up all empty chats on page load...");
      
      const allSessions = await api.fetchSessions(agentId);
      if (!allSessions || allSessions.length === 0) return;

      let deletedCount = 0;

      for (const session of allSessions) {
        try {
          const count = await api.countSessionMessages(session.id);
          if (count === 0) {
            console.log("🗑️ Deleting empty chat on load:", session.id);
            await api.deleteSession(session.id);
            deletedCount++;
          }
        } catch (err) {
          console.error("Error checking messages:", err);
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Deleted ${deletedCount} empty chats on page load`);
      }

      setInitialCleanupDone(true);
      await loadSessions();

      if (activeSessionId) {
        const refreshed = await api.fetchSessions(agentId);
        const exists = refreshed.some((s: any) => s.id === activeSessionId);
        if (!exists) {
          console.log("🆕 Active session was deleted, creating new one");
          onNewSession();
        }
      }

    } catch (error) {
      console.error("Error cleaning up empty chats:", error);
    }
  };

  useEffect(() => {
    if (userId && agentId) {
      deleteAllEmptyChats();
    }
  }, [userId, agentId]);

  useEffect(() => {
    loadSessions();
  }, [userId, agentId, activeSessionId]);

  useEffect(() => {
    if (Object.keys(sessionTitles).length > 0) {
      setSessions(prevSessions => 
        prevSessions.map(session => {
          const newTitle = sessionTitles[session.id];
          if (newTitle && newTitle !== session.title) {
            setUpdatingId(session.id);
            setTimeout(() => setUpdatingId(null), 1000);
            return { ...session, title: newTitle };
          }
          return session;
        })
      );
    }
  }, [sessionTitles]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDelete = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(sid);
    
    setTimeout(async () => {
      try {
        await api.deleteSessionMessages(sid);
        await api.deleteSession(sid);
        
        if (sid === activeSessionId) {
          onNewSession();
        } else {
          loadSessions();
        }
        setDeletingId(null);
      } catch (error) {
        console.error("Error deleting session:", error);
        setDeletingId(null);
      }
    }, 300);
  };

  const startRename = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(s.id);
    setEditValue(s.title || new Date(s.created_at).toLocaleDateString());
  };

  const confirmRename = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (!editingId || !editValue.trim()) { 
      setEditingId(null); 
      return; 
    }
    
    try {
      await api.updateSession(editingId, { title: editValue.trim() });
      
      setUpdatingId(editingId);
      setSessions(prev => 
        prev.map(s => s.id === editingId ? { ...s, title: editValue.trim() } : s)
      );
      setTimeout(() => setUpdatingId(null), 1000);
      setEditingId(null);
    } catch (error) {
      console.error("Error renaming session:", error);
    }
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setEditingId(null);
  };

  const getDisplayTitle = (session: Session) => {
    if (sessionTitles[session.id]) {
      return sessionTitles[session.id];
    }
    if (session.title && session.title !== agentName) {
      return session.title;
    }
    return new Date(session.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (collapsed) {
    return (
      <motion.div
        initial={false}
        animate={{ width: 40 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative h-full shrink-0 overflow-hidden border-r border-border bg-card/50"
      >
        <div className="flex h-full w-10 flex-col items-center pt-3">
          <Button size="icon" variant="ghost" className="h-7 w-7 mb-2" onClick={onNewSession} title={t("chat.newChat")}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggle} title={t("chat.expand")}>
            <PanelLeftClose className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative h-full shrink-0 overflow-hidden border-r border-border bg-card/50"
    >
      <div className="flex h-full w-64 flex-col">
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("chat.history")}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onNewSession} title={t("chat.newChat")}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggle} title={t("chat.collapse")}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {sessions.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: deletingId === s.id ? 0 : 1, 
                    y: deletingId === s.id ? -10 : 0,
                    scale: updatingId === s.id ? [1, 1.02, 1] : 1,
                    backgroundColor: updatingId === s.id 
                      ? ["rgba(59, 130, 246, 0)", "rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0)"]
                      : undefined
                  }}
                  transition={{ 
                    duration: 0.3,
                    scale: { duration: 0.3 },
                    backgroundColor: { duration: 0.6 }
                  }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => { 
                    if (editingId !== s.id && deletingId !== s.id) {
                      onSelectSession(s.id);
                    }
                  }}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all cursor-pointer",
                    s.id === activeSessionId
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    deletingId === s.id && "pointer-events-none"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  
                  {editingId === s.id ? (
                    <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { 
                          if (e.key === "Enter") confirmRename(); 
                          if (e.key === "Escape") cancelRename(); 
                        }}
                        className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40"
                        maxLength={100}
                      />
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={confirmRename} className="text-primary hover:text-primary/80 transition-colors" title="Confirm">
                        <Check className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={cancelRename} className="text-muted-foreground hover:text-foreground transition-colors" title="Cancel">
                        <X className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <motion.span 
                        className="flex-1 truncate" 
                        onDoubleClick={(e) => startRename(s, e)} 
                        title={s.title || "Double-click to rename"}
                        animate={updatingId === s.id ? { scale: [1, 1.02, 1], transition: { duration: 0.3 } } : {}}
                      >
                        {getDisplayTitle(s)}
                      </motion.span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" onClick={(e) => startRename(s, e)} />
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Trash2 className="h-3.5 w-3.5 shrink-0 text-destructive/70 hover:text-destructive cursor-pointer" onClick={(e) => handleDelete(s.id, e)} />
                        </motion.div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {sessions.length === 0 && !isLoading && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted-foreground py-4">
                {t("chat.noHistory")}
              </motion.p>
            )}
          </div>
        </ScrollArea>

        {activeSessionId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => onClearChat(activeSessionId)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t("chat.clearChat")}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
