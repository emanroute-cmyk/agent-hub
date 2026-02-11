import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Image, Paperclip, Mic, MicOff, X, FileText, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiService } from "@/services/api";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  file_name: string | null;
  created_at: string;
}

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
      try {
        // Try to find existing session
        const { data: sessions, error: sessionsError } = await apiService.getSessions(user.id, agentId);

        let sid: string;
        if (sessions && sessions.length > 0) {
          sid = sessions[0].id;
        } else {
          // Create new session
          const { data: newSession, error: createError } = await apiService.createSession(
            user.id,
            agentId,
            agentName
          );
          
          if (createError || !newSession) {
            console.error("Failed to create session:", createError);
            return;
          }
          sid = newSession.id;
        }
        
        setSessionId(sid);

        // Load messages
        const { data: msgs } = await apiService.getMessages(sid);
        setMessages(msgs || []);
      } catch (err) {
        console.error("Error loading session:", err);
      }
    };
    
    loadSession();
  }, [user, agentId, agentName]);

  const uploadMedia = async (file: File): Promise<{ url: string; fileName: string } | null> => {
    if (!user) return null;
    
    const { data, error } = await apiService.uploadFile(file);
    
    if (error || !data) {
      console.error("Upload failed:", error);
      return null;
    }
    
    return data;
  };

  const sendMessage = async (content?: string, mediaType?: string, mediaUrl?: string, fileName?: string) => {
    if (!sessionId || !user) {
      console.log("Cannot send message: no session or user");
      return;
    }
    
    const text = content || input.trim();
    if (!text && !mediaUrl) {
      console.log("Cannot send empty message");
      return;
    }

    console.log("Sending message:", { text, mediaType, mediaUrl, fileName });

    try {
      // Create user message
      const { data: userMsg, error: userError } = await apiService.createMessage(
        sessionId,
        "user",
        text || undefined,
        mediaType || "text",
        mediaUrl,
        fileName
      );

      if (userError || !userMsg) {
        console.error("Failed to send message:", userError);
        return;
      }

      setMessages((prev) => [...prev, userMsg as ChatMsg]);
      setInput("");
      setIsLoading(true);

      // Get AI response
      const { data: aiResponse, error: aiError } = await apiService.sendChatMessage(
        sessionId,
        text || fileName || "media",
        agentId
      );

      setIsLoading(false);

      if (aiError || !aiResponse) {
        console.error("Failed to get AI response:", aiError);
        return;
      }

      setMessages((prev) => [...prev, aiResponse as ChatMsg]);
    } catch (err) {
      console.error("Error in sendMessage:", err);
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadMedia(file);
    if (result) {
      await sendMessage(undefined, "image", result.url, result.fileName);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadMedia(file);
    if (result) {
      await sendMessage(undefined, "file", result.url, result.fileName);
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
        const result = await uploadMedia(file);
        if (result) {
          await sendMessage(undefined, "voice", result.url, result.fileName);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
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

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 text-primary/30" />
            <p className="text-sm">{t("chat.welcome", { name: agentName })}</p>
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
            <button onClick={() => imageInputRef.current?.click()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={t("chat.uploadImage")}>
              <Image className="h-4 w-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={t("chat.uploadFile")}>
              <Paperclip className="h-4 w-4" />
            </button>
            <button onClick={toggleRecording} className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isRecording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`} title={t("chat.voiceRecord")}>
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
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
