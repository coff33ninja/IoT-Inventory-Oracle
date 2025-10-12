import { InventoryItem, Project, ItemStatus, AiInsights, MarketDataItem } from '../types';

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
}

export default new ApiClient();