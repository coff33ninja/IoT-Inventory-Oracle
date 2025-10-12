# Database Schema

Technical documentation of the SQLite database schema used by IoT Inventory Oracle.

## Overview

The application uses SQLite as its primary database with the following characteristics:
- **File-based**: Single `inventory.db` file
- **ACID Transactions**: Ensures data consistency
- **Foreign Key Constraints**: Maintains referential integrity
- **Indexed Queries**: Optimized for common operations
- **Automatic Migration**: Schema updates handled automatically

## Core Tables

### inventory_items

Primary table for storing all inventory components and items.

```sql
CREATE TABLE inventory_items (
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
  -- Enhanced tracking fields
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
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Unique identifier (ISO timestamp) |
| `name` | TEXT | Component name (required) |
| `quantity` | INTEGER | Number of items (required) |
| `location` | TEXT | Storage location (required) |
| `status` | TEXT | Inventory status (required) |
| `category` | TEXT | Component category |
| `description` | TEXT | Detailed description |
| `imageUrl` | TEXT | URL to component image |
| `createdAt` | TEXT | Creation timestamp |
| `source` | TEXT | How item was added |
| `lastRefreshed` | TEXT | Last market data update |
| `serialNumber` | TEXT | Serial number or unique ID |
| `modelNumber` | TEXT | Model/part number |
| `manufacturer` | TEXT | Brand/manufacturer name |
| `purchaseDate` | TEXT | Date purchased (ISO format) |
| `receivedDate` | TEXT | Date received (ISO format) |
| `purchasePrice` | REAL | Price paid for item |
| `currency` | TEXT | Currency code (USD, EUR, etc.) |
| `supplier` | TEXT | Where purchased from |
| `invoiceNumber` | TEXT | Invoice/order reference |
| `warrantyExpiry` | TEXT | Warranty expiration date |
| `condition` | TEXT | Item condition |
| `notes` | TEXT | Additional notes |

**Status Values:**
- `I Have` - Currently owned
- `I Need` - Required for projects
- `I Want` - Wishlist items
- `I Salvaged` - Recovered from old projects
- `I Returned` - Returned to supplier
- `Discarded` - No longer usable
- `Given Away` - Donated or given away

**Indexes:**
```sql
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_location ON inventory_items(location);
```

### ai_insights

Stores AI-generated insights and analysis for inventory items.

```sql
CREATE TABLE ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemId TEXT NOT NULL,
  detailedDescription TEXT NOT NULL,
  projectIdeas TEXT NOT NULL, -- JSON array
  FOREIGN KEY (itemId) REFERENCES inventory_items (id) ON DELETE CASCADE
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Auto-incrementing primary key |
| `itemId` | TEXT | Reference to inventory item |
| `detailedDescription` | TEXT | AI-generated detailed description |
| `projectIdeas` | TEXT | JSON array of project suggestions |

### market_data

Stores current market pricing and supplier information.

