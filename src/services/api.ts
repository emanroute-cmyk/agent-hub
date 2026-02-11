// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Request failed');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ============== AGENT ENDPOINTS ==============

  async getAgents(userId?: string) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request(`/api/agents${params}`);
  }

  async getAgent(agentId: string) {
    return this.request(`/api/agents/${agentId}`);
  }

  async createAgent(agent: {
    name: string;
    description: string;
    endpoint: string;
    icon: string;
    status: string;
    category: string;
  }) {
    return this.request('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(agentId: string, agent: {
    name: string;
    description: string;
    endpoint: string;
    icon: string;
    status: string;
    category: string;
  }) {
    return this.request(`/api/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(agentId: string) {
    return this.request(`/api/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  // ============== AGENT ASSIGNMENT ENDPOINTS ==============

  async assignAgent(userId: string, agentId: string) {
    return this.request('/api/agent-assignments', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, agent_id: agentId }),
    });
  }

  async unassignAgent(userId: string, agentId: string) {
    return this.request(`/api/agent-assignments?user_id=${userId}&agent_id=${agentId}`, {
      method: 'DELETE',
    });
  }

  async getUserAssignments(userId: string) {
    return this.request(`/api/agent-assignments/${userId}`);
  }

  // ============== SESSION ENDPOINTS ==============

  async createSession(userId: string, agentId: string, title: string) {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, agent_id: agentId, title }),
    });
  }

  async getSessions(userId: string, agentId?: string) {
    const params = new URLSearchParams({ user_id: userId });
    if (agentId) params.append('agent_id', agentId);
    
    return this.request(`/api/sessions?${params.toString()}`);
  }

  // ============== MESSAGE ENDPOINTS ==============

  async createMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content?: string,
    mediaType: string = 'text',
    mediaUrl?: string,
    fileName?: string
  ) {
    const params = new URLSearchParams({
      session_id: sessionId,
      role,
      media_type: mediaType,
    });
    
    if (content) params.append('content', content);
    if (mediaUrl) params.append('media_url', mediaUrl);
    if (fileName) params.append('file_name', fileName);

    return this.request(`/api/messages?${params.toString()}`, {
      method: 'POST',
    });
  }

  async getMessages(sessionId: string) {
    return this.request(`/api/messages/${sessionId}`);
  }

  // ============== CHAT COMPLETION ==============

  async sendChatMessage(sessionId: string, message: string, agentId: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, message, agent_id: agentId }),
    });
  }

  // ============== FILE UPLOAD ==============

  async uploadFile(file: File): Promise<ApiResponse<{ url: string; fileName: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Upload Error:', error);
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);
