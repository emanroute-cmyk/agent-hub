import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Image, Paperclip, Mic, MicOff, X, FileText, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  file_name: string | null;
  created_at: string;
}

export function ChatInterface({
  agentId,
  agentName,
  sessionId,
  onSessionCreated,
  onSessionTitleUpdated
}: {
  agentId: string;
  agentName: string;
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
  onSessionTitleUpdated?: (title: string) => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [hasGeneratedTitle, setHasGeneratedTitle] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkBackendHealth = async () => {
    const result = await api.checkHealth();
    setIsBackendOnline(result.online);
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHasGeneratedTitle(false);
  }, [sessionId]);

  const generateSessionTitle = async (message: string) => {
    if (!sessionId || !user || hasGeneratedTitle) return;

    try {
      let title: string;
      try {
        const result = await api.summarizeText(message, 50);
        title = result.summary || message.substring(0, 50);
      } catch {
        title = message.length > 50 ? message.substring(0, 47) + "..." : message;
      }

      await api.updateSession(sessionId, {
        title,
        updated_at: new Date().toISOString()
      });

      setHasGeneratedTitle(true);
      if (onSessionTitleUpdated) onSessionTitleUpdated(title);
    } catch (error) {
      console.error("Error generating title:", error);
      const fallbackTitle = message.length > 50 ? message.substring(0, 47) + "..." : message;
      try {
        await api.updateSession(sessionId, { title: fallbackTitle, updated_at: new Date().toISOString() });
      } catch {}
      setHasGeneratedTitle(true);
      if (onSessionTitleUpdated) onSessionTitleUpdated(fallbackTitle);
    }
  };

  // Load or create session
  useEffect(() => {
    if (!user) return;

    const loadSession = async () => {
      if (sessionId) {
        try {
          const msgs = await api.fetchMessages(sessionId);
          setMessages((msgs as ChatMsg[]) || []);

          // Check if session already has a custom title
          const sessions = await api.fetchSessions(agentId);
          const current = sessions.find((s: any) => s.id === sessionId);
          if (current && current.title !== agentName) {
            setHasGeneratedTitle(true);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
        }
      } else {
        try {
          const data = await api.createSession(agentId, agentName);
          if (data?.id) {
            console.log("New session created:", data.id);
            onSessionCreated(data.id);
          }
        } catch (error) {
          console.error("Error creating session:", error);
          return;
        }
        setMessages([]);
        setHasGeneratedTitle(false);
      }
    };

    loadSession();
  }, [user, agentId, agentName, sessionId, onSessionCreated]);

  const uploadMediaFile = async (file: File): Promise<{ url: string; fileName: string } | null> => {
    try {
      return await api.uploadMedia(file);
    } catch {
      return null;
    }
  };

  const sendMessage = async (
    content?: string,
    mediaType?: string,
    mediaUrl?: string,
    fileName?: string
  ) => {
    if (!sessionId || !user) return;

    const text = content || input.trim();
    if (!text && !mediaUrl) return;

    const isFirstMessage = messages.length === 0 && !hasGeneratedTitle;

    // Save user message via API
    try {
      const userMsg = await api.createMessage({
        session_id: sessionId,
        role: "user",
        content: text || null,
        media_type: mediaType || "text",
        media_url: mediaUrl || null,
        file_name: fileName || null,
      });

      if (userMsg) setMessages((prev) => [...prev, userMsg as ChatMsg]);
    } catch (err) {
      console.error("Error saving user message:", err);
      return;
    }

    setInput("");
    setIsLoading(true);

    try {
      let result;

      if (!mediaUrl && text) {
        result = await api.askAgent(text, `Agent: ${agentName}, Session: ${sessionId}`);
      } else if (mediaUrl && fileName) {
        const fileResponse = await fetch(mediaUrl);
        const blob = await fileResponse.blob();
        result = await api.uploadToAgent(blob, fileName);
      }

      if (isFirstMessage && text) {
        await generateSessionTitle(text);
      } else if (isFirstMessage && fileName) {
        await generateSessionTitle(`File: ${fileName}`);
      }

      const assistantContent = result?.answer || result?.message || result?.response || "I received your message but couldn't generate a response.";

      try {
        const assistantMsg = await api.createMessage({
          session_id: sessionId,
          role: "assistant",
          content: assistantContent,
          media_type: "text",
          media_url: null,
          file_name: null,
        });
        if (assistantMsg) setMessages((prev) => [...prev, assistantMsg as ChatMsg]);
      } catch (err) {
        console.error("Error saving assistant message:", err);
      }

      await api.updateSession(sessionId, { updated_at: new Date().toISOString() });
    } catch (error) {
      console.error("❌ Agent call failed:", error);
      try {
        const errorMsg = await api.createMessage({
          session_id: sessionId,
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}. Please check if the backend server is running.`,
          media_type: "text",
          media_url: null,
          file_name: null,
        });
        if (errorMsg) setMessages((prev) => [...prev, errorMsg as ChatMsg]);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadMediaFile(file);
    if (result) await sendMessage(undefined, "image", result.url, result.fileName);
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadMediaFile(file);
    if (result) await sendMessage(undefined, "file", result.url, result.fileName);
    e.target.value = '';
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
        const result = await uploadMediaFile(file);
        if (result) await sendMessage(undefined, "voice", result.url, result.fileName);
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
    return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Backend Status Indicator */}
      <div className="px-4 py-2 text-xs flex items-center gap-2 border-b border-border">
        <span
          className={`h-2 w-2 rounded-full animate-pulse ${isBackendOnline === null
              ? "bg-yellow-400"
              : isBackendOnline
                ? "bg-green-500"
                : "bg-red-500"
            }`}
        />
        <span className="text-muted-foreground">
          {isBackendOnline === null && "Checking server..."}
          {isBackendOnline === true && "Online"}
          {isBackendOnline === false && "Offline"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 text-primary/30" />
            <p className="text-sm">{t("chat.welcome", { name: agentName })}</p>
            <p className="text-xs mt-2">
              {isBackendOnline ? "Connected to backend" : "Waiting for server..."}
            </p>
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
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
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
          <div className="flex gap-1">
            <button onClick={() => imageInputRef.current?.click()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={t("chat.uploadImage")} disabled={isLoading}>
              <Image className="h-4 w-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={t("chat.uploadFile")} disabled={isLoading}>
              <Paperclip className="h-4 w-4" />
            </button>
            <button onClick={toggleRecording} className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isRecording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`} title={t("chat.voiceRecord")} disabled={isLoading}>
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
            placeholder={t("chat.placeholder")}
            disabled={isLoading || !isBackendOnline}
            className="flex-1 rounded-xl glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || !isBackendOnline}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 hover:shadow-lg"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