```sql
CREATE TABLE market_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemId TEXT NOT NULL,
  supplier TEXT NOT NULL,
  price TEXT NOT NULL,
  link TEXT NOT NULL,
  FOREIGN KEY (itemId) REFERENCES inventory_items (id) ON DELETE CASCADE
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Auto-incrementing primary key |
| `itemId` | TEXT | Reference to inventory item |
| `supplier` | TEXT | Supplier name (Amazon, Adafruit, etc.) |
| `price` | TEXT | Current price as string |
| `link` | TEXT | URL to product page |

## Relationship Tables

### component_relationships

Defines relationships between inventory components.

```sql
CREATE TABLE component_relationships (
  id TEXT PRIMARY KEY,
  componentId TEXT NOT NULL,
  relatedComponentId TEXT NOT NULL,
  relationshipType TEXT NOT NULL,
  description TEXT,
  isRequired INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE,
  FOREIGN KEY (relatedComponentId) REFERENCES inventory_items (id) ON DELETE CASCADE
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Unique relationship identifier |
| `componentId` | TEXT | Primary component ID |
| `relatedComponentId` | TEXT | Related component ID |
| `relationshipType` | TEXT | Type of relationship |
| `description` | TEXT | Relationship description |
| `isRequired` | INTEGER | 1 if required, 0 if optional |
| `createdAt` | TEXT | Creation timestamp |

**Relationship Types:**
- `requires` - Component A needs Component B
- `compatible_with` - Components work well together
- `enhances` - Component B improves Component A
- `part_of` - Component A is part of Component B
- `contains` - Component A contains Component B

**Indexes:**
```sql
CREATE INDEX idx_component_relationships ON component_relationships(componentId);
CREATE INDEX idx_related_components ON component_relationships(relatedComponentId);
```

### component_bundles

Groups related components into logical bundles.

```sql
CREATE TABLE component_bundles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  bundleType TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Unique bundle identifier |
| `name` | TEXT | Bundle name |
| `description` | TEXT | Bundle description |
| `bundleType` | TEXT | Type of bundle |
| `createdAt` | TEXT | Creation timestamp |

**Bundle Types:**
- `kit` - Complete starter or project kits
- `combo` - Components that work well together
- `system` - Complete functional systems

### bundle_components

Junction table linking bundles to their components.

```sql
CREATE TABLE bundle_components (
  bundleId TEXT NOT NULL,
  componentId TEXT NOT NULL,
  PRIMARY KEY (bundleId, componentId),
  FOREIGN KEY (bundleId) REFERENCES component_bundles (id) ON DELETE CASCADE,
  FOREIGN KEY (componentId) REFERENCES inventory_items (id) ON DELETE CASCADE
);
```

**Indexes:**
```sql
CREATE INDEX idx_bundle_components ON bundle_components(bundleId);
```

## Chat and Conversation Tables

### chat_conversations

Stores AI chat conversation metadata.

```sql
CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  isActive INTEGER DEFAULT 0,
  summary TEXT,
  messageCount INTEGER DEFAULT 0
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Unique conversation identifier |
| `title` | TEXT | Conversation title |
| `createdAt` | TEXT | Creation timestamp |
| `updatedAt` | TEXT | Last update timestamp |
| `isActive` | INTEGER | 1 if currently active |
| `summary` | TEXT | Conversation summary |
| `messageCount` | INTEGER | Number of messages |

### chat_messages

Stores individual chat messages.

```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  groundingChunks TEXT, -- JSON array
  suggestedProject TEXT, -- JSON object
  FOREIGN KEY (conversationId) REFERENCES chat_conversations (id) ON DELETE CASCADE
);
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Unique message identifier |
| `conversationId` | TEXT | Reference to conversation |
| `role` | TEXT | 'user' or 'model' |
| `content` | TEXT | Message content |
| `createdAt` | TEXT | Creation timestamp |
| `groundingChunks` | TEXT | JSON array of grounding data |
| `suggestedProject` | TEXT | JSON object for project suggestions |

**Indexes:**
```sql
CREATE INDEX idx_chat_conversation ON chat_messages(conversationId);
CREATE INDEX idx_chat_created ON chat_messages(createdAt);
CREATE INDEX idx_conversation_updated ON chat_conversations(updatedAt);
```

## Data Types and Constraints

### Text Fields

**ID Fields:**
- Format: ISO timestamp (e.g., `2024-01-15T10:30:00.000Z`)
- Generated automatically on creation
- Unique across all records

**Date Fields:**
- Format: ISO 8601 strings
- UTC timezone preferred
- Nullable for optional dates

**JSON Fields:**
- Stored as TEXT with JSON content
- Parsed/stringified by application layer
- Used for complex data structures

### Numeric Fields

**Quantities:**
- INTEGER type for whole numbers
- Non-negative values enforced by application
- Default value of 0 where appropriate

**Prices:**
- REAL type for decimal values
- Stored in original currency
- Currency code stored separately

### Boolean Fields

**SQLite Boolean Representation:**
- INTEGER type (0 = false, 1 = true)
- Default values specified in schema
- Application layer handles conversion

## Relationships and Constraints

### Foreign Key Relationships

```sql
-- AI insights linked to inventory items
ai_insights.itemId → inventory_items.id

-- Market data linked to inventory items  
market_data.itemId → inventory_items.id

-- Component relationships
component_relationships.componentId → inventory_items.id
component_relationships.relatedComponentId → inventory_items.id

-- Bundle relationships
bundle_components.bundleId → component_bundles.id
bundle_components.componentId → inventory_items.id

-- Chat relationships
chat_messages.conversationId → chat_conversations.id
```

### Cascade Behaviors

**ON DELETE CASCADE:**
- Deleting inventory item removes related insights, market data, and relationships
- Deleting bundle removes all component associations
- Deleting conversation removes all messages

## Database Migrations

### Automatic Migration System

The application includes automatic migration support:

```javascript
// Migration example
private migrateDatabase() {
  try {
    const columns = [
      'serialNumber TEXT',
      'modelNumber TEXT', 
      'manufacturer TEXT',
      // ... more columns
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
```

### Version History

**v1.0 - Initial Schema:**
- Basic inventory_items table
- AI insights and market data tables
- Chat conversation system

**v2.0 - Component Relationships:**
- Added component_relationships table
- Added component_bundles and bundle_components tables
- Enhanced relationship tracking

**v3.0 - Enhanced Tracking:**
- Added purchase tracking fields to inventory_items
- Added warranty and condition tracking
- Enhanced supplier and pricing information

## Performance Considerations

### Indexing Strategy

**Primary Indexes:**
- All tables have appropriate primary keys
- Foreign key columns are indexed
- Common query patterns are optimized

**Query Optimization:**
```sql
-- Efficient status filtering
SELECT * FROM inventory_items WHERE status = 'I Have';

-- Category-based searches
SELECT * FROM inventory_items WHERE category = 'Sensor';

-- Text searches (consider FTS for large datasets)
SELECT * FROM inventory_items WHERE name LIKE '%ESP32%';
```

### Database Size Management

**Growth Patterns:**
- Inventory items: Linear growth with collection size
- Chat messages: Can grow rapidly with heavy AI usage
- Market data: Periodic updates, manageable size

**Maintenance Operations:**
```sql
-- Vacuum database to reclaim space
VACUUM;

-- Analyze tables for query optimization
ANALYZE;

-- Check database integrity
PRAGMA integrity_check;
```

## Backup and Recovery

### Backup Strategies

**File-based Backup:**
```bash
# Simple file copy
cp inventory.db backup-$(date +%Y-%m-%d).db

# SQLite backup command
sqlite3 inventory.db ".backup backup.db"
```

**SQL Dump Backup:**
```bash
# Create SQL dump
sqlite3 inventory.db .dump > backup.sql

# Restore from SQL dump
sqlite3 new_inventory.db < backup.sql
```

### Recovery Procedures

**Corruption Recovery:**
```sql
-- Check for corruption
PRAGMA integrity_check;

-- Attempt repair
PRAGMA quick_check;

-- Export/import if needed
.output backup.sql
.dump
.quit
```

## Development and Testing

### Schema Validation

```javascript
// Validate schema integrity
const validateSchema = () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const expectedTables = ['inventory_items', 'ai_insights', 'market_data', ...];
  
  return expectedTables.every(table => 
    tables.some(t => t.name === table)
  );
};
```

### Test Data Generation

```sql
-- Insert test data
INSERT INTO inventory_items (id, name, quantity, location, status, createdAt)
VALUES 
  ('test-1', 'Test Arduino', 1, 'Test Location', 'I Have', datetime('now')),
  ('test-2', 'Test Sensor', 5, 'Test Drawer', 'I Need', datetime('now'));
```

---

**[← Back: API Reference](./api-reference.md)** | **[Documentation Home](./README.md)** | **[Next: Best Practices →](./best-practices.md)**