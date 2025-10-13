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
  originalPrice?: string; // Original price before currency conversion
  currency?: string; // Currency code for the converted price
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
  specs?: { [key: string]: string | number }; // Item-specific specifications
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
  status: 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold' | 'Dropped';
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
  removeToast: (id: number) => void;
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

// Enhanced recommendation system types
export interface ComponentSpecification {
  voltage?: { min: number; max: number; unit: string };
  current?: { max: number; unit: string };
  power?: { max: number; unit: string };
  frequency?: { min: number; max: number; unit: string };
  temperature?: { min: number; max: number; unit: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  weight?: { value: number; unit: string };
  pinout?: PinConfiguration[];
  protocols?: string[]; // I2C, SPI, UART, etc.
  compatibility?: string[]; // Arduino, Raspberry Pi, etc.
}

export interface PinConfiguration {
  pin: number;
  name: string;
  type: 'input' | 'output' | 'bidirectional' | 'power' | 'ground';
  voltage?: number;
  description?: string;
}

export interface UsageMetrics {
  totalUsed: number;
  projectsUsedIn: number;
  averageQuantityPerProject: number;
  lastUsedDate: string;
  usageFrequency: 'high' | 'medium' | 'low';
  successRate: number; // percentage of successful projects
}

export interface PricePoint {
  date: string;
  price: number;
  supplier: string;
}

export interface SupplierInfo {
  name: string;
  url: string;
  reliability: number; // 0-100
  averageShippingTime: number; // days
  lastChecked: string;
}

export interface ComponentAlternative {
  componentId: string;
  name: string;
  compatibilityScore: number; // 0-100
  priceComparison: {
    original: number;
    alternative: number;
    savings: number;
    percentageDifference: number;
  };
  technicalDifferences: TechnicalDifference[];
  usabilityImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  explanation: string;
  confidence: number; // AI confidence in recommendation
  requiredModifications?: string[]; // Circuit changes needed
}

export interface TechnicalDifference {
  property: string;
  original: string | number;
  alternative: string | number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ComponentPrediction {
  componentId: string;
  predictedNeedDate: string;
  confidence: number;
  quantity: number;
  reasoning: string;
  basedOnProjects: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface UsageAnalytics {
  totalProjects: number;
  componentUtilization: ComponentUtilization[];
  categoryBreakdown: CategoryUsage[];
  trendingComponents: TrendingComponent[];
  seasonalPatterns: SeasonalPattern[];
  wasteAnalysis: WasteMetrics;
}

export interface ComponentUtilization {
  componentId: string;
  componentName: string;
  utilizationRate: number; // 0-100
  totalQuantityUsed: number;
  averageProjectsPerMonth: number;
  lastUsed: string;
}

export interface CategoryUsage {
  category: string;
  totalComponents: number;
  totalQuantityUsed: number;
  averagePrice: number;
  popularityTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface TrendingComponent {
  componentId: string;
  componentName: string;
  trendScore: number;
  usageGrowth: number; // percentage
  reasonForTrend: string;
}

export interface SeasonalPattern {
  period: string; // 'Q1', 'Q2', etc. or 'Jan', 'Feb', etc.
  averageUsage: number;
  popularCategories: string[];
  budgetTrend: number;
}

export interface WasteMetrics {
  unusedComponents: number;
  totalWasteValue: number;
  wasteByCategory: { category: string; count: number; value: number }[];
  suggestions: string[];
}

export interface StockPrediction {
  componentId: string;
  currentStock: number;
  predictedDepletionDate: string;
  recommendedReorderQuantity: number;
  confidence: number;
  consumptionRate: number; // units per day/week/month
  factors: string[]; // factors affecting prediction
}

export interface PersonalizedRecommendation {
  type: 'component' | 'project' | 'bundle';
  itemId: string;
  title: string;
  description: string;
  relevanceScore: number;
  reasoning: string;
  estimatedCost?: number;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProjectContext {
  projectId: string;
  projectType: string;
  difficulty: string;
  existingComponents: string[];
  budget?: number;
  timeline?: string;
}

export interface UserPreferences {
  preferredBrands: string[];
  budgetRange: { min: number; max: number };
  preferredSuppliers: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  projectTypes: string[];
  priceWeight: number; // 0-1, importance of price in recommendations
  qualityWeight: number; // 0-1, importance of quality
  availabilityWeight: number; // 0-1, importance of availability
}

export interface CompatibilityAnalysis {
  overallCompatibility: number; // 0-100
  issues: CompatibilityIssue[];
  suggestions: CompatibilitySuggestion[];
  requiredModifications: string[];
}

export interface CompatibilityIssue {
  type: 'voltage' | 'current' | 'protocol' | 'physical' | 'timing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedComponents: string[];
  solution?: string;
}

export interface CompatibilitySuggestion {
  type: 'replacement' | 'addition' | 'modification';
  description: string;
  components: string[];
  estimatedCost?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ComponentSuggestion {
  componentId: string;
  name: string;
  category: string;
  quantity: number;
  confidence: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost: number;
  alternatives: ComponentAlternative[];
}

export interface SpendingAnalysis {
  totalSpent: number;
  spendingByCategory: { category: string; amount: number; percentage: number }[];
  monthlyTrend: { month: string; amount: number }[];
  topExpenses: { componentName: string; amount: number; quantity: number }[];
  budgetEfficiency: number;
  recommendations: string[];
}

export interface CostSavingOpportunity {
  type: 'bulk_purchase' | 'alternative_component' | 'supplier_change' | 'timing';
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  components: string[];
}

export interface ProjectPattern {
  patternId: string;
  name: string;
  description: string;
  commonComponents: string[];
  averageCost: number;
  averageTime: string;
  successRate: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface RecommendationError {
  type: 'insufficient_data' | 'compatibility_unknown' | 'price_data_stale' | 'ai_service_error' | 'external_api_error';
  message: string;
  fallbackStrategy: string;
  confidence: number;
  retryable: boolean;
}

export interface MLModel {
  modelId: string;
  modelType: 'recommendation' | 'prediction' | 'classification';
  version: string;
  accuracy: number;
  lastTrained: string;
  trainingDataSize: number;
  features: string[];
  hyperparameters: Record<string, any>;
}

export interface TrainingData {
  userId: string;
  projectId: string;
  components: ComponentUsage[];
  outcome: 'success' | 'failure' | 'partial';
  completionTime: number;
  userSatisfaction?: number;
  modifications: ProjectModification[];
}

export interface ComponentUsage {
  componentId: string;
  quantityUsed: number;
  quantityPlanned: number;
  wasSubstituted: boolean;
  substitutedWith?: string;
  performanceRating?: number; // 1-5
}

export interface ProjectModification {
  type: 'component_substitution' | 'quantity_change' | 'design_change';
  description: string;
  originalPlan: string;
  actualImplementation: string;
  reason: string;
  impact: 'positive' | 'negative' | 'neutral';
}