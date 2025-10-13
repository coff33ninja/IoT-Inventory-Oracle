#!/usr/bin/env tsx

/**
 * Database migration script for recommendation system
 * This script adds the new tables and indexes required for the intelligent component recommendations feature
 */

import Database from 'better-sqlite3';
import { join } from 'path';

class RecommendationMigration {
  private db: Database.Database;

  constructor() {
    const dbPath = join(process.cwd(), 'inventory.db');
    this.db = new Database(dbPath);
  }

  async migrate(): Promise<void> {
    console.log('Starting recommendation system database migration...');

    try {
      // Begin transaction
      this.db.exec('BEGIN TRANSACTION');

      // Create recommendation system tables
      this.createRecommendationTables();

      // Create indexes for performance
      this.createIndexes();

      // Commit transaction
      this.db.exec('COMMIT');

      console.log('✅ Migration completed successfully!');
    } catch (error) {
      // Rollback on error
      this.db.exec('ROLLBACK');
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private createRecommendationTables(): void {
    console.log('Creating recommendation system tables...');

    // Component specifications table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_specifications (
        id TEXT PRIMARY KEY,
        componentId TEXT NOT NULL,
        specifications TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Usage metrics table
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

    // Component alternatives table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_alternatives (
        id TEXT PRIMARY KEY,
        originalComponentId TEXT NOT NULL,
        alternativeComponentId TEXT NOT NULL,
        compatibilityScore INTEGER NOT NULL,
        priceComparison TEXT,
        technicalDifferences TEXT,
        usabilityImpact TEXT NOT NULL,
        explanation TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        requiredModifications TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (originalComponentId) REFERENCES inventory_items (id) ON DELETE CASCADE,
        FOREIGN KEY (alternativeComponentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // Component predictions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS component_predictions (
        id TEXT PRIMARY KEY,
        componentId TEXT NOT NULL,
        predictedNeedDate TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        basedOnProjects TEXT,
        urgency TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
      )
    `);

    // User preferences table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        preferredBrands TEXT,
        budgetRange TEXT,
        preferredSuppliers TEXT,
        skillLevel TEXT NOT NULL,
        projectTypes TEXT,
        priceWeight REAL DEFAULT 0.3,
        qualityWeight REAL DEFAULT 0.4,
        availabilityWeight REAL DEFAULT 0.3,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Recommendations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
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

    // Project patterns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_patterns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        commonComponents TEXT NOT NULL,
        averageCost REAL NOT NULL,
        averageTime TEXT NOT NULL,
        successRate REAL NOT NULL,
        difficulty TEXT NOT NULL,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Training data table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS training_data (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        projectId TEXT NOT NULL,
        components TEXT NOT NULL,
        outcome TEXT NOT NULL,
        completionTime INTEGER NOT NULL,
        userSatisfaction INTEGER,
        modifications TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Analytics cache table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id TEXT PRIMARY KEY,
        cacheKey TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    console.log('✅ Tables created successfully');
  }

  private createIndexes(): void {
    console.log('Creating indexes for performance...');

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_component_specs ON component_specifications(componentId);
      CREATE INDEX IF NOT EXISTS idx_usage_metrics ON usage_metrics(componentId);
      CREATE INDEX IF NOT EXISTS idx_alternatives ON component_alternatives(originalComponentId);
      CREATE INDEX IF NOT EXISTS idx_predictions ON component_predictions(componentId);
      CREATE INDEX IF NOT EXISTS idx_recommendations ON recommendations(userId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_user_preferences ON user_preferences(userId);
      CREATE INDEX IF NOT EXISTS idx_project_patterns ON project_patterns(difficulty, averageCost);
      CREATE INDEX IF NOT EXISTS idx_training_data ON training_data(userId, outcome);
      CREATE INDEX IF NOT EXISTS idx_analytics_cache ON analytics_cache(cacheKey, expiresAt);
    `);

    console.log('✅ Indexes created successfully');
  }

  close(): void {
    this.db.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new RecommendationMigration();
  
  migration.migrate()
    .then(() => {
      console.log('🎉 Recommendation system database migration completed!');
      migration.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      migration.close();
      process.exit(1);
    });
}

export default RecommendationMigration;