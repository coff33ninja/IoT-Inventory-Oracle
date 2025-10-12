import express from 'express';
import cors from 'cors';
import DatabaseService from '../services/databaseService.js';
import ProjectService from '../services/projectService.js';
import { InventoryItem, Project, ItemStatus } from '../types.js';

const app = express();
const port = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize services
const dbService = new DatabaseService();
const projectService = new ProjectService();

// Inventory endpoints
app.get('/api/inventory', (req, res) => {
  try {
    const items = dbService.getAllItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.get('/api/inventory/:id', (req, res) => {
  try {
    const item = dbService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    const newItem = dbService.addItem(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

app.put('/api/inventory/:id', (req, res) => {
  try {
    dbService.updateItem(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  try {
    dbService.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.post('/api/inventory/checkout', (req, res) => {
  try {
    dbService.checkoutItems(req.body.items);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to checkout items' });
  }
});

app.get('/api/inventory/search/:query', (req, res) => {
  try {
    const items = dbService.searchItems(req.params.query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search inventory' });
  }
});

app.get('/api/inventory/status/:status', (req, res) => {
  try {
    const items = dbService.getItemsByStatus(req.params.status as ItemStatus);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items by status' });
  }
});

app.get('/api/inventory/stats', (req, res) => {
  try {
    const stats = dbService.getInventoryStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
});

// Project endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const newProject = await projectService.addProject(req.body);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    await projectService.updateProject(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.get('/api/projects/search/:query', async (req, res) => {
  try {
    const projects = await projectService.searchProjects(req.params.query);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search projects' });
  }
});

app.get('/api/projects/stats', async (req, res) => {
  try {
    const stats = await projectService.getProjectStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
});

app.put('/api/projects/:id/components', async (req, res) => {
  try {
    await projectService.updateProjectComponents(req.params.id, req.body.components);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project components' });
  }
});

// Root endpoint for API status
app.get('/', (req, res) => {
  res.json({ 
    message: 'IoT Inventory Oracle API Server',
    status: 'running',
    endpoints: {
      inventory: '/api/inventory',
      projects: '/api/projects'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Cleanup on exit
process.on('SIGINT', () => {
  dbService.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 IoT Inventory Oracle API server running on http://localhost:${port}`);
  console.log(`📊 Database: ${dbService.getInventoryStats().totalItems} items loaded`);
});

export default app;