import Database from 'better-sqlite3';
import { InventoryItem, ItemStatus, AiInsights, MarketDataItem } from '../types.js';
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
        lastRefreshed TEXT
      )
    `);

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

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
      CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location);
      CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(createdAt);
      CREATE INDEX IF NOT EXISTS idx_conversation_updated ON chat_conversations(updatedAt);
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
      (id, name, quantity, location, status, category, description, imageUrl, createdAt, source, lastRefreshed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newItem.id,
      newItem.name,
      newItem.quantity,
      newItem.location,
      newItem.status,
      newItem.category || null,
      newItem.description || null,
      newItem.imageUrl || null,
      newItem.createdAt,
      newItem.source || null,
      newItem.lastRefreshed || null
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
          description = ?, imageUrl = ?, source = ?, lastRefreshed = ?
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
      lastRefreshed: dbItem.lastRefreshed
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
      (id, name, quantity, location, status, category, description, imageUrl, createdAt, source, lastRefreshed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      item.lastRefreshed || null
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

  close(): void {
    this.db.close();
  }
}

export default DatabaseService;