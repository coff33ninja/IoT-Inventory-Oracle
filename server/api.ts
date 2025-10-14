import express from "express";
import cors from "cors";
import DatabaseService from "../services/databaseService.js";
import ProjectService from "../services/projectService.js";
import ChatService from "../services/chatService.js";
import TechnicalDocumentationService from "../services/technicalDocumentationService.js";
import AnalyticsService from "../services/analyticsService.js";
import { getRecommendationService, getPredictionEngine } from "../services/serviceFactory.js";
import { InventoryItem, Project, ItemStatus, ChatMessage, ComponentAlternative, ComponentPrediction, ComponentSuggestion, PersonalizedRecommendation } from "../types.js";
import { RecommendationPreferences } from "../components/RecommendationSettingsPanel.js";
import { 
  logRecommendationRequest, 
  handleRecommendationError, 
  validateRecommendationRequest, 
  rateLimitRecommendations 
} from "./middleware/recommendationMiddleware.js";

const app = express();
const port = 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialize services
const dbService = new DatabaseService();
const projectService = new ProjectService();
const chatService = new ChatService();
const technicalDocService = new TechnicalDocumentationService();

// Initialize recommendation services
const recommendationService = getRecommendationService();
const predictionEngine = getPredictionEngine();

// Inventory endpoints
app.get("/api/inventory", (req, res) => {
  try {
    const items = dbService.getAllItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

app.get("/api/inventory/:id", (req, res) => {
  try {
    const item = dbService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

app.post("/api/inventory", (req, res) => {
  try {
    const newItem = dbService.addItem(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

app.put("/api/inventory/:id", (req, res) => {
  try {
    dbService.updateItem(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.delete("/api/inventory/:id", (req, res) => {
  try {
    dbService.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.post("/api/inventory/checkout", (req, res) => {
  try {
    dbService.checkoutItems(req.body.items);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to checkout items" });
  }
});

app.get("/api/inventory/search/:query", (req, res) => {
  try {
    const items = dbService.searchItems(req.params.query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to search inventory" });
  }
});

app.get("/api/inventory/status/:status", (req, res) => {
  try {
    const items = dbService.getItemsByStatus(req.params.status as ItemStatus);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items by status" });
  }
});

app.get("/api/inventory/stats", (req, res) => {
  try {
    const stats = dbService.getInventoryStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory stats" });
  }
});

// Project endpoints
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const newProject = await projectService.addProject(req.body);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: "Failed to add project" });
  }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    await projectService.updateProject(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

app.get("/api/projects/search/:query", async (req, res) => {
  try {
    const projects = await projectService.searchProjects(req.params.query);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to search projects" });
  }
});

app.get("/api/projects/stats", async (req, res) => {
  try {
    const stats = await projectService.getProjectStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project stats" });
  }
});

app.put("/api/projects/:id/components", async (req, res) => {
  try {
    await projectService.updateProjectComponents(
      req.params.id,
      req.body.components
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project components" });
  }
});

// Chat conversation endpoints
app.get("/api/chat/conversations", (req, res) => {
  try {
    const conversations = chatService.getAllConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

app.post("/api/chat/conversations", (req, res) => {
  try {
    const { title } = req.body;
    const conversationId = chatService.createNewConversation(title);
    res.status(201).json({ id: conversationId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

app.get("/api/chat/conversations/active", (req, res) => {
  try {
    const activeId = chatService.getActiveConversationId();
    res.json({ activeConversationId: activeId });
  } catch (error) {
    res.status(500).json({ error: "Failed to get active conversation" });
  }
});

app.put("/api/chat/conversations/:id/activate", (req, res) => {
  try {
    chatService.switchToConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to switch conversation" });
  }
});

app.put("/api/chat/conversations/:id/title", (req, res) => {
  try {
    const { title } = req.body;
    chatService.updateConversationTitle(req.params.id, title);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update conversation title" });
  }
});

app.delete("/api/chat/conversations/:id", (req, res) => {
  try {
    chatService.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// Chat message endpoints
app.get("/api/chat/conversations/:id/messages", (req, res) => {
  try {
    const messages = chatService.getConversationMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/chat/conversations/:id/messages", (req, res) => {
  try {
    const message: ChatMessage = req.body;
    const messageId = chatService.addMessage(req.params.id, message);
    res.status(201).json({ id: messageId });
  } catch (error) {
    res.status(500).json({ error: "Failed to add message" });
  }
});

app.get("/api/chat/conversations/:id/context", (req, res) => {
  try {
    const context = chatService.getConversationContext(req.params.id);
    res.json(context);
  } catch (error) {
    res.status(500).json({ error: "Failed to get conversation context" });
  }
});

app.put("/api/chat/conversations/:id/summary", (req, res) => {
  try {
    const { summary } = req.body;
    chatService.updateConversationSummary(req.params.id, summary);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update conversation summary" });
  }
});

app.post("/api/chat/conversations/:id/generate-title", async (req, res) => {
  try {
    const title = await chatService.generateConversationTitle(req.params.id);
    res.json({ title });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate conversation title" });
  }
});

// Root endpoint for API status
app.get("/", (req, res) => {
  res.json({
    message: "IoT Inventory Oracle API Server",
    status: "running",
    endpoints: {
      inventory: "/api/inventory",
      projects: "/api/projects",
    },
  });
});

// Component relationship endpoints
app.post("/api/inventory/:id/relationships", (req, res) => {
  try {
    const { relatedComponentId, relationshipType, description, isRequired } = req.body;
    const relationshipId = dbService.addComponentRelationship(
      req.params.id,
      relatedComponentId,
      relationshipType,
      description,
      isRequired
    );
    res.status(201).json({ id: relationshipId });
  } catch (error) {
    res.status(500).json({ error: "Failed to add component relationship" });
  }
});

app.get("/api/inventory/:id/relationships", (req, res) => {
  try {
    const relationships = dbService.getComponentRelationships(req.params.id);
    res.json(relationships);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch component relationships" });
  }
});

app.delete("/api/relationships/:id", (req, res) => {
  try {
    dbService.removeComponentRelationship(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove component relationship" });
  }
});

// Component bundle endpoints
app.post("/api/bundles", (req, res) => {
  try {
    const { name, description, componentIds, bundleType } = req.body;
    const bundleId = dbService.createComponentBundle(name, description, componentIds, bundleType);
    res.status(201).json({ id: bundleId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create component bundle" });
  }
});

app.get("/api/bundles", (req, res) => {
  try {
    const bundles = dbService.getAllBundles();
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch component bundles" });
  }
});

app.get("/api/bundles/:id/components", (req, res) => {
  try {
    const components = dbService.getBundleComponents(req.params.id);
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bundle components" });
  }
});

app.delete("/api/bundles/:id", (req, res) => {
  try {
    dbService.deleteBundle(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bundle" });
  }
});

// Apply middleware to recommendation routes
app.use('/api/recommendations', rateLimitRecommendations, logRecommendationRequest, validateRecommendationRequest);
app.use('/api/analytics', rateLimitRecommendations, logRecommendationRequest, validateRecommendationRequest);
app.use('/api/predictions', rateLimitRecommendations, logRecommendationRequest, validateRecommendationRequest);
app.use('/api/preferences', rateLimitRecommendations, logRecommendationRequest, validateRecommendationRequest);

// Recommendation API endpoints
// Component alternatives
app.get("/api/recommendations/alternatives/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const { projectId, projectType, budget } = req.query;
    
    const context = projectId ? {
      projectId: projectId as string,
      projectType: projectType as string || 'General',
      existingComponents: [],
      budget: budget ? parseFloat(budget as string) : undefined,
      difficulty: 'Intermediate' as const
    } : undefined;

    const alternatives = await recommendationService.getComponentAlternatives(componentId, context);
    res.json(alternatives);
  } catch (error) {
    console.error('Failed to get component alternatives:', error);
    res.status(500).json({ 
      error: "Failed to get component alternatives",
      fallback: []
    });
  }
});

// Component predictions
app.get("/api/recommendations/predictions/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const predictions = await recommendationService.predictComponentNeeds(projectId);
    res.json(predictions);
  } catch (error) {
    console.error('Failed to get component predictions:', error);
    res.status(500).json({ 
      error: "Failed to get component predictions",
      fallback: []
    });
  }
});

// Project component suggestions
app.post("/api/recommendations/project-suggestions", async (req, res) => {
  try {
    const { projectType, userPreferences } = req.body;
    
    if (!projectType) {
      return res.status(400).json({ error: "Project type is required" });
    }

    const suggestions = await recommendationService.suggestProjectComponents(projectType, userPreferences || {});
    res.json(suggestions);
  } catch (error) {
    console.error('Failed to get project suggestions:', error);
    res.status(500).json({ 
      error: "Failed to get project suggestions",
      fallback: []
    });
  }
});

// Component compatibility analysis
app.post("/api/recommendations/compatibility", async (req, res) => {
  try {
    const { componentIds } = req.body;
    
    if (!Array.isArray(componentIds) || componentIds.length === 0) {
      return res.status(400).json({ error: "Component IDs array is required" });
    }

    const analysis = await recommendationService.analyzeComponentCompatibility(componentIds);
    res.json(analysis);
  } catch (error) {
    console.error('Failed to analyze compatibility:', error);
    res.status(500).json({ 
      error: "Failed to analyze compatibility",
      fallback: {
        overallCompatibility: 0,
        issues: [],
        suggestions: [],
        requiredModifications: []
      }
    });
  }
});

// Personalized recommendations
app.get("/api/recommendations/personalized/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Failed to get personalized recommendations:', error);
    res.status(500).json({ 
      error: "Failed to get personalized recommendations",
      fallback: []
    });
  }
});

// Analytics endpoints
// Usage patterns
app.get("/api/analytics/usage-patterns", async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const inventory = dbService.getAllItems();
    const projects = await projectService.getAllProjects();
    const patterns = await AnalyticsService.analyzeUsagePatterns(timeframe as string, inventory, projects);
    res.json(patterns);
  } catch (error) {
    console.error('Failed to get usage patterns:', error);
    res.status(500).json({ 
      error: "Failed to get usage patterns",
      fallback: {}
    });
  }
});

// Stock depletion predictions
app.get("/api/analytics/stock-predictions/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const inventory = dbService.getAllItems();
    const projects = await projectService.getAllProjects();
    const prediction = await AnalyticsService.predictStockDepletion(componentId, inventory, projects);
    res.json(prediction);
  } catch (error) {
    console.error('Failed to get stock prediction:', error);
    res.status(500).json({ 
      error: "Failed to get stock prediction",
      fallback: null
    });
  }
});

// Component popularity
app.get("/api/analytics/popularity", async (req, res) => {
  try {
    const { category } = req.query;
    const inventory = dbService.getAllItems();
    const projects = await projectService.getAllProjects();
    const popularity = await AnalyticsService.calculateComponentPopularity(category as string, inventory, projects);
    res.json(popularity);
  } catch (error) {
    console.error('Failed to get component popularity:', error);
    res.status(500).json({ 
      error: "Failed to get component popularity",
      fallback: []
    });
  }
});

// Spending insights
app.get("/api/analytics/spending", async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const inventory = dbService.getAllItems();
    const projects = await projectService.getAllProjects();
    const insights = await AnalyticsService.generateSpendingInsights(timeframe as string, inventory, projects);
    res.json(insights);
  } catch (error) {
    console.error('Failed to get spending insights:', error);
    res.status(500).json({ 
      error: "Failed to get spending insights",
      fallback: {}
    });
  }
});

// Project patterns
app.get("/api/analytics/project-patterns/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const inventory = dbService.getAllItems();
    const projects = await projectService.getAllProjects();
    const patterns = await AnalyticsService.identifyProjectPatterns(userId, inventory, projects);
    res.json(patterns);
  } catch (error) {
    console.error('Failed to get project patterns:', error);
    res.status(500).json({ 
      error: "Failed to get project patterns",
      fallback: []
    });
  }
});

// Prediction endpoints
// Project success prediction
app.post("/api/predictions/project-success", async (req, res) => {
  try {
    const { components, projectType } = req.body;
    
    if (!Array.isArray(components) || !projectType) {
      return res.status(400).json({ error: "Components array and project type are required" });
    }

    const prediction = await predictionEngine.predictProjectSuccess(components, projectType);
    res.json(prediction);
  } catch (error) {
    console.error('Failed to predict project success:', error);
    res.status(500).json({ 
      error: "Failed to predict project success",
      fallback: { successProbability: 0.5, confidence: 0.1 }
    });
  }
});

// Component demand forecast
app.get("/api/predictions/demand/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const { horizon = 30 } = req.query;
    
    const forecast = await predictionEngine.forecastComponentDemand(
      componentId, 
      parseInt(horizon as string)
    );
    res.json(forecast);
  } catch (error) {
    console.error('Failed to forecast component demand:', error);
    res.status(500).json({ 
      error: "Failed to forecast component demand",
      fallback: { predictedDemand: 0, confidence: 0.1 }
    });
  }
});

// Optimal quantities suggestion
app.post("/api/predictions/optimal-quantities", async (req, res) => {
  try {
    const { componentId, projectPipeline } = req.body;
    
    if (!componentId) {
      return res.status(400).json({ error: "Component ID is required" });
    }

    const suggestion = await predictionEngine.suggestOptimalQuantities(
      componentId, 
      projectPipeline || []
    );
    res.json(suggestion);
  } catch (error) {
    console.error('Failed to suggest optimal quantities:', error);
    res.status(500).json({ 
      error: "Failed to suggest optimal quantities",
      fallback: { recommendedQuantity: 1, reasoning: "Default fallback" }
    });
  }
});

// Component trends
app.get("/api/predictions/trends/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const trends = await predictionEngine.identifyComponentTrends(category);
    res.json(trends);
  } catch (error) {
    console.error('Failed to identify component trends:', error);
    res.status(500).json({ 
      error: "Failed to identify component trends",
      fallback: []
    });
  }
});

// User preferences endpoints
// Get user preferences
app.get("/api/preferences/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = dbService.getUserPreferences(userId);
    
    if (!preferences) {
      return res.status(404).json({ error: "User preferences not found" });
    }
    
    res.json(preferences);
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    res.status(500).json({ error: "Failed to get user preferences" });
  }
});

// Update user preferences
app.put("/api/preferences/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const preferences: RecommendationPreferences = req.body;
    
    dbService.saveUserPreferences(userId, preferences);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

// Delete user preferences
app.delete("/api/preferences/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    dbService.deleteUserPreferences(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user preferences:', error);
    res.status(500).json({ error: "Failed to delete user preferences" });
  }
});

// Component usage tracking
app.post("/api/recommendations/usage/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const { projectId, quantity } = req.body;
    
    if (!projectId || !quantity) {
      return res.status(400).json({ error: "Project ID and quantity are required" });
    }

    await recommendationService.updateComponentUsage(componentId, projectId, quantity);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update component usage:', error);
    res.status(500).json({ error: "Failed to update component usage" });
  }
});

// Recommendation system health and stats
app.get("/api/recommendations/health", (req, res) => {
  try {
    const health = recommendationService.isSystemHealthy();
    const stats = recommendationService.getRecommendationStats();
    const errorStats = recommendationService.getErrorStats();
    
    res.json({
      ...health,
      stats,
      errorStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get recommendation system health:', error);
    res.status(500).json({ 
      error: "Failed to get system health",
      healthy: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch operations
app.post("/api/recommendations/batch/alternatives", async (req, res) => {
  try {
    const { componentIds, context } = req.body;
    
    if (!Array.isArray(componentIds)) {
      return res.status(400).json({ error: "Component IDs array is required" });
    }

    const results = await Promise.allSettled(
      componentIds.map(id => recommendationService.getComponentAlternatives(id, context))
    );

    const alternatives = results.map((result, index) => ({
      componentId: componentIds[index],
      alternatives: result.status === 'fulfilled' ? result.value : [],
      error: result.status === 'rejected' ? result.reason?.message : null
    }));

    res.json(alternatives);
  } catch (error) {
    console.error('Failed to get batch alternatives:', error);
    res.status(500).json({ error: "Failed to get batch alternatives" });
  }
});

// Technical Documentation endpoints
app.get("/api/technical/documents", async (req, res) => {
  try {
    const documents = await technicalDocService.getTechnicalDocuments();
    res.setHeader('Content-Type', 'application/json');
    res.json(documents);
  } catch (error) {
    console.error('Failed to get technical documents:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: "Failed to get technical documents",
      fallback: []
    });
  }
});

app.get("/api/technical/specifications", async (req, res) => {
  try {
    const specifications = await technicalDocService.getTechnicalSpecifications();
    res.setHeader('Content-Type', 'application/json');
    res.json(specifications);
  } catch (error) {
    console.error('Failed to get technical specifications:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: "Failed to get technical specifications",
      fallback: []
    });
  }
});

app.get("/api/technical/parse-datasheet/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const parsedData = await technicalDocService.parseDatasheet(documentId);
    res.json(parsedData);
  } catch (error) {
    console.error('Failed to parse datasheet:', error);
    res.status(500).json({ 
      error: "Failed to parse datasheet",
      fallback: {
        extractedSpecs: {},
        features: [],
        applications: [],
        pinCount: 0,
        packageType: 'Unknown'
      }
    });
  }
});

app.get("/api/technical/pinout/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const pinoutData = await technicalDocService.generatePinoutDiagram(componentId);
    res.json(pinoutData);
  } catch (error) {
    console.error('Failed to generate pinout diagram:', error);
    res.status(500).json({ 
      error: "Failed to generate pinout diagram",
      fallback: null
    });
  }
});

app.get("/api/technical/schematic/:componentId", async (req, res) => {
  try {
    const { componentId } = req.params;
    const schematicData = await technicalDocService.generateSchematicSymbol(componentId);
    res.json(schematicData);
  } catch (error) {
    console.error('Failed to generate schematic symbol:', error);
    res.status(500).json({ 
      error: "Failed to generate schematic symbol",
      fallback: null
    });
  }
});

app.post("/api/technical/search", async (req, res) => {
  try {
    const { query, filters } = req.body;
    const searchResults = await technicalDocService.searchTechnicalDocuments(query, filters);
    res.json(searchResults);
  } catch (error) {
    console.error('Failed to search technical documents:', error);
    res.status(500).json({ 
      error: "Failed to search technical documents",
      fallback: []
    });
  }
});

// Apply error handling middleware to recommendation routes
app.use('/api/recommendations', handleRecommendationError);
app.use('/api/analytics', handleRecommendationError);
app.use('/api/predictions', handleRecommendationError);
app.use('/api/preferences', handleRecommendationError);

// User currency preference endpoint
app.post("/api/user/currency", (req, res) => {
  try {
    const { currency } = req.body;
    // In a real app, you'd save this to user preferences
    // For now, just acknowledge the request
    res.json({ success: true, currency });
  } catch (error) {
    res.status(500).json({ error: "Failed to update currency preference" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Cleanup on exit
process.on("SIGINT", () => {
  dbService.close();
  chatService.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(
    `🚀 IoT Inventory Oracle API server running on http://localhost:${port}`
  );
  console.log(
    `📊 Database: ${dbService.getInventoryStats().totalItems} items loaded`
  );
});

export default app;
