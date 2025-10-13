/**
 * Schema validation script for recommendation system
 * This validates that all required tables and columns exist
 */

import Database from "better-sqlite3";
import { join } from "path";

interface TableInfo {
  name: string;
  sql: string;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

class SchemaValidator {
  private db: Database.Database;

  constructor() {
    const dbPath = join(process.cwd(), "inventory.db");
    this.db = new Database(dbPath);
  }

  validate(): boolean {
    console.log("🔍 Validating recommendation system database schema...\n");

    const requiredTables = [
      "component_specifications",
      "usage_metrics",
      "component_alternatives",
      "component_predictions",
      "user_preferences",
      "recommendations",
      "project_patterns",
      "training_data",
      "analytics_cache",
    ];

    let allValid = true;

    // Check if tables exist
    const existingTables = this.db
      .prepare(
        `
      SELECT name, sql FROM sqlite_master WHERE type='table'
    `
      )
      .all() as TableInfo[];

    const existingTableNames = existingTables.map((t) => t.name);

    for (const tableName of requiredTables) {
      if (existingTableNames.includes(tableName)) {
        console.log(`✅ Table '${tableName}' exists`);

        // Validate key columns for each table
        this.validateTableColumns(tableName);
      } else {
        console.log(`❌ Table '${tableName}' is missing`);
        allValid = false;
      }
    }

    // Check indexes
    console.log("\n🔍 Checking indexes...");
    const requiredIndexes = [
      "idx_component_specs",
      "idx_usage_metrics",
      "idx_alternatives",
      "idx_predictions",
      "idx_recommendations",
      "idx_user_preferences",
    ];

    const existingIndexes = this.db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'
    `
      )
      .all() as { name: string }[];

    const existingIndexNames = existingIndexes.map((i) => i.name);

    for (const indexName of requiredIndexes) {
      if (existingIndexNames.includes(indexName)) {
        console.log(`✅ Index '${indexName}' exists`);
      } else {
        console.log(
          `⚠️  Index '${indexName}' is missing (will be created on next service start)`
        );
      }
    }

    return allValid;
  }

  private validateTableColumns(tableName: string): void {
    const columns = this.db
      .prepare(`PRAGMA table_info(${tableName})`)
      .all() as ColumnInfo[];

    const expectedColumns: Record<string, string[]> = {
      component_specifications: [
        "id",
        "componentId",
        "specifications",
        "createdAt",
        "updatedAt",
      ],
      usage_metrics: [
        "id",
        "componentId",
        "totalUsed",
        "projectsUsedIn",
        "successRate",
      ],
      component_alternatives: [
        "id",
        "originalComponentId",
        "alternativeComponentId",
        "compatibilityScore",
      ],
      component_predictions: [
        "id",
        "componentId",
        "predictedNeedDate",
        "confidence",
        "urgency",
      ],
      user_preferences: [
        "id",
        "userId",
        "skillLevel",
        "priceWeight",
        "qualityWeight",
      ],
      recommendations: ["id", "userId", "type", "itemId", "relevanceScore"],
      project_patterns: ["id", "name", "commonComponents", "successRate"],
      training_data: ["id", "userId", "projectId", "outcome"],
      analytics_cache: ["id", "cacheKey", "data", "expiresAt"],
    };

    const expected = expectedColumns[tableName] || [];
    const actual = columns.map((c) => c.name);

    for (const expectedCol of expected) {
      if (actual.includes(expectedCol)) {
        console.log(`    ✅ Column '${expectedCol}' exists`);
      } else {
        console.log(`    ❌ Column '${expectedCol}' is missing`);
      }
    }
  }

  close(): void {
    this.db.close();
  }
}

// Export for use in other scripts
export default SchemaValidator;

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SchemaValidator();

  try {
    const isValid = validator.validate();

    if (isValid) {
      console.log(
        "\n🎉 Schema validation passed! Recommendation system is ready."
      );
    } else {
      console.log(
        "\n⚠️  Schema validation found issues. Please run the migration script."
      );
    }

    validator.close();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error("\n💥 Schema validation failed:", error);
    validator.close();
    process.exit(1);
  }
}
