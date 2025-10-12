import express from "express";
import cors from "cors";
import DatabaseService from "../services/databaseService.js";
import ProjectService from "../services/projectService.js";
import ChatService from "../services/chatService.js";
import { InventoryItem, Project, ItemStatus, ChatMessage } from "../types.js";

const app = express();
const port = 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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
