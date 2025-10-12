import { InventoryItem, Project, ItemStatus, AiInsights, MarketDataItem, ChatMessage } from '../types';
import { ChatConversation, ChatContext } from './chatService';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Inventory methods
  async getAllItems(): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>('/inventory');
  }

  async getItemById(id: string): Promise<InventoryItem> {
    return this.request<InventoryItem>(`/inventory/${id}`);
  }

  async addItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    return this.request<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateItem(item: InventoryItem): Promise<void> {
    await this.request(`/inventory/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteItem(id: string): Promise<void> {
    await this.request(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async checkoutItems(items: { id: string; quantity: number }[]): Promise<void> {
    await this.request('/inventory/checkout', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async searchItems(query: string): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/inventory/search/${encodeURIComponent(query)}`);
  }

  async getItemsByStatus(status: ItemStatus): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/inventory/status/${encodeURIComponent(status)}`);
  }

  async getInventoryStats(): Promise<{
    totalItems: number;
    totalQuantity: number;
    statusBreakdown: { status: string; count: number }[];
    categoryBreakdown: { category: string; count: number }[];
  }> {
    return this.request('/inventory/stats');
  }

  // Project methods
  async getAllProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProjectById(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(project: Project): Promise<void> {
    await this.request(`/projects/${project.id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async searchProjects(query: string): Promise<Project[]> {
    return this.request<Project[]>(`/projects/search/${encodeURIComponent(query)}`);
  }

  async getProjectStats(): Promise<{
    totalProjects: number;
    statusBreakdown: Record<string, number>;
    mostUsedComponents: { name: string; count: number }[];
  }> {
    return this.request('/projects/stats');
  }

  async updateProjectComponents(
    projectId: string,
    components: { name: string; quantity: number }[]
  ): Promise<void> {
    await this.request(`/projects/${projectId}/components`, {
      method: 'PUT',
      body: JSON.stringify({ components }),
    });
  }

  // Chat conversation methods
  async getAllConversations(): Promise<ChatConversation[]> {
    return this.request<ChatConversation[]>('/chat/conversations');
  }

  async createConversation(title?: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getActiveConversation(): Promise<{ activeConversationId: string | null }> {
    return this.request<{ activeConversationId: string | null }>('/chat/conversations/active');
  }

  async switchToConversation(conversationId: string): Promise<void> {
    await this.request(`/chat/conversations/${conversationId}/activate`, {
      method: 'PUT',
    });
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await this.request(`/chat/conversations/${conversationId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.request(`/chat/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Chat message methods
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
  }

  async addMessage(conversationId: string, message: ChatMessage): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async getConversationContext(conversationId: string): Promise<ChatContext> {
    return this.request<ChatContext>(`/chat/conversations/${conversationId}/context`);
  }

  async updateConversationSummary(conversationId: string, summary: string): Promise<void> {
    await this.request(`/chat/conversations/${conversationId}/summary`, {
      method: 'PUT',
      body: JSON.stringify({ summary }),
    });
  }

  async generateConversationTitle(conversationId: string): Promise<{ title: string }> {
    return this.request<{ title: string }>(`/chat/conversations/${conversationId}/generate-title`, {
      method: 'POST',
    });
  }
}

export default new ApiClient();