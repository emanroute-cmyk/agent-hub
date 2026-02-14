/**
 * Centralized API client.
 * All data operations go through the backend API — no direct DB access from the frontend.
 *
 * The backend base URL is read from VITE_API_URL (defaults to http://127.0.0.1:5000).
 */

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthToken(): Promise<string | null> {
  // Pull the current session token from Supabase auth (kept for JWT-based auth)
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function headers(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const h = await headers();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...h, ...(opts.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function checkHealth(): Promise<{ online: boolean }> {
  try {
    const data = await request("/health");
    return { online: data.status !== "offline_mode" };
  } catch {
    return { online: false };
  }
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export async function fetchAgents() {
  return request<any[]>("/api/agents");
}

export async function fetchAgent(id: string) {
  return request<any>(`/api/agents/${id}`);
}

export async function createAgent(payload: Record<string, any>) {
  return request("/api/agents", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateAgent(id: string, payload: Record<string, any>) {
  return request(`/api/agents/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteAgent(id: string) {
  return request(`/api/agents/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Chat sessions
// ---------------------------------------------------------------------------

export async function fetchSessions(agentId: string) {
  return request<any[]>(`/api/chat/sessions?agent_id=${agentId}`);
}

export async function createSession(agentId: string, title: string) {
  return request<any>("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, title }),
  });
}

export async function updateSession(sessionId: string, payload: Record<string, any>) {
  return request(`/api/chat/sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSession(sessionId: string) {
  return request(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
}

export async function countSessionMessages(sessionId: string): Promise<number> {
  const data = await request<{ count: number }>(`/api/chat/sessions/${sessionId}/message-count`);
  return data.count;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function fetchMessages(sessionId: string) {
  return request<any[]>(`/api/chat/messages?session_id=${sessionId}`);
}

export async function createMessage(payload: Record<string, any>) {
  return request<any>("/api/chat/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSessionMessages(sessionId: string) {
  return request(`/api/chat/messages?session_id=${sessionId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Ask / Upload (Flask AI endpoints)
// ---------------------------------------------------------------------------

export async function askAgent(question: string, context: string) {
  return request<any>("/echo360/ask", {
    method: "POST",
    body: JSON.stringify({ question, context }),
  });
}

export async function uploadToAgent(file: Blob, fileName: string) {
  const formData = new FormData();
  formData.append("file", file, fileName);
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}/echo360/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload ${res.status}`);
  return res.json();
}

export async function summarizeText(text: string, maxLength = 50) {
  return request<{ summary?: string }>("/summarize", {
    method: "POST",
    body: JSON.stringify({ text, max_length: maxLength }),
  });
}

// ---------------------------------------------------------------------------
// Media upload
// ---------------------------------------------------------------------------

export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}/api/chat/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload ${res.status}`);
  return res.json() as Promise<{ url: string; fileName: string }>;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function fetchProfile() {
  return request<any>("/api/profile");
}

export async function updateProfile(payload: Record<string, any>) {
  return request("/api/profile", { method: "PUT", body: JSON.stringify(payload) });
}

export async function fetchRoles() {
  return request<{ roles: string[] }>("/api/profile/roles");
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}/api/profile/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload ${res.status}`);
  return res.json() as Promise<{ url: string }>;
}

// ---------------------------------------------------------------------------
// User settings
// ---------------------------------------------------------------------------

export async function fetchSettings() {
  return request<any>("/api/settings");
}

export async function updateSettings(payload: Record<string, any>) {
  return request("/api/settings", { method: "PUT", body: JSON.stringify(payload) });
}
