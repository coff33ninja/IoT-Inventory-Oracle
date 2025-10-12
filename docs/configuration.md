# Configuration Guide

Configure IoT Inventory Oracle for your specific needs with environment variables, settings, and integrations.

## Environment Variables

### Required Configuration

Create a `.env` file in the root directory:

```env
# Google Gemini API Key (Required)
VITE_API_KEY=your_actual_gemini_api_key_here
```

### Optional Configuration

```env
# Home Assistant Integration
VITE_HOME_ASSISTANT_URL=http://your-home-assistant-ip:8123
VITE_HOME_ASSISTANT_TOKEN=your_long_lived_access_token_here

# Debug Settings
VITE_DEBUG=true

# Custom API Endpoints (Advanced)
VITE_API_BASE_URL=http://localhost:3001
VITE_CUSTOM_MODEL=gemini-2.5-flash
```

## Application Settings

### AI Assistant Configuration

**Auto-Population Settings:**
- **Enable Auto-Population**: Automatically execute AI suggestions
- **Confirmation Mode**: Review changes before applying
- **Context Memory**: How long AI remembers conversation context

**AI Behavior:**
- **Response Style**: Technical vs. Conversational
- **Suggestion Aggressiveness**: Conservative vs. Proactive
- **Code Generation**: Include comments and explanations

### Inventory Settings

**Default Values:**
- **Default Location**: Where new items are placed
- **Default Status**: Status for manually added items
- **Currency**: Default currency for prices (USD, EUR, GBP, etc.)

**Display Options:**
- **Items Per Page**: Number of items shown in lists
- **Sort Order**: Default sorting (Name, Date, Category)
- **Show Descriptions**: Display item descriptions in lists

### Project Settings

**Workflow Configuration:**
- **Default Status**: Starting status for new projects
- **Progress Tracking**: Enable/disable progress percentages
- **Sub-Project Creation**: Automatic vs. manual sub-project creation

## Database Configuration

### SQLite Settings

The application uses SQLite with these default settings:

```javascript
// Database configuration
{
  filename: 'inventory.db',
  options: {
    verbose: console.log, // Enable in debug mode
    fileMustExist: false,
    timeout: 5000
  }
}
```

### Backup Configuration

**Automatic Backups:**
- **Frequency**: Daily, Weekly, or Manual
- **Retention**: Number of backups to keep
- **Location**: Local directory or cloud storage

**Manual Backup Commands:**
```bash
# Create backup
npm run cli backup backup-$(date +%Y-%m-%d).db

# Restore from backup
npm run cli restore backup-2024-01-15.db
```

## Integration Settings

### Home Assistant

**Setup Steps:**
1. Generate Long-Lived Access Token in Home Assistant
2. Add URL and token to `.env` file or Settings UI
3. Test connection in Settings → Integrations

**Configuration Options:**
- **Entity Filtering**: Which entities to sync
- **Update Frequency**: How often to refresh data
- **Auto-Linking**: Automatically link entities to inventory items

### GitHub Integration

**Repository Analysis:**
- **Auto-Sync**: Automatically update project components
- **File Patterns**: Which files to analyze for components
- **Component Extraction**: How to identify hardware requirements

## Performance Settings

### Client-Side Configuration

**Memory Management:**
- **Cache Size**: How much data to cache locally
- **Lazy Loading**: Load data as needed vs. preload
- **Background Sync**: Sync data in background

**UI Performance:**
- **Animation Settings**: Enable/disable animations
- **Virtualization**: For large lists and tables
- **Debounce Delays**: Search and input delays

### Server-Side Configuration

**API Settings:**
```javascript
// server/config.js
{
  port: 3001,
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  }
}
```

## Security Configuration

### API Security

**Rate Limiting:**
- **Requests per minute**: Prevent API abuse
- **IP Whitelisting**: Restrict access to specific IPs
- **API Key Rotation**: Regular key updates

**Data Protection:**
- **Encryption at Rest**: Encrypt sensitive data
- **Secure Headers**: HTTPS, CSP, HSTS
- **Input Validation**: Sanitize all inputs

### Access Control

**User Management:**
- **Authentication**: Local vs. OAuth
- **Authorization**: Role-based permissions
- **Session Management**: Timeout and security

## Development Configuration

### Development Mode

```env
# Development settings
NODE_ENV=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

**Features Enabled:**
- Detailed error messages
- Debug logging
- Hot module replacement
- Source maps

### Production Configuration

```env
# Production settings
NODE_ENV=production
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

**Optimizations:**
- Minified code
- Compressed assets
- Error reporting
- Performance monitoring

## Deployment Configuration

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000 3001
CMD ["npm", "run", "start"]
```

### Environment-Specific Settings

**Development:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_DEBUG=true
```

**Staging:**
```env
VITE_API_BASE_URL=https://staging-api.example.com
VITE_DEBUG=false
```

**Production:**
```env
VITE_API_BASE_URL=https://api.example.com
VITE_DEBUG=false
VITE_SENTRY_DSN=your_sentry_dsn
```

## Troubleshooting Configuration

### Common Configuration Issues

**API Key Problems:**
- Verify key is correctly set in `.env`
- Check for extra spaces or quotes
- Ensure key has proper permissions

**Database Issues:**
- Check file permissions on `inventory.db`
- Verify SQLite is properly installed
- Check disk space for database growth

**Network Configuration:**
- Verify ports 3000 and 3001 are available
- Check firewall settings
- Ensure CORS is properly configured

### Configuration Validation

```bash
# Validate configuration
npm run cli validate-config

# Test API connection
npm run cli test-api

# Check database integrity
npm run cli check-db
```

## Advanced Configuration

### Custom Themes

```css
/* custom-theme.css */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  --accent-color: #your-color;
}
```

### Plugin System

```javascript
// plugins/custom-plugin.js
export default {
  name: 'CustomPlugin',
  version: '1.0.0',
  init: (app) => {
    // Plugin initialization
  }
}
```

### Custom AI Prompts

```javascript
// config/ai-prompts.js
export const customPrompts = {
  inventoryAnalysis: "Analyze my inventory and suggest...",
  projectPlanning: "Help me plan a project with...",
  componentSourcing: "Find the best suppliers for..."
}
```

---

**[← Back: Installation](./installation.md)** | **[Documentation Home](./README.md)** | **[Next: User Guide →](./user-guide.md)**