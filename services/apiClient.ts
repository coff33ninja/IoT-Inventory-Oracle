import { InventoryItem, Project, ItemStatus, AiInsights, MarketDataItem, ChatMessage, ComponentAlternative, ComponentPrediction, ComponentSuggestion, PersonalizedRecommendation, CompatibilityAnalysis, ProjectContext, UserPreferences } from '../types';
import { ChatConversation, ChatContext } from './clientChatService';
import { RecommendationPreferences } from '../components/RecommendationSettingsPanel';

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

  // Recommendation API methods
  async getComponentAlternatives(
    componentId: string, 
    context?: { projectId?: string; projectType?: string; budget?: number }
  ): Promise<ComponentAlternative[]> {
    const params = new URLSearchParams();
    if (context?.projectId) params.append('projectId', context.projectId);
    if (context?.projectType) params.append('projectType', context.projectType);
    if (context?.budget) params.append('budget', context.budget.toString());
    
    const url = `/recommendations/alternatives/${componentId}${params.toString() ? '?' + params.toString() : ''}`;
    return this.request<ComponentAlternative[]>(url);
  }

  async getComponentPredictions(projectId: string): Promise<ComponentPrediction[]> {
    return this.request<ComponentPrediction[]>(`/recommendations/predictions/${projectId}`);
  }

  async getProjectSuggestions(
    projectType: string, 
    userPreferences?: RecommendationPreferences
  ): Promise<ComponentSuggestion[]> {
    return this.request<ComponentSuggestion[]>('/recommendations/project-suggestions', {
      method: 'POST',
      body: JSON.stringify({ projectType, userPreferences }),
    });
  }

  async analyzeComponentCompatibility(componentIds: string[]): Promise<CompatibilityAnalysis> {
    return this.request<CompatibilityAnalysis>('/recommendations/compatibility', {
      method: 'POST',
      body: JSON.stringify({ componentIds }),
    });
  }

  async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    return this.request<PersonalizedRecommendation[]>(`/recommendations/personalized/${userId}`);
  }

  // Analytics API methods
  async getUsagePatterns(timeframe: string = '30d'): Promise<any> {
    return this.request<any>(`/analytics/usage-patterns?timeframe=${timeframe}`);
  }

  async getStockPrediction(componentId: string): Promise<any> {
    return this.request<any>(`/analytics/stock-predictions/${componentId}`);
  }

  async getComponentPopularity(category?: string): Promise<any> {
    const url = category ? `/analytics/popularity?category=${category}` : '/analytics/popularity';
    return this.request<any>(url);
  }

  async getSpendingInsights(timeframe: string = '30d'): Promise<any> {
    return this.request<any>(`/analytics/spending?timeframe=${timeframe}`);
  }

  async getProjectPatterns(userId: string): Promise<any> {
    return this.request<any>(`/analytics/project-patterns/${userId}`);
  }

  // Prediction API methods
  async predictProjectSuccess(components: string[], projectType: string): Promise<any> {
    return this.request<any>('/predictions/project-success', {
      method: 'POST',
      body: JSON.stringify({ components, projectType }),
    });
  }

  async forecastComponentDemand(componentId: string, horizon: number = 30): Promise<any> {
    return this.request<any>(`/predictions/demand/${componentId}?horizon=${horizon}`);
  }

  async suggestOptimalQuantities(componentId: string, projectPipeline: any[] = []): Promise<any> {
    return this.request<any>('/predictions/optimal-quantities', {
      method: 'POST',
      body: JSON.stringify({ componentId, projectPipeline }),
    });
  }

  async getComponentTrends(category: string): Promise<any> {
    return this.request<any>(`/predictions/trends/${category}`);
  }

  // User preferences API methods
  async getUserPreferences(userId: string): Promise<RecommendationPreferences> {
    return this.request<RecommendationPreferences>(`/preferences/${userId}`);
  }

  async updateUserPreferences(userId: string, preferences: RecommendationPreferences): Promise<void> {
    await this.request(`/preferences/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async saveUserPreferences(userId: string, preferences: RecommendationPreferences): Promise<void> {
    await this.request(`/preferences/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async deleteUserPreferences(userId: string): Promise<void> {
    await this.request(`/preferences/${userId}`, {
      method: 'DELETE',
    });
  }

  // Component usage tracking
  async updateComponentUsage(componentId: string, projectId: string, quantity: number): Promise<void> {
    await this.request(`/recommendations/usage/${componentId}`, {
      method: 'POST',
      body: JSON.stringify({ projectId, quantity }),
    });
  }

  // System health and stats
  async getRecommendationSystemHealth(): Promise<any> {
    return this.request<any>('/recommendations/health');
  }

  // Batch operations
  async getBatchAlternatives(componentIds: string[], context?: any): Promise<any> {
    return this.request<any>('/recommendations/batch/alternatives', {
      method: 'POST',
      body: JSON.stringify({ componentIds, context }),
    });
  }

  // Technical Documentation methods
  async getTechnicalDocuments(): Promise<any[]> {
    return this.request<any[]>('/technical/documents');
  }

  async getTechnicalSpecifications(): Promise<any[]> {
    return this.request<any[]>('/technical/specifications');
  }

  async parseDatasheet(documentId: string): Promise<any> {
    return this.request<any>(`/technical/parse-datasheet/${documentId}`);
  }

  async generatePinoutDiagram(componentId: string): Promise<any> {
    return this.request<any>(`/technical/pinout/${componentId}`);
  }

  async generateSchematicSymbol(componentId: string): Promise<any> {
    return this.request<any>(`/technical/schematic/${componentId}`);
  }

  async searchTechnicalDocuments(query: string, filters?: any): Promise<any[]> {
    return this.request<any[]>('/technical/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }
}

export default new ApiClient();