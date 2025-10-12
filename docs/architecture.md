# Architecture Overview

Technical architecture and design decisions behind IoT Inventory Oracle, including system components, data flow, and technology choices.

## System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │  SQLite Database│
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Storage)     │
│  Port 3000      │    │  Port 3001      │    │  inventory.db   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Browser APIs   │    │  External APIs  │    │  File System    │
│  - LocalStorage │    │  - Gemini AI    │    │  - Projects/    │
│  - IndexedDB    │    │  - GitHub API   │    │  - Backups/     │
│  - WebSockets   │    │  - Home Assist. │    │  - Logs/        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

**Frontend (React SPA):**
- Modern React 19 with TypeScript
- Tailwind CSS for styling
- Context API for state management
- Vite for build tooling and development

**Backend (Express API):**
- RESTful API with Express.js
- SQLite database with better-sqlite3
- File-based project storage (Markdown)
- AI integration with Google Gemini

**Data Layer:**
- SQLite for structured inventory data
- Markdown files for project documentation
- JSON for configuration and exports
- File system for media and backups

## Technology Stack

### Frontend Technologies

**Core Framework:**
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0"
}
```

**Styling and UI:**
```json
{
  "tailwindcss": "^4.1.14",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6"
}
```

**Development Tools:**
```json
{
  "@vitejs/plugin-react": "^5.0.0",
  "@types/react": "^18.x.x",
  "@types/react-dom": "^18.x.x"
}
```

### Backend Technologies

**Core Server:**
```json
{
  "express": "^5.1.0",
  "cors": "^2.8.5",
  "better-sqlite3": "^12.4.1"
}
```

**AI and External APIs:**
```json
{
  "@google/genai": "^1.22.0",
  "gray-matter": "^4.0.3"
}
```

**Development and Build:**
```json
{
  "tsx": "^4.20.6",
  "concurrently": "^9.2.1",
  "@types/express": "^5.0.3"
}
```

## Data Architecture

### Database Design

**Entity Relationship Diagram:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ inventory_items │    │   ai_insights   │    │  market_data    │
│                 │    │                 │    │                 │
│ • id (PK)       │◄──►│ • itemId (FK)   │    │ • itemId (FK)   │
│ • name          │    │ • description   │    │ • supplier      │
│ • quantity      │    │ • projectIdeas  │    │ • price         │
│ • location      │    └─────────────────┘    │ • link          │
│ • status        │                           └─────────────────┘
│ • category      │    ┌─────────────────┐
│ • serialNumber  │    │component_       │
│ • manufacturer  │    │relationships    │
│ • purchasePrice │    │                 │
│ • supplier      │◄──►│ • componentId   │
│ • warrantyExpiry│    │ • relatedId     │
└─────────────────┘    │ • type          │
                       │ • description   │
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│component_bundles│    │bundle_components│    │chat_conversations│
│                 │    │                 │    │                 │
│ • id (PK)       │◄──►│ • bundleId (FK) │    │ • id (PK)       │
│ • name          │    │ • componentId   │    │ • title         │
│ • description   │    └─────────────────┘    │ • isActive      │
│ • bundleType    │                           │ • messageCount  │
│ • createdAt     │    ┌─────────────────┐    └─────────────────┘
└─────────────────┘    │ chat_messages   │             │
                       │                 │             │
                       │ • id (PK)       │◄────────────┘
                       │ • conversationId│
                       │ • role          │
                       │ • content       │
                       │ • groundingData │
                       └─────────────────┘
```

### File System Structure

**Project Structure:**
```
IoT-Inventory-Oracle/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── services/          # API and external services
│   └── types.ts           # TypeScript type definitions
├── server/                # Express backend
│   └── api.ts            # Main API server
├── services/             # Shared services
│   ├── databaseService.ts # Database operations
│   ├── projectService.ts  # Project management
│   └── chatService.ts     # Chat and AI services
├── projects/             # Project files (Markdown)
├── docs/                 # Documentation
├── scripts/              # CLI tools and utilities
├── inventory.db          # SQLite database
└── .env                  # Environment configuration
```

**Runtime Data Structure:**
```
Application Data/
├── inventory.db          # Main database
├── projects/            # Project documentation
│   ├── project-1.md     # Individual project files
│   ├── project-2.md
│   └── ...
├── backups/             # Database backups
│   ├── daily-2024-01-15.db
│   ├── weekly-2024-W03.db
│   └── ...
├── uploads/             # User uploaded files
│   ├── images/          # Component and project images
│   └── documents/       # Datasheets and manuals
└── logs/               # Application logs
    ├── api.log         # API server logs
    ├── error.log       # Error logs
    └── access.log      # Access logs
```

## API Architecture

### RESTful Design

**Resource-Based URLs:**
```
/api/inventory              # Inventory collection
/api/inventory/{id}         # Individual inventory item
/api/inventory/search/{q}   # Search inventory
/api/inventory/stats        # Inventory statistics

/api/projects              # Project collection
/api/projects/{id}         # Individual project
/api/projects/search/{q}   # Search projects
/api/projects/stats        # Project statistics

/api/chat/conversations    # Chat conversations
/api/chat/conversations/{id}/messages  # Conversation messages

/api/bundles              # Component bundles
/api/inventory/{id}/relationships  # Component relationships
```

**HTTP Methods:**
```
GET    /api/inventory      # List all items
POST   /api/inventory      # Create new item
GET    /api/inventory/{id} # Get specific item
PUT    /api/inventory/{id} # Update item
DELETE /api/inventory/{id} # Delete item
```

**Response Format:**
```json
{
  "data": { ... },          # Response payload
  "status": "success",      # Status indicator
  "timestamp": "2024-01-15T10:30:00Z",
  "meta": {                 # Optional metadata
    "total": 127,
    "page": 1,
    "limit": 50
  }
}
```

### Error Handling

**Error Response Format:**
```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Inventory item with ID 'invalid-id' not found",
    "details": {
      "requestId": "req-123",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  },
  "status": "error"
}
```

**Error Categories:**
- **4xx Client Errors**: Invalid requests, missing data
- **5xx Server Errors**: Database issues, external API failures
- **Custom Codes**: Application-specific error conditions

## State Management

### Frontend State Architecture

**React Context Structure:**
```typescript
// Global application state
interface AppState {
  inventory: InventoryItem[];
  projects: Project[];
  user: UserSettings;
  ui: UIState;
}

// Context providers
<InventoryProvider>
  <ProjectProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ProjectProvider>
</InventoryProvider>
```

**State Flow:**
```
User Action → Component → Context → API Call → Database → Response → Context → Component → UI Update
```

**Local State Management:**
- Component-level state for UI interactions
- Context for shared application state
- LocalStorage for user preferences
- SessionStorage for temporary data

### Backend State Management

**Stateless API Design:**
- Each request is independent
- No server-side session storage
- Database provides persistent state
- Caching for performance optimization

**Database Transactions:**
```javascript
// Atomic operations for data consistency
const transaction = db.transaction((items) => {
  for (const item of items) {
    insertItem(item);
    updateInventory(item);
    logActivity(item);
  }
});
```

## AI Integration Architecture

### Gemini AI Integration

**Service Layer:**
```typescript
interface AIService {
  generateResponse(prompt: string, context: Context): Promise<Response>;
  analyzeComponent(component: string): Promise<Analysis>;
  suggestProjects(inventory: Item[]): Promise<Project[]>;
  extractComponents(text: string): Promise<Component[]>;
}
```

**AI Processing Pipeline:**
```
User Input → Context Building → Prompt Engineering → Gemini API → Response Processing → JSON Extraction → Auto-Population
```

**Context Management:**
```typescript
interface AIContext {
  inventory: InventoryItem[];
  projects: Project[];
  conversationHistory: Message[];
  userPreferences: Settings;
  recentActivity: Activity[];
}
```

### Auto-Population System

**JSON Block Processing:**
```typescript
// Extract structured data from AI responses
const extractJSONBlocks = (response: string) => {
  const patterns = {
    suggestions: /\/\/\/ SUGGESTIONS_JSON_START \/\/\/(.*?)\/\/\/ SUGGESTIONS_JSON_END \/\/\//s,
    projects: /\/\/\/ PROJECT_JSON_START \/\/\/(.*?)\/\/\/ PROJECT_JSON_END \/\/\//s,
    relationships: /\/\/\/ COMPONENT_RELATIONSHIP_JSON_START \/\/\/(.*?)\/\/\/ COMPONENT_RELATIONSHIP_JSON_END \/\/\//s
  };
  
  return Object.entries(patterns).reduce((blocks, [type, pattern]) => {
    const match = response.match(pattern);
    if (match) {
      blocks[type] = JSON.parse(match[1].trim());
    }
    return blocks;
  }, {});
};
```

## Security Architecture

### Data Security

**Database Security:**
- File-based SQLite with proper permissions
- Foreign key constraints for data integrity
- Prepared statements to prevent SQL injection
- Regular backups with integrity checks

**API Security:**
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Rate limiting for API endpoints
- Error handling without information leakage

**Environment Security:**
```bash
# Secure environment variables
VITE_API_KEY=***hidden***
VITE_HOME_ASSISTANT_TOKEN=***hidden***

# File permissions
chmod 600 .env
chmod 644 inventory.db
chmod 755 projects/
```

### Network Security

**HTTPS Configuration:**
```javascript
// Production HTTPS setup
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

**CORS Policy:**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Performance Architecture

### Frontend Performance

**Code Splitting:**
```typescript
// Lazy loading for better performance
const ChatView = lazy(() => import('./components/ChatView'));
const ProjectsView = lazy(() => import('./components/ProjectsView'));

// Route-based code splitting
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/chat" element={<ChatView />} />
    <Route path="/projects" element={<ProjectsView />} />
  </Routes>
</Suspense>
```

**Optimization Strategies:**
- Virtual scrolling for large lists
- Debounced search inputs
- Memoized expensive calculations
- Optimized re-renders with React.memo

### Backend Performance

**Database Optimization:**
```sql
-- Indexes for common queries
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_chat_conversation ON chat_messages(conversationId);

-- Query optimization
EXPLAIN QUERY PLAN SELECT * FROM inventory_items WHERE status = 'I Have';
```

**Caching Strategy:**
```javascript
// In-memory caching for frequent queries
const cache = new Map();

const getCachedInventoryStats = () => {
  const key = 'inventory_stats';
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const stats = calculateInventoryStats();
  cache.set(key, stats);
  setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5 min TTL
  
  return stats;
};
```

## Deployment Architecture

### Development Environment

**Local Development:**
```bash
# Development stack
npm run dev:full    # Starts both frontend and backend
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: ./inventory.db
```

**Development Tools:**
- Hot module replacement (HMR)
- TypeScript compilation
- ESLint and Prettier
- Automated testing

### Production Deployment

**Build Process:**
```bash
# Production build
npm run build       # Build React app
npm run server      # Start production API server

# Static files served from dist/
# API server on configured port
# Database with production optimizations
```

**Deployment Options:**

**Option 1: Traditional Server**
```bash
# Server deployment
git clone repo
npm install --production
npm run build
pm2 start server/api.js
nginx reverse proxy configuration
```

**Option 2: Docker Container**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000 3001
CMD ["npm", "run", "start"]
```

**Option 3: Static + Serverless**
```yaml
# Vercel deployment
build:
  command: npm run build
  output: dist/
functions:
  - server/api.ts
environment:
  - VITE_API_KEY
```

## Scalability Considerations

### Horizontal Scaling

**Database Scaling:**
- SQLite limitations for concurrent writes
- Consider PostgreSQL for multi-user scenarios
- Read replicas for query performance
- Sharding strategies for large datasets

**API Scaling:**
- Stateless design enables load balancing
- Microservices architecture for complex features
- Caching layers (Redis) for session data
- CDN for static asset delivery

### Vertical Scaling

**Performance Optimization:**
- Database query optimization
- Memory usage monitoring
- CPU-intensive task optimization
- Storage I/O optimization

**Resource Management:**
```javascript
// Memory monitoring
process.on('memoryUsage', () => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected');
    // Trigger garbage collection or cleanup
  }
});
```

## Future Architecture Considerations

### Planned Enhancements

**Multi-User Support:**
- User authentication and authorization
- Role-based access control
- Shared inventories and projects
- Real-time collaboration features

**Advanced AI Features:**
- Custom AI model training
- Image recognition for components
- Predictive analytics
- Natural language query processing

**Integration Expansion:**
- Additional smart home platforms
- E-commerce API integrations
- CAD software integration
- IoT device management

**Mobile Applications:**
- React Native mobile app
- Offline synchronization
- Camera-based component scanning
- Push notifications

---

**[← Back: Examples](./examples.md)** | **[Documentation Home](./README.md)** | **[Next: Contributing →](./contributing.md)**