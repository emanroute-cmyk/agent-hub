import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, MessageSquare, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
}

export function ChatSessionSidebar({
  userId,
  agentId,
  agentName,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onClearChat,
}: Props) {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false });
    setSessions((data as Session[]) || []);
  };

  useEffect(() => {
    loadSessions();
  }, [userId, agentId, activeSessionId]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDelete = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("messages").delete().eq("session_id", sid);
    await supabase.from("chat_sessions").delete().eq("id", sid);
    if (sid === activeSessionId) {
      onNewSession();
    }
    loadSessions();
  };

  const startRename = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditValue(s.title || new Date(s.created_at).toLocaleDateString());
  };

  const confirmRename = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    await supabase
      .from("chat_sessions")
      .update({ title: editValue.trim() })
      .eq("id", editingId);
    setEditingId(null);
    loadSessions();
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-60 flex-col border-r border-border bg-secondary/30">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("chat.history")}
        </span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onNewSession} title={t("chat.newChat")}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => { if (editingId !== s.id) onSelectSession(s.id); }}
              className={cn(
                "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                s.id === activeSessionId
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                  <button onClick={confirmRename} className="text-primary hover:text-primary/80">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={cancelRename} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="flex-1 truncate"
                    onDoubleClick={(e) => startRename(s, e)}
                    title={t("chat.renameHint")}
                  >
                    {s.title || new Date(s.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => startRename(s, e)}
                    />
                    <Trash2
                      className="h-3.5 w-3.5 shrink-0 text-destructive/70 hover:text-destructive"
                      onClick={(e) => handleDelete(s.id, e)}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">{t("chat.noHistory")}</p>
          )}
        </div>
      </ScrollArea>
      {activeSessionId && (
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-destructive hover:text-destructive"
            onClick={() => onClearChat(activeSessionId)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {t("chat.clearChat")}
          </Button>
        </div>
      )}
    </div>
  );
}
