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
  allocatedQuantity?: number; // Quantity allocated to projects
  availableQuantity?: number; // Calculated: quantity - allocatedQuantity
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
  usedInProjects?: { projectId: string; projectName: string; quantity: number }[]; // Track project usage
  // Component relationship fields
  relatedComponents?: ComponentRelationship[]; // Components that work with this one
  parentComponentId?: string; // If this is a sub-component (e.g., shield for a board)
  childComponentIds?: string[]; // If this has sub-components
  // Enhanced tracking fields
  serialNumber?: string; // Serial number or unique identifier
  modelNumber?: string; // Model/part number
  manufacturer?: string; // Manufacturer/brand name
  purchaseDate?: string; // Date purchased (ISO string)
  receivedDate?: string; // Date received (ISO string)
  purchasePrice?: number; // Price paid for the item
  currency?: string; // Currency code (USD, EUR, etc.)
  supplier?: string; // Where it was purchased from
  invoiceNumber?: string; // Invoice/order number
  warrantyExpiry?: string; // Warranty expiration date (ISO string)
  condition?: 'New' | 'Used' | 'Refurbished' | 'Damaged' | 'Unknown'; // Item condition
  notes?: string; // Additional notes about the item
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
    source?: 'manual' | 'github' | 'ai-suggested' | 'inventory';
    inventoryItemId?: string; // Link to inventory item if sourced from inventory
    isAllocated?: boolean; // Whether this component is allocated from inventory
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
  // Sub-project support
  parentProjectId?: string; // If this is a sub-project
  subProjects?: string[]; // Array of sub-project IDs
  isSubProject?: boolean;
  phase?: number; // Phase number for multi-phase projects
  dependencies?: string[]; // IDs of projects that must be completed first
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  groundingChunks?: any[];
  suggestedProject?: {
    projectName: string;
    components: { name: string; quantity: number }[];
  } | null;
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
  category?: string; // AI-suggested category for better organization
  manufacturer?: string; // Brand/manufacturer name
  modelNumber?: string; // Model/part number
  condition?: string; // New, Used, Refurbished, etc.
  purchasePrice?: number; // Numeric price value
  currency?: string; // Currency code (USD, EUR, etc.)
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

export interface ComponentRelationship {
  id: string;
  relatedComponentId: string;
  relatedComponentName: string;
  relationshipType: 'requires' | 'compatible_with' | 'enhances' | 'part_of' | 'contains';
  description?: string;
  isRequired?: boolean; // True if the related component is required for this one to function
}

export interface ComponentBundle {
  id: string;
  name: string;
  description: string;
  componentIds: string[];
  bundleType: 'kit' | 'combo' | 'system';
  createdAt: string;
}