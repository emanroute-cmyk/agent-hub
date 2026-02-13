import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Image, Paperclip, Mic, MicOff, X, FileText, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  file_name: string | null;
  created_at: string;
}

// Flask backend configuration
const FLASK_API_URL = "http://127.0.0.1:5000";

export function ChatInterface({ agentId, agentName }: { agentId: string; agentName: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load or create session
  useEffect(() => {
    if (!user) return;
    const loadSession = async () => {
      // Try to find existing session
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("agent_id", agentId)
        .order("updated_at", { ascending: false })
        .limit(1);

      let sid: string;
      if (sessions && sessions.length > 0) {
        sid = (sessions[0] as any).id;
      } else {
        const { data } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, agent_id: agentId, title: agentName })
          .select("id")
          .single();
        sid = (data as any).id;
      }
      setSessionId(sid);

      // Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });
      setMessages((msgs as ChatMsg[]) || []);
    };
    loadSession();
  }, [user, agentId, agentName]);

  const uploadMedia = async (file: File, type: "image" | "file" | "voice"): Promise<{ url: string; fileName: string } | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
    return { url: data.publicUrl, fileName: file.name };
  };

  // Send message to Flask backend
  const sendMessage = async (
    content?: string,
    mediaType?: string,
    mediaUrl?: string,
    fileName?: string
  ) => {
    if (!sessionId || !user) return;

    const text = content || input.trim();
    if (!text && !mediaUrl) return;

    // 1️⃣ Save USER message locally (DB)
    const { data: userMsg } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: text || null,
        media_type: mediaType || "text",
        media_url: mediaUrl || null,
        file_name: fileName || null,
      })
      .select()
      .single();

    if (userMsg) setMessages((prev) => [...prev, userMsg as ChatMsg]);
    setInput("");
    setIsLoading(true);

    try {
      let result;
      let response;

      // ===============================
      // 🟢 TEXT MESSAGE → Flask /ask endpoint
      // ===============================
      if (mediaType === "text" || (!mediaUrl && text)) {
        console.log("📤 Sending text to Flask:", text);
        
        response = await fetch(`${FLASK_API_URL}/ask`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            question: text,
            context: `Agent: ${agentName}, Session: ${sessionId}`
          }),
        });

        result = await response.json();
        console.log("📥 Flask response:", result);
      }

      // ===============================
      // 🟢 IMAGE / FILE / VOICE → Upload to Supabase, then send text
      // ===============================
      else if (mediaUrl && fileName) {
        // For media files, send a message about the file to Flask
        const message = `[${mediaType}] Uploaded: ${fileName}. ${text || ''}`;
        
        response = await fetch(`${FLASK_API_URL}/ask`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            question: message,
            context: `Agent: ${agentName}, Session: ${sessionId}, Media URL: ${mediaUrl}`
          }),
        });

        result = await response.json();
      }

      if (!response || !response.ok) {
        throw new Error(result?.detail || "Failed to get response from AI");
      }

      // 3️⃣ Save ASSISTANT message
      const { data: assistantMsg } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          content: result.answer || "I received your message but couldn't generate a response.",
          media_type: "text",
          media_url: null,
          file_name: null,
        })
        .select()
        .single();

      if (assistantMsg) {
        setMessages((prev) => [...prev, assistantMsg as ChatMsg]);
      }

      // Update session timestamp
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

    } catch (error) {
      console.error("❌ Agent call failed:", error);
      
      // Save error message to chat
      const { data: errorMsg } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          content: "Sorry, I encountered an error. Please check if the Flask server is running at http://127.0.0.1:5000",
          media_type: "text",
          media_url: null,
          file_name: null,
        })
        .select()
        .single();

      if (errorMsg) {
        setMessages((prev) => [...prev, errorMsg as ChatMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadMedia(file, "image");
    if (result) {
      await sendMessage(null, "image", result.url, result.fileName);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadMedia(file, "file");
    if (result) {
      await sendMessage(null, "file", result.url, result.fileName);
    }
  };

  const toggleRecording = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        const result = await uploadMedia(file, "voice");
        if (result) {
          await sendMessage(null, "voice", result.url, result.fileName);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      // Microphone access denied
    }
  };

  const togglePlayVoice = (url: string) => {
    if (playingVoice === url) {
      audioRef.current?.pause();
      setPlayingVoice(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlayingVoice(null);
      audio.play();
      audioRef.current = audio;
      setPlayingVoice(url);
    }
  };

  const renderMediaContent = (msg: ChatMsg) => {
    if (msg.media_type === "image" && msg.media_url) {
      return (
        <div className="mt-2">
          <img src={msg.media_url} alt={msg.file_name || "Image"} className="max-w-xs rounded-xl border border-border/50" />
          {msg.content && <p className="mt-2">{msg.content}</p>}
        </div>
      );
    }
    if (msg.media_type === "file" && msg.media_url) {
      return (
        <div className="mt-2">
          <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-secondary/50 px-4 py-3 hover:bg-secondary transition-colors">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm truncate">{msg.file_name || "File"}</span>
          </a>
          {msg.content && <p className="mt-2">{msg.content}</p>}
        </div>
      );
    }
    if (msg.media_type === "voice" && msg.media_url) {
      return (
        <div className="mt-2">
          <button onClick={() => togglePlayVoice(msg.media_url!)} className="flex items-center gap-2 rounded-xl bg-secondary/50 px-4 py-3 hover:bg-secondary transition-colors">
            {playingVoice === msg.media_url ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
            <span className="text-sm">{t("chat.voiceMessage")}</span>
          </button>
          {msg.content && <p className="mt-2">{msg.content}</p>}
        </div>
      );
    }
    return <p>{msg.content}</p>;
  };

  // Health check function
  const checkFlaskServer = async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/health`);
      const data = await response.json();
      console.log("✅ Flask server status:", data);
      return true;
    } catch (error) {
      console.error("❌ Flask server not reachable:", error);
      return false;
    }
  };

  // Check server on mount
  useEffect(() => {
    checkFlaskServer();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Server Status Indicator (optional) */}
      <div className="absolute top-2 right-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Flask AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 text-primary/30" />
            <p className="text-sm">{t("chat.welcome", { name: agentName })}</p>
            <p className="text-xs mt-2">Connected to Flask AI backend</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "glass rounded-bl-md text-foreground"
              }`}>
                {renderMediaContent(msg)}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-1">
              <Bot className="h-4 w-4" />
            </div>
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">{t("chat.thinking")}</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          {t("chat.recording")}
          <button onClick={toggleRecording} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2 items-end">
          {/* Media buttons */}
          <div className="flex gap-1">
            <button 
              onClick={() => imageInputRef.current?.click()} 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" 
              title={t("chat.uploadImage")}
            >
              <Image className="h-4 w-4" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" 
              title={t("chat.uploadFile")}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button 
              onClick={toggleRecording} 
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isRecording 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`} 
              title={t("chat.voiceRecord")}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <input 
            ref={imageInputRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload} 
          />
          <input 
            ref={fileInputRef} 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload} 
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-xl glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 hover:shadow-lg"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}