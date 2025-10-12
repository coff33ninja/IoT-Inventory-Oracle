export enum ItemStatus {
  HAVE = 'I Have',
  WANT = 'I Want',
  NEED = 'I Need',
  SALVAGED = 'I Salvaged',
  RETURNED = 'I Returned',
  DISCARDED = 'Discarded',
  GIVEN_AWAY = 'Given Away',
}

export interface AiInsights {
  detailedDescription: string;
  projectIdeas: string[];
}

export interface MarketDataItem {
  supplier: string;
  price: string;
  link: string;
}

export interface InventoryItem {
  id: string;
  name:string;
  quantity: number;
  location: string;
  status: ItemStatus;
  category?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  source?: string;
  aiInsights?: AiInsights;
  marketData?: MarketDataItem[];
  lastRefreshed?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime?: string;
  components: {
    id: string;
    name: string;
    quantity: number;
    source?: 'manual' | 'github' | 'ai-suggested';
  }[];
  instructions?: {
    id: string;
    step: number;
    title: string;
    description: string;
    image?: string;
    code?: string;
    tips?: string[];
  }[];
  createdAt: string;
  updatedAt?: string;
  status: 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold';
  progress?: number; // 0-100
  notes?: string;
  githubUrl?: string;
  imageUrl?: string;
  tags?: string[];
  aiInsights?: {
    suggestions: string[];
    improvements: string[];
    troubleshooting: string[];
    relatedProjects: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  groundingChunks?: any[];
  suggestedProject?: {
    projectName: string;
    components: { name: string; quantity: number }[];
  };
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

export interface AiSuggestedPart {
  name: string;
  supplier: string;
  price: string;
  link: string;
  status?: string; // AI-suggested status: "I Need", "I Want", or "I Have"
}

export interface HomeAssistantEntity {
    entity_id: string;
    state: string;
    attributes: {
        friendly_name?: string;
        [key: string]: any;
    };
    last_changed: string;
    last_updated: string;
    context: {
        id: string;
        parent_id: string | null;
        user_id: string | null;
    };
}

export interface HomeAssistantConfig {
    url: string;
    token: string;
}

export interface EntityInventoryLink {
    entityId: string;
    inventoryId: string;
}