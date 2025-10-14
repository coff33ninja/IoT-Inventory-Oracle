import Database from 'better-sqlite3';
import { 
  InventoryItem, 
  ItemStatus, 
  AiInsights, 
  MarketDataItem, 
  ComponentRelationship,
  ComponentSpecification,
  UsageMetrics,
  ComponentAlternative,
  ComponentPrediction,
  UserPreferences
} from '../types.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    // Create database in the project root
    const dbPath = join(process.cwd(), 'inventory.db');
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Create inventory items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT,
        description TEXT,
        imageUrl TEXT,
        createdAt TEXT NOT NULL,
        source TEXT,
        lastRefreshed TEXT,
        serialNumber TEXT,
        modelNumber TEXT,
        manufacturer TEXT,
        purchaseDate TEXT,
        receivedDate TEXT,
        purchasePrice REAL,
        currency TEXT,
        supplier TEXT,
        invoiceNumber TEXT,
        warrantyExpiry TEXT,
        condition TEXT,
        notes TEXT
      )
    `);

    // Add new columns to existing tables (migration)
    this.migrateDatabase();

    // Create AI insights table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemId TEXT NOT NULL,
        detailedDescription TEXT NOT NULL,
        projectIdeas TEXT NOT NULL, -- JSON array
        FOREIGN KEY (itemId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Create market data table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemId TEXT NOT NULL,
        supplier TEXT NOT NULL,
        price TEXT NOT NULL,
        link TEXT NOT NULL,
        FOREIGN KEY (itemId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Create chat conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isActive INTEGER DEFAULT 0,
        summary TEXT,
        messageCount INTEGER DEFAULT 0
      )
    `);

    // Create chat messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        groundingChunks TEXT, -- JSON array
        suggestedProject TEXT, -- JSON object
        FOREIGN KEY (conversationId) REFERENCES chat_conversations (id) ON DELETE CASCADE
      )
    `);

    // Create component relationships table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_relationships (
        id TEXT PRIMARY KEY,
        componentId TEXT NOT NULL,
        relatedComponentId TEXT NOT NULL,
        relationshipType TEXT NOT NULL,
        description TEXT,
        isRequired INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE,
        FOREIGN KEY (relatedComponentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Create component bundles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_bundles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        bundleType TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Create bundle components junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bundle_components (
        bundleId TEXT NOT NULL,
        componentId TEXT NOT NULL,
        PRIMARY KEY (bundleId, componentId),
        FOREIGN KEY (bundleId) REFERENCES component_bundles (id) ON DELETE CASCADE,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Create recommendation system tables
    this.createRecommendationTables();

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
      CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location);
      CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(createdAt);
      CREATE INDEX IF NOT EXISTS idx_conversation_updated ON chat_conversations(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_component_relationships ON component_relationships(componentId);
      CREATE INDEX IF NOT EXISTS idx_related_components ON component_relationships(relatedComponentId);
      CREATE INDEX IF NOT EXISTS idx_bundle_components ON bundle_components(bundleId);
      -- Recommendation system indexes
      CREATE INDEX IF NOT EXISTS idx_component_specs ON component_specifications(componentId);
      CREATE INDEX IF NOT EXISTS idx_usage_metrics ON usage_metrics(componentId);
      CREATE INDEX IF NOT EXISTS idx_alternatives ON component_alternatives(originalComponentId);
      CREATE INDEX IF NOT EXISTS idx_predictions ON component_predictions(componentId);
      CREATE INDEX IF NOT EXISTS idx_recommendations ON recommendations(userId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_user_preferences ON user_preferences(userId);
    `);
  }

  private createRecommendationTables() {
    // Component specifications table for detailed technical specs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_specifications (
        id TEXT PRIMARY KEY,
        componentId TEXT NOT NULL,
        specifications TEXT NOT NULL, -- JSON object with technical specs
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Usage metrics table for tracking component usage patterns
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_metrics (
        id TEXT PRIMARY KEY,
        componentId TEXT NOT NULL,
        totalUsed INTEGER DEFAULT 0,
        projectsUsedIn INTEGER DEFAULT 0,
        averageQuantityPerProject REAL DEFAULT 0,
        lastUsedDate TEXT,
        usageFrequency TEXT DEFAULT 'low',
        successRate REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Component alternatives table for storing alternative suggestions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_alternatives (
        id TEXT PRIMARY KEY,
        originalComponentId TEXT NOT NULL,
        alternativeComponentId TEXT NOT NULL,
        compatibilityScore INTEGER NOT NULL,
        priceComparison TEXT, -- JSON object with price comparison
        technicalDifferences TEXT, -- JSON array of differences
        usabilityImpact TEXT NOT NULL,
        explanation TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        requiredModifications TEXT, -- JSON array of modifications
        createdAt TEXT NOT NULL,
        FOREIGN KEY (originalComponentId) REFERENCES inventory_items (id) ON DELETE CASCADE,
        FOREIGN KEY (alternativeComponentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Component predictions table for stock depletion predictions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_predictions (
        id TEXT PRIMARY KEY,
        componentId TEXT NOT NULL,
        predictedNeedDate TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        basedOnProjects TEXT, -- JSON array of project IDs
        urgency TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // User preferences table for personalized recommendations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        preferredBrands TEXT, -- JSON array
        budgetRange TEXT, -- JSON object with min/max
        preferredSuppliers TEXT, -- JSON array
        skillLevel TEXT NOT NULL,
        projectTypes TEXT, -- JSON array
        priceWeight REAL DEFAULT 0.3,
        qualityWeight REAL DEFAULT 0.4,
        availabilityWeight REAL DEFAULT 0.3,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Recommendations table for storing generated recommendations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL, -- 'component', 'project', 'bundle'
        itemId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        relevanceScore INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        estimatedCost REAL,
        estimatedTime TEXT,
        difficulty TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL
      )
    `);

    // Project patterns table for identifying common project structures
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_patterns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        commonComponents TEXT NOT NULL, -- JSON array
        averageCost REAL NOT NULL,
        averageTime TEXT NOT NULL,
        successRate REAL NOT NULL,
        difficulty TEXT NOT NULL,
        tags TEXT, -- JSON array
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Training data table for machine learning
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS training_data (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        projectId TEXT NOT NULL,
        components TEXT NOT NULL, -- JSON array of component usage
        outcome TEXT NOT NULL,
        completionTime INTEGER NOT NULL,
        userSatisfaction INTEGER,
        modifications TEXT, -- JSON array of modifications
        createdAt TEXT NOT NULL
      )
    `);

    // Analytics cache table for storing computed analytics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id TEXT PRIMARY KEY,
        cacheKey TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL, -- JSON data
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
  }

  // Inventory CRUD operations
  getAllItems(): InventoryItem[] {
    const items = this.db.prepare(`
      SELECT * FROM inventory_items ORDER BY createdAt DESC
    `).all() as any[];

    return items.map(item => this.mapDbItemToInventoryItem(item));
  }

  getItemById(id: string): InventoryItem | null {
    const item = this.db.prepare(`
      SELECT * FROM inventory_items WHERE id = ?
    `).get(id) as any;

    return item ? this.mapDbItemToInventoryItem(item) : null;
  }

  addItem(item: Omit<InventoryItem, 'id'>): InventoryItem {
    const id = new Date().toISOString();
    const newItem: InventoryItem = { ...item, id };

    const stmt = this.db.prepare(`
      INSERT INTO inventory_items 
      (id, name, quantity, location, status, category, description, imageUrl, createdAt, source, lastRefreshed,
       serialNumber, modelNumber, manufacturer, purchaseDate, receivedDate, purchasePrice, currency, 
       supplier, invoiceNumber, warrantyExpiry, condition, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newItem.id,
      newItem.name,
      newItem.quantity,
      newItem.location || "",
      newItem.status,
      newItem.category || null,
      newItem.description || null,
      newItem.imageUrl || null,
      newItem.createdAt,
      newItem.source || null,
      newItem.lastRefreshed || null,
      newItem.serialNumber || null,
      newItem.modelNumber || null,
      newItem.manufacturer || null,
      newItem.purchaseDate || null,
      newItem.receivedDate || null,
      newItem.purchasePrice || null,
      newItem.currency || null,
      newItem.supplier || null,
      newItem.invoiceNumber || null,
      newItem.warrantyExpiry || null,
      newItem.condition || null,
      newItem.notes || null
    );

    // Add AI insights if present
    if (newItem.aiInsights) {
      this.updateAiInsights(newItem.id, newItem.aiInsights);
    }

    // Add market data if present
    if (newItem.marketData) {
      this.updateMarketData(newItem.id, newItem.marketData);
    }

    return newItem;
  }

  updateItem(item: InventoryItem): void {
    const stmt = this.db.prepare(`
      UPDATE inventory_items 
      SET name = ?, quantity = ?, location = ?, status = ?, category = ?, 
          description = ?, imageUrl = ?, source = ?, lastRefreshed = ?,
          serialNumber = ?, modelNumber = ?, manufacturer = ?, purchaseDate = ?, 
          receivedDate = ?, purchasePrice = ?, currency = ?, supplier = ?, 
          invoiceNumber = ?, warrantyExpiry = ?, condition = ?, notes = ?
      WHERE id = ?
    `);

    stmt.run(
      item.name,
      item.quantity,
      item.location,
      item.status,
      item.category || null,
      item.description || null,
      item.imageUrl || null,
      item.source || null,
      item.lastRefreshed || null,
      item.serialNumber || null,
      item.modelNumber || null,
      item.manufacturer || null,
      item.purchaseDate || null,
      item.receivedDate || null,
      item.purchasePrice || null,
      item.currency || null,
      item.supplier || null,
      item.invoiceNumber || null,
      item.warrantyExpiry || null,
      item.condition || null,
      item.notes || null,
      item.id
    );

    // Update AI insights if present
    if (item.aiInsights) {
      this.updateAiInsights(item.id, item.aiInsights);
    }

    // Update market data if present
    if (item.marketData) {
      this.updateMarketData(item.id, item.marketData);
    }
  }

  deleteItem(id: string): void {
    this.db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
  }

  // Search and filter operations
  searchItems(query: string): InventoryItem[] {
    const items = this.db.prepare(`
      SELECT * FROM inventory_items 
      WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
      ORDER BY createdAt DESC
    `).all(`%${query}%`, `%${query}%`, `%${query}%`) as any[];

    return items.map(item => this.mapDbItemToInventoryItem(item));
  }

  getItemsByStatus(status: ItemStatus): InventoryItem[] {
    const items = this.db.prepare(`
      SELECT * FROM inventory_items WHERE status = ? ORDER BY createdAt DESC
    `).all(status) as any[];

    return items.map(item => this.mapDbItemToInventoryItem(item));
  }

  getItemsByCategory(category: string): InventoryItem[] {
    const items = this.db.prepare(`
      SELECT * FROM inventory_items WHERE category = ? ORDER BY createdAt DESC
    `).all(category) as any[];

    return items.map(item => this.mapDbItemToInventoryItem(item));
  }

  // Bulk operations
  checkoutItems(itemsToCheckout: { id: string; quantity: number }[]): void {
    const stmt = this.db.prepare(`
      UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?
    `);

    const transaction = this.db.transaction((items: { id: string; quantity: number }[]) => {
      for (const item of items) {
        stmt.run(item.quantity, item.id);
      }
    });

    transaction(itemsToCheckout);
  }

  // AI insights operations
  private updateAiInsights(itemId: string, insights: AiInsights): void {
    // Delete existing insights
    this.db.prepare('DELETE FROM ai_insights WHERE itemId = ?').run(itemId);

    // Insert new insights
    this.db.prepare(`
      INSERT INTO ai_insights (itemId, detailedDescription, projectIdeas)
      VALUES (?, ?, ?)
    `).run(itemId, insights.detailedDescription, JSON.stringify(insights.projectIdeas));
  }

  private getAiInsights(itemId: string): AiInsights | undefined {
    const insights = this.db.prepare(`
      SELECT detailedDescription, projectIdeas FROM ai_insights WHERE itemId = ?
    `).get(itemId) as any;

    if (!insights) return undefined;

    return {
      detailedDescription: insights.detailedDescription,
      projectIdeas: JSON.parse(insights.projectIdeas)
    };
  }

  // Market data operations
  private updateMarketData(itemId: string, marketData: MarketDataItem[]): void {
    // Delete existing market data
    this.db.prepare('DELETE FROM market_data WHERE itemId = ?').run(itemId);

    // Insert new market data
    const stmt = this.db.prepare(`
      INSERT INTO market_data (itemId, supplier, price, link)
      VALUES (?, ?, ?, ?)
    `);

    for (const data of marketData) {
      stmt.run(itemId, data.supplier, data.price, data.link);
    }
  }

  private getMarketData(itemId: string): MarketDataItem[] {
    const marketData = this.db.prepare(`
      SELECT supplier, price, link FROM market_data WHERE itemId = ?
    `).all(itemId) as any[];

    return marketData;
  }

  // Helper method to map database row to InventoryItem
  private mapDbItemToInventoryItem(dbItem: any): InventoryItem {
    const item: InventoryItem = {
      id: dbItem.id,
      name: dbItem.name,
      quantity: dbItem.quantity,
      location: dbItem.location,
      status: dbItem.status as ItemStatus,
      category: dbItem.category,
      description: dbItem.description,
      imageUrl: dbItem.imageUrl,
      createdAt: dbItem.createdAt,
      source: dbItem.source,
      lastRefreshed: dbItem.lastRefreshed,
      serialNumber: dbItem.serialNumber,
      modelNumber: dbItem.modelNumber,
      manufacturer: dbItem.manufacturer,
      purchaseDate: dbItem.purchaseDate,
      receivedDate: dbItem.receivedDate,
      purchasePrice: dbItem.purchasePrice,
      currency: dbItem.currency,
      supplier: dbItem.supplier,
      invoiceNumber: dbItem.invoiceNumber,
      warrantyExpiry: dbItem.warrantyExpiry,
      condition: dbItem.condition as any,
      notes: dbItem.notes
    };

    // Load AI insights
    const aiInsights = this.getAiInsights(dbItem.id);
    if (aiInsights) {
      item.aiInsights = aiInsights;
    }

    // Load market data
    const marketData = this.getMarketData(dbItem.id);
    if (marketData.length > 0) {
      item.marketData = marketData;
    }

    // Load component relationships
    const relationships = this.getComponentRelationships(dbItem.id);
    if (relationships.length > 0) {
      item.relatedComponents = relationships.map(rel => ({
        id: rel.id,
        relatedComponentId: rel.relatedComponentId,
        relatedComponentName: rel.relatedComponentName,
        relationshipType: rel.relationshipType as any,
        description: rel.description,
        isRequired: Boolean(rel.isRequired)
      }));
    }

    return item;
  }

  // Analytics and reporting
  getInventoryStats() {
    const totalItems = this.db.prepare('SELECT COUNT(*) as count FROM inventory_items').get() as { count: number };
    const totalQuantity = this.db.prepare('SELECT SUM(quantity) as total FROM inventory_items').get() as { total: number };
    
    const statusCounts = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM inventory_items GROUP BY status
    `).all() as { status: string; count: number }[];

    const categoryCounts = this.db.prepare(`
      SELECT category, COUNT(*) as count FROM inventory_items 
      WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC
    `).all() as { category: string; count: number }[];

    return {
      totalItems: totalItems.count,
      totalQuantity: totalQuantity.total || 0,
      statusBreakdown: statusCounts,
      categoryBreakdown: categoryCounts
    };
  }

  // Add item with existing ID (for imports)
  addItemWithId(item: InventoryItem): void {
    const stmt = this.db.prepare(`
      INSERT INTO inventory_items 
      (id, name, quantity, location, status, category, description, imageUrl, createdAt, source, lastRefreshed,
       serialNumber, modelNumber, manufacturer, purchaseDate, receivedDate, purchasePrice, currency, 
       supplier, invoiceNumber, warrantyExpiry, condition, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      item.name,
      item.quantity,
      item.location,
      item.status,
      item.category || null,
      item.description || null,
      item.imageUrl || null,
      item.createdAt,
      item.source || null,
      item.lastRefreshed || null,
      item.serialNumber || null,
      item.modelNumber || null,
      item.manufacturer || null,
      item.purchaseDate || null,
      item.receivedDate || null,
      item.purchasePrice || null,
      item.currency || null,
      item.supplier || null,
      item.invoiceNumber || null,
      item.warrantyExpiry || null,
      item.condition || null,
      item.notes || null
    );

    // Add AI insights if present
    if (item.aiInsights) {
      this.updateAiInsights(item.id, item.aiInsights);
    }

    // Add market data if present
    if (item.marketData) {
      this.updateMarketData(item.id, item.marketData);
    }
  }

  // Migration helper - import from JSON
  importFromJson(items: InventoryItem[]): void {
    const transaction = this.db.transaction((itemsToImport: InventoryItem[]) => {
      for (const item of itemsToImport) {
        this.addItemWithId(item);
      }
    });

    transaction(items);
  }

  // Chat conversation operations
  createConversation(title: string): string {
    const id = new Date().toISOString();
    const now = new Date().toISOString();
    
    // Set all other conversations as inactive
    this.db.prepare('UPDATE chat_conversations SET isActive = 0').run();
    
    this.db.prepare(`
      INSERT INTO chat_conversations (id, title, createdAt, updatedAt, isActive, messageCount)
      VALUES (?, ?, ?, ?, 1, 0)
    `).run(id, title, now, now);
    
    return id;
  }

  getAllConversations(): Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    summary?: string;
    messageCount: number;
  }> {
    return this.db.prepare(`
      SELECT * FROM chat_conversations 
      ORDER BY updatedAt DESC
    `).all() as any[];
  }

  getActiveConversation(): string | null {
    const result = this.db.prepare(`
      SELECT id FROM chat_conversations WHERE isActive = 1 LIMIT 1
    `).get() as { id: string } | undefined;
    
    return result?.id || null;
  }

  setActiveConversation(conversationId: string): void {
    const transaction = this.db.transaction(() => {
      this.db.prepare('UPDATE chat_conversations SET isActive = 0').run();
      this.db.prepare('UPDATE chat_conversations SET isActive = 1 WHERE id = ?').run(conversationId);
    });
    transaction();
  }

  updateConversationTitle(conversationId: string, title: string): void {
    this.db.prepare(`
      UPDATE chat_conversations 
      SET title = ?, updatedAt = ? 
      WHERE id = ?
    `).run(title, new Date().toISOString(), conversationId);
  }

  updateConversationSummary(conversationId: string, summary: string): void {
    this.db.prepare(`
      UPDATE chat_conversations 
      SET summary = ?, updatedAt = ? 
      WHERE id = ?
    `).run(summary, new Date().toISOString(), conversationId);
  }

  deleteConversation(conversationId: string): void {
    this.db.prepare('DELETE FROM chat_conversations WHERE id = ?').run(conversationId);
  }

  // Chat message operations
  addMessage(conversationId: string, role: 'user' | 'model', content: string, groundingChunks?: any[], suggestedProject?: any): string {
    const id = new Date().toISOString() + '-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    const transaction = this.db.transaction(() => {
      // Insert message
      this.db.prepare(`
        INSERT INTO chat_messages (id, conversationId, role, content, createdAt, groundingChunks, suggestedProject)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        conversationId,
        role,
        content,
        now,
        groundingChunks ? JSON.stringify(groundingChunks) : null,
        suggestedProject ? JSON.stringify(suggestedProject) : null
      );
      
      // Update conversation
      this.db.prepare(`
        UPDATE chat_conversations 
        SET updatedAt = ?, messageCount = messageCount + 1
        WHERE id = ?
      `).run(now, conversationId);
    });
    
    transaction();
    return id;
  }

  getConversationMessages(conversationId: string): Array<{
    id: string;
    role: 'user' | 'model';
    content: string;
    createdAt: string;
    groundingChunks?: any[];
    suggestedProject?: any;
  }> {
    const messages = this.db.prepare(`
      SELECT * FROM chat_messages 
      WHERE conversationId = ? 
      ORDER BY createdAt ASC
    `).all(conversationId) as any[];

    return messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      groundingChunks: msg.groundingChunks ? JSON.parse(msg.groundingChunks) : undefined,
      suggestedProject: msg.suggestedProject ? JSON.parse(msg.suggestedProject) : undefined
    }));
  }

  getRecentMessages(conversationId: string, limit: number = 20): Array<{
    role: 'user' | 'model';
    content: string;
  }> {
    const messages = this.db.prepare(`
      SELECT role, content FROM chat_messages 
      WHERE conversationId = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    `).all(conversationId, limit) as any[];

    return messages.reverse(); // Return in chronological order
  }

  // Memory and context operations
  getConversationContext(conversationId: string): {
    summary?: string;
    recentTopics: string[];
    mentionedComponents: string[];
    discussedProjects: string[];
  } {
    const conversation = this.db.prepare(`
      SELECT summary FROM chat_conversations WHERE id = ?
    `).get(conversationId) as { summary?: string } | undefined;

    // Extract topics from recent messages
    const recentMessages = this.db.prepare(`
      SELECT content FROM chat_messages 
      WHERE conversationId = ? AND role = 'user'
      ORDER BY createdAt DESC 
      LIMIT 10
    `).all(conversationId) as { content: string }[];

    const recentTopics: string[] = [];
    const mentionedComponents: string[] = [];
    const discussedProjects: string[] = [];

    // Simple keyword extraction (could be enhanced with NLP)
    const componentKeywords = ['arduino', 'raspberry', 'sensor', 'led', 'motor', 'esp32', 'resistor', 'capacitor'];
    const projectKeywords = ['project', 'build', 'create', 'make', 'design'];

    recentMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Extract component mentions
      componentKeywords.forEach(keyword => {
        if (content.includes(keyword) && !mentionedComponents.includes(keyword)) {
          mentionedComponents.push(keyword);
        }
      });

      // Extract project discussions
      if (projectKeywords.some(keyword => content.includes(keyword))) {
        const words = content.split(' ').slice(0, 5).join(' ');
        if (!discussedProjects.includes(words)) {
          discussedProjects.push(words);
        }
      }

      // Extract general topics (first few words of user messages)
      const topic = content.split(' ').slice(0, 3).join(' ');
      if (topic.length > 5 && !recentTopics.includes(topic)) {
        recentTopics.push(topic);
      }
    });

    return {
      summary: conversation?.summary,
      recentTopics: recentTopics.slice(0, 5),
      mentionedComponents: mentionedComponents.slice(0, 10),
      discussedProjects: discussedProjects.slice(0, 5)
    };
  }

  // Component relationship operations
  addComponentRelationship(componentId: string, relatedComponentId: string, relationshipType: string, description?: string, isRequired: boolean = false): string {
    const id = new Date().toISOString() + '-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO component_relationships (id, componentId, relatedComponentId, relationshipType, description, isRequired, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, componentId, relatedComponentId, relationshipType, description || null, isRequired ? 1 : 0, now);
    
    return id;
  }

  getComponentRelationships(componentId: string): Array<{
    id: string;
    relatedComponentId: string;
    relatedComponentName: string;
    relationshipType: string;
    description?: string;
    isRequired: boolean;
  }> {
    return this.db.prepare(`
      SELECT cr.id, cr.relatedComponentId, ii.name as relatedComponentName, 
             cr.relationshipType, cr.description, cr.isRequired
      FROM component_relationships cr
      JOIN inventory_items ii ON cr.relatedComponentId = ii.id
      WHERE cr.componentId = ?
      ORDER BY cr.isRequired DESC, cr.relationshipType
    `).all(componentId) as any[];
  }

  removeComponentRelationship(relationshipId: string): void {
    this.db.prepare('DELETE FROM component_relationships WHERE id = ?').run(relationshipId);
  }

  // Component bundle operations
  createComponentBundle(name: string, description: string, componentIds: string[], bundleType: string = 'kit'): string {
    const id = new Date().toISOString() + '-bundle';
    const now = new Date().toISOString();
    
    const transaction = this.db.transaction(() => {
      // Create bundle
      this.db.prepare(`
        INSERT INTO component_bundles (id, name, description, bundleType, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, description, bundleType, now);
      
      // Add components to bundle
      const stmt = this.db.prepare(`
        INSERT INTO bundle_components (bundleId, componentId) VALUES (?, ?)
      `);
      
      componentIds.forEach(componentId => {
        stmt.run(id, componentId);
      });
    });
    
    transaction();
    return id;
  }

  getBundleComponents(bundleId: string): Array<{
    id: string;
    name: string;
    category?: string;
    status: string;
  }> {
    return this.db.prepare(`
      SELECT ii.id, ii.name, ii.category, ii.status
      FROM bundle_components bc
      JOIN inventory_items ii ON bc.componentId = ii.id
      WHERE bc.bundleId = ?
      ORDER BY ii.name
    `).all(bundleId) as any[];
  }

  getAllBundles(): Array<{
    id: string;
    name: string;
    description: string;
    bundleType: string;
    createdAt: string;
    componentCount: number;
  }> {
    return this.db.prepare(`
      SELECT cb.id, cb.name, cb.description, cb.bundleType, cb.createdAt,
             COUNT(bc.componentId) as componentCount
      FROM component_bundles cb
      LEFT JOIN bundle_components bc ON cb.id = bc.bundleId
      GROUP BY cb.id, cb.name, cb.description, cb.bundleType, cb.createdAt
      ORDER BY cb.createdAt DESC
    `).all() as any[];
  }

  deleteBundle(bundleId: string): void {
    this.db.prepare('DELETE FROM component_bundles WHERE id = ?').run(bundleId);
  }

  // Database migration for new columns
  private migrateDatabase() {
    try {
      // Check if new columns exist, if not add them
      const columns = [
        'serialNumber TEXT',
        'modelNumber TEXT', 
        'manufacturer TEXT',
        'purchaseDate TEXT',
        'receivedDate TEXT',
        'purchasePrice REAL',
        'currency TEXT',
        'supplier TEXT',
        'invoiceNumber TEXT',
        'warrantyExpiry TEXT',
        'condition TEXT',
        'notes TEXT'
      ];

      columns.forEach(column => {
        try {
          const columnName = column.split(' ')[0];
          this.db.exec(`ALTER TABLE inventory_items ADD COLUMN ${column}`);
          console.log(`Added column: ${columnName}`);
        } catch (error) {
          // Column already exists, ignore error
        }
      });
    } catch (error) {
      console.log('Database migration completed or not needed');
    }
  }

  // Recommendation system methods

  // Component specifications operations
  saveComponentSpecifications(componentId: string, specifications: any): void {
    const id = new Date().toISOString() + '-spec';
    const now = new Date().toISOString();
    
    // Delete existing specifications
    this.db.prepare('DELETE FROM component_specifications WHERE componentId = ?').run(componentId);
    
    // Insert new specifications
    this.db.prepare(`
      INSERT INTO component_specifications (id, componentId, specifications, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, componentId, JSON.stringify(specifications), now, now);
  }

  getComponentSpecifications(componentId: string): any | null {
    const result = this.db.prepare(`
      SELECT specifications FROM component_specifications WHERE componentId = ?
    `).get(componentId) as { specifications: string } | undefined;
    
    return result ? JSON.parse(result.specifications) : null;
  }

  // Usage metrics operations
  updateUsageMetrics(componentId: string, metrics: any): void {
    const id = new Date().toISOString() + '-metrics';
    const now = new Date().toISOString();
    
    // Check if metrics exist
    const existing = this.db.prepare(`
      SELECT id FROM usage_metrics WHERE componentId = ?
    `).get(componentId) as { id: string } | undefined;
    
    if (existing) {
      // Update existing metrics
      this.db.prepare(`
        UPDATE usage_metrics 
        SET totalUsed = ?, projectsUsedIn = ?, averageQuantityPerProject = ?, 
            lastUsedDate = ?, usageFrequency = ?, successRate = ?, updatedAt = ?
        WHERE componentId = ?
      `).run(
        metrics.totalUsed,
        metrics.projectsUsedIn,
        metrics.averageQuantityPerProject,
        metrics.lastUsedDate,
        metrics.usageFrequency,
        metrics.successRate,
        now,
        componentId
      );
    } else {
      // Insert new metrics
      this.db.prepare(`
        INSERT INTO usage_metrics 
        (id, componentId, totalUsed, projectsUsedIn, averageQuantityPerProject, 
         lastUsedDate, usageFrequency, successRate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        componentId,
        metrics.totalUsed,
        metrics.projectsUsedIn,
        metrics.averageQuantityPerProject,
        metrics.lastUsedDate,
        metrics.usageFrequency,
        metrics.successRate,
        now,
        now
      );
    }
  }

  getUsageMetrics(componentId: string): any | null {
    const result = this.db.prepare(`
      SELECT * FROM usage_metrics WHERE componentId = ?
    `).get(componentId) as any;
    
    return result || null;
  }

  // Component alternatives operations
  saveComponentAlternatives(originalComponentId: string, alternatives: any[]): void {
    // Delete existing alternatives
    this.db.prepare('DELETE FROM component_alternatives WHERE originalComponentId = ?').run(originalComponentId);
    
    // Insert new alternatives
    const stmt = this.db.prepare(`
      INSERT INTO component_alternatives 
      (id, originalComponentId, alternativeComponentId, compatibilityScore, priceComparison,
       technicalDifferences, usabilityImpact, explanation, confidence, requiredModifications, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    alternatives.forEach((alt, index) => {
      const id = `${originalComponentId}-alt-${index}-${now}`;
      stmt.run(
        id,
        originalComponentId,
        alt.componentId,
        alt.compatibilityScore,
        JSON.stringify(alt.priceComparison),
        JSON.stringify(alt.technicalDifferences),
        alt.usabilityImpact,
        alt.explanation,
        alt.confidence,
        alt.requiredModifications ? JSON.stringify(alt.requiredModifications) : null,
        now
      );
    });
  }

  getComponentAlternatives(originalComponentId: string): any[] {
    const results = this.db.prepare(`
      SELECT * FROM component_alternatives WHERE originalComponentId = ?
      ORDER BY compatibilityScore DESC, confidence DESC
    `).all(originalComponentId) as any[];
    
    return results.map(result => ({
      componentId: result.alternativeComponentId,
      name: result.name,
      compatibilityScore: result.compatibilityScore,
      priceComparison: JSON.parse(result.priceComparison || '{}'),
      technicalDifferences: JSON.parse(result.technicalDifferences || '[]'),
      usabilityImpact: result.usabilityImpact,
      explanation: result.explanation,
      confidence: result.confidence,
      requiredModifications: result.requiredModifications ? JSON.parse(result.requiredModifications) : undefined
    }));
  }

  // Component predictions operations
  saveComponentPrediction(prediction: any): void {
    const id = new Date().toISOString() + '-pred';
    const now = new Date().toISOString();
    
    // Delete existing prediction for this component
    this.db.prepare('DELETE FROM component_predictions WHERE componentId = ?').run(prediction.componentId);
    
    // Insert new prediction
    this.db.prepare(`
      INSERT INTO component_predictions 
      (id, componentId, predictedNeedDate, confidence, quantity, reasoning, basedOnProjects, urgency, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      prediction.componentId,
      prediction.predictedNeedDate,
      prediction.confidence,
      prediction.quantity,
      prediction.reasoning,
      JSON.stringify(prediction.basedOnProjects),
      prediction.urgency,
      now
    );
  }

  getComponentPredictions(componentId?: string): any[] {
    let query = 'SELECT * FROM component_predictions';
    let params: any[] = [];
    
    if (componentId) {
      query += ' WHERE componentId = ?';
      params.push(componentId);
    }
    
    query += ' ORDER BY urgency DESC, predictedNeedDate ASC';
    
    const results = this.db.prepare(query).all(...params) as any[];
    
    return results.map(result => ({
      componentId: result.componentId,
      predictedNeedDate: result.predictedNeedDate,
      confidence: result.confidence,
      quantity: result.quantity,
      reasoning: result.reasoning,
      basedOnProjects: JSON.parse(result.basedOnProjects || '[]'),
      urgency: result.urgency
    }));
  }

  // User preferences operations
  saveUserPreferences(userId: string, preferences: any): void {
    const id = new Date().toISOString() + '-pref';
    const now = new Date().toISOString();
    
    // Check if preferences exist
    const existing = this.db.prepare(`
      SELECT id FROM user_preferences WHERE userId = ?
    `).get(userId) as { id: string } | undefined;
    
    if (existing) {
      // Update existing preferences
      this.db.prepare(`
        UPDATE user_preferences 
        SET preferredBrands = ?, budgetRange = ?, preferredSuppliers = ?, skillLevel = ?,
            projectTypes = ?, priceWeight = ?, qualityWeight = ?, availabilityWeight = ?, updatedAt = ?
        WHERE userId = ?
      `).run(
        JSON.stringify(preferences.preferredBrands),
        JSON.stringify(preferences.budgetRange),
        JSON.stringify(preferences.preferredSuppliers),
        preferences.skillLevel,
        JSON.stringify(preferences.projectTypes),
        preferences.priceWeight,
        preferences.qualityWeight,
        preferences.availabilityWeight,
        now,
        userId
      );
    } else {
      // Insert new preferences
      this.db.prepare(`
        INSERT INTO user_preferences 
        (id, userId, preferredBrands, budgetRange, preferredSuppliers, skillLevel,
         projectTypes, priceWeight, qualityWeight, availabilityWeight, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        JSON.stringify(preferences.preferredBrands),
        JSON.stringify(preferences.budgetRange),
        JSON.stringify(preferences.preferredSuppliers),
        preferences.skillLevel,
        JSON.stringify(preferences.projectTypes),
        preferences.priceWeight,
        preferences.qualityWeight,
        preferences.availabilityWeight,
        now,
        now
      );
    }
  }

  getUserPreferences(userId: string): any | null {
    const result = this.db.prepare(`
      SELECT * FROM user_preferences WHERE userId = ?
    `).get(userId) as any;
    
    if (!result) return null;
    
    return {
      preferredBrands: JSON.parse(result.preferredBrands || '[]'),
      budgetRange: JSON.parse(result.budgetRange || '{}'),
      preferredSuppliers: JSON.parse(result.preferredSuppliers || '[]'),
      skillLevel: result.skillLevel,
      projectTypes: JSON.parse(result.projectTypes || '[]'),
      priceWeight: result.priceWeight,
      qualityWeight: result.qualityWeight,
      availabilityWeight: result.availabilityWeight
    };
  }

  deleteUserPreferences(userId: string): void {
    try {
      const result = this.db.prepare(`
        DELETE FROM user_preferences WHERE userId = ?
      `).run(userId);
      
      console.log(`Deleted user preferences for user ${userId}. Rows affected: ${result.changes}`);
    } catch (error) {
      console.error('Error deleting user preferences:', error);
      throw new Error(`Failed to delete user preferences for user ${userId}`);
    }
  }

  // Analytics cache operations
  setCacheData(key: string, data: any, expirationHours: number = 24): void {
    const id = new Date().toISOString() + '-cache';
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();
    
    // Delete existing cache entry
    this.db.prepare('DELETE FROM analytics_cache WHERE cacheKey = ?').run(key);
    
    // Insert new cache entry
    this.db.prepare(`
      INSERT INTO analytics_cache (id, cacheKey, data, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, key, JSON.stringify(data), expiresAt, now);
  }

  getCacheData(key: string): any | null {
    const result = this.db.prepare(`
      SELECT data, expiresAt FROM analytics_cache WHERE cacheKey = ?
    `).get(key) as { data: string; expiresAt: string } | undefined;
    
    if (!result) return null;
    
    // Check if cache has expired
    if (new Date(result.expiresAt) < new Date()) {
      this.db.prepare('DELETE FROM analytics_cache WHERE cacheKey = ?').run(key);
      return null;
    }
    
    return JSON.parse(result.data);
  }

  // Training data operations
  saveTrainingData(trainingData: any): void {
    const id = new Date().toISOString() + '-training';
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO training_data 
      (id, userId, projectId, components, outcome, completionTime, userSatisfaction, modifications, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      trainingData.userId,
      trainingData.projectId,
      JSON.stringify(trainingData.components),
      trainingData.outcome,
      trainingData.completionTime,
      trainingData.userSatisfaction || null,
      JSON.stringify(trainingData.modifications),
      now
    );
  }

  getTrainingData(limit: number = 1000): any[] {
    const results = this.db.prepare(`
      SELECT * FROM training_data ORDER BY createdAt DESC LIMIT ?
    `).all(limit) as any[];
    
    return results.map(result => ({
      userId: result.userId,
      projectId: result.projectId,
      components: JSON.parse(result.components),
      outcome: result.outcome,
      completionTime: result.completionTime,
      userSatisfaction: result.userSatisfaction,
      modifications: JSON.parse(result.modifications || '[]'),
      createdAt: result.createdAt
    }));
  }

  close(): void {
    this.db.close();
  }
  // Exchange rate operations
  executeQuery(sql: string, params?: any[]): any {
    if (params) {
      return this.db.prepare(sql).run(...params);
    } else {
      return this.db.exec(sql);
    }
  }

  prepareStatement(sql: string) {
    return this.db.prepare(sql);
  }

  getExchangeRate(fromCurrency: string, toCurrency: string): any {
    return this.db.prepare(`
      SELECT * FROM exchange_rates 
      WHERE base_currency = ? AND target_currency = ?
    `).get(fromCurrency, toCurrency);
  }

  setExchangeRate(fromCurrency: string, toCurrency: string, rate: number): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO exchange_rates 
      (base_currency, target_currency, rate, last_updated)
      VALUES (?, ?, ?, ?)
    `).run(fromCurrency, toCurrency, rate, new Date().toISOString());
  }

  getDailyRatesCache(baseCurrency: string): any {
    return this.db.prepare(`
      SELECT * FROM daily_rates_cache WHERE base_currency = ?
    `).get(baseCurrency);
  }

  setDailyRatesCache(baseCurrency: string, ratesJson: string, lastUpdated: string): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO daily_rates_cache 
      (base_currency, rates_json, last_updated)
      VALUES (?, ?, ?)
    `).run(baseCurrency, ratesJson, lastUpdated);
  }
}

export default DatabaseService;