# API Reference

Complete reference for the IoT Inventory Oracle REST API. Use these endpoints to integrate with external systems or build custom applications.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API uses local access without authentication. For production deployments, implement proper authentication mechanisms.

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "data": { ... },
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "status": "error",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Inventory Endpoints

### Get All Inventory Items

```http
GET /api/inventory
```

**Response:**
```json
[
  {
    "id": "2024-01-15T10:30:00.000Z",
    "name": "Arduino Uno R3",
    "quantity": 2,
    "location": "Electronics Box",
    "status": "I Have",
    "category": "Development Board",
    "description": "Arduino Uno R3 development board",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "serialNumber": "ARD123456",
    "manufacturer": "Arduino",
    "purchasePrice": 25.99,
    "currency": "USD",
    "supplier": "Amazon"
  }
]
```

### Get Single Inventory Item

```http
GET /api/inventory/{id}
```

**Parameters:**
- `id` (string): Unique item identifier

**Response:**
```json
{
  "id": "2024-01-15T10:30:00.000Z",
  "name": "Arduino Uno R3",
  "quantity": 2,
  "location": "Electronics Box",
  "status": "I Have",
  "category": "Development Board",
  "relatedComponents": [
    {
      "id": "rel-123",
      "relatedComponentId": "comp-456",
      "relatedComponentName": "USB Cable",
      "relationshipType": "requires",
      "description": "Requires USB cable for programming"
    }
  ]
}
```

### Create Inventory Item

```http
POST /api/inventory
```

**Request Body:**
```json
{
  "name": "ESP32 DevKit",
  "quantity": 1,
  "location": "Electronics Drawer",
  "status": "I Have",
  "category": "Microcontroller",
  "description": "ESP32 development board with WiFi and Bluetooth",
  "serialNumber": "ESP123456",
  "modelNumber": "ESP32-WROOM-32",
  "manufacturer": "Espressif",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 12.99,
  "currency": "USD",
  "supplier": "Amazon",
  "condition": "New"
}
```

**Response:**
```json
{
  "id": "2024-01-15T10:35:00.000Z",
  "name": "ESP32 DevKit",
  "quantity": 1,
  "location": "Electronics Drawer",
  "status": "I Have",
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

### Update Inventory Item

```http
PUT /api/inventory/{id}
```

**Request Body:** (same as create, but with id)
```json
{
  "id": "2024-01-15T10:30:00.000Z",
  "name": "Arduino Uno R3",
  "quantity": 3,
  "location": "Electronics Box",
  "status": "I Have"
}
```

### Delete Inventory Item

```http
DELETE /api/inventory/{id}
```

**Response:**
```json
{
  "success": true
}
```

### Search Inventory

```http
GET /api/inventory/search/{query}
```

**Parameters:**
- `query` (string): Search term

**Example:**
```http
GET /api/inventory/search/ESP32
```

### Filter by Status

```http
GET /api/inventory/status/{status}
```

**Parameters:**
- `status` (string): One of "I Have", "I Need", "I Want", etc.

**Example:**
```http
GET /api/inventory/status/I%20Have
```

### Checkout Items

```http
POST /api/inventory/checkout
```

**Request Body:**
```json
{
  "items": [
    {
      "id": "item-id-1",
      "quantity": 2
    },
    {
      "id": "item-id-2", 
      "quantity": 1
    }
  ]
}
```

### Get Inventory Statistics

```http
GET /api/inventory/stats
```

**Response:**
```json
{
  "totalItems": 127,
  "totalQuantity": 1247,
  "statusBreakdown": [
    {
      "status": "I Have",
      "count": 89
    },
    {
      "status": "I Need",
      "count": 23
    }
  ],
  "categoryBreakdown": [
    {
      "category": "Resistor",
      "count": 45
    },
    {
      "category": "Sensor",
      "count": 23
    }
  ]
}
```

## Project Endpoints

### Get All Projects

```http
GET /api/projects
```

**Response:**
```json
[
  {
    "id": "proj-123",
    "name": "Smart Weather Station",
    "description": "IoT weather monitoring system",
    "status": "In Progress",
    "progress": 75,
    "components": [
      {
        "id": "comp-1",
        "name": "ESP32",
        "quantity": 1,
        "source": "inventory"
      }
    ],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z"
  }
]
```

### Get Single Project

```http
GET /api/projects/{id}
```

### Create Project

```http
POST /api/projects
```

**Request Body:**
```json
{
  "name": "LED Controller",
  "description": "RGB LED strip controller with web interface",
  "category": "IoT",
  "difficulty": "Intermediate",
  "estimatedTime": "8 hours",
  "components": [
    {
      "name": "ESP32",
      "quantity": 1,
      "source": "manual"
    },
    {
      "name": "RGB LED Strip",
      "quantity": 1,
      "source": "manual"
    }
  ],
  "status": "Planning"
}
```

### Update Project

```http
PUT /api/projects/{id}
```

### Delete Project

```http
DELETE /api/projects/{id}
```

### Search Projects

```http
GET /api/projects/search/{query}
```

### Update Project Components

```http
PUT /api/projects/{id}/components
```

**Request Body:**
```json
{
  "components": [
    {
      "id": "comp-1",
      "name": "ESP32",
      "quantity": 1,
      "source": "inventory",
      "inventoryItemId": "inv-123"
    }
  ]
}
```

### Get Project Statistics

```http
GET /api/projects/stats
```

**Response:**
```json
{
  "totalProjects": 15,
  "activeProjects": 8,
  "statusBreakdown": [
    {
      "status": "Planning",
      "count": 5
    },
    {
      "status": "In Progress", 
      "count": 3
    },
    {
      "status": "Completed",
      "count": 7
    }
  ]
}
```

## Component Relationship Endpoints

### Add Component Relationship

```http
POST /api/inventory/{id}/relationships
```

**Request Body:**
```json
{
  "relatedComponentId": "comp-456",
  "relationshipType": "requires",
  "description": "ESP12E requires NodeMCU shield for development",
  "isRequired": true
}
```

### Get Component Relationships

```http
GET /api/inventory/{id}/relationships
```

**Response:**
```json
[
  {
    "id": "rel-123",
    "relatedComponentId": "comp-456",
    "relatedComponentName": "NodeMCU Shield",
    "relationshipType": "requires",
    "description": "Required for development and programming",
    "isRequired": true
  }
]
```

### Remove Component Relationship

```http
DELETE /api/relationships/{relationshipId}
```

## Component Bundle Endpoints

### Create Component Bundle

```http
POST /api/bundles
```

**Request Body:**
```json
{
  "name": "Arduino Starter Kit",
  "description": "Complete Arduino development kit for beginners",
  "componentIds": ["comp-1", "comp-2", "comp-3"],
  "bundleType": "kit"
}
```

### Get All Bundles

```http
GET /api/bundles
```

**Response:**
```json
[
  {
    "id": "bundle-123",
    "name": "Arduino Starter Kit",
    "description": "Complete Arduino development kit",
    "bundleType": "kit",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "componentCount": 5
  }
]
```

### Get Bundle Components

```http
GET /api/bundles/{id}/components
```

**Response:**
```json
[
  {
    "id": "comp-1",
    "name": "Arduino Uno",
    "category": "Development Board",
    "status": "I Have"
  },
  {
    "id": "comp-2", 
    "name": "Breadboard",
    "category": "Breadboard/PCB",
    "status": "I Have"
  }
]
```

### Delete Bundle

```http
DELETE /api/bundles/{id}
```

## Chat Conversation Endpoints

### Get All Conversations

```http
GET /api/chat/conversations
```

**Response:**
```json
[
  {
    "id": "conv-123",
    "title": "Project Planning Discussion",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z",
    "isActive": true,
    "messageCount": 12
  }
]
```

### Create New Conversation

```http
POST /api/chat/conversations
```

**Request Body:**
```json
{
  "title": "New Project Discussion"
}
```

### Get Active Conversation

```http
GET /api/chat/conversations/active
```

**Response:**
```json
{
  "activeConversationId": "conv-123"
}
```

### Switch Active Conversation

```http
PUT /api/chat/conversations/{id}/activate
```

### Update Conversation Title

```http
PUT /api/chat/conversations/{id}/title
```

**Request Body:**
```json
{
  "title": "Updated Conversation Title"
}
```

### Delete Conversation

```http
DELETE /api/chat/conversations/{id}
```

### Get Conversation Messages

```http
GET /api/chat/conversations/{id}/messages
```

**Response:**
```json
[
  {
    "id": "msg-123",
    "role": "user",
    "content": "Help me plan a weather station project",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  {
    "id": "msg-124",
    "role": "model", 
    "content": "I'll help you plan a comprehensive weather station...",
    "createdAt": "2024-01-15T10:00:30.000Z",
    "groundingChunks": [],
    "suggestedProject": {
      "projectName": "Smart Weather Station",
      "components": [
        {"name": "ESP32", "quantity": 1}
      ]
    }
  }
]
```

### Add Message to Conversation

```http
POST /api/chat/conversations/{id}/messages
```

**Request Body:**
```json
{
  "role": "user",
  "content": "I need help with my Arduino project"
}
```

### Get Conversation Context

```http
GET /api/chat/conversations/{id}/context
```

**Response:**
```json
{
  "summary": "Discussion about weather station project planning",
  "recentTopics": ["weather station", "ESP32", "sensors"],
  "mentionedComponents": ["ESP32", "BME280", "OLED display"],
  "discussedProjects": ["Smart Weather Station"]
}
```

### Generate Conversation Title

```http
POST /api/chat/conversations/{id}/generate-title
```

**Response:**
```json
{
  "title": "Weather Station Project Planning"
}
```

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

### Custom Error Codes

```json
{
  "error": "ITEM_NOT_FOUND",
  "message": "Inventory item with ID 'invalid-id' not found",
  "status": "error"
}
```

**Common Error Codes:**
- `ITEM_NOT_FOUND` - Inventory item doesn't exist
- `PROJECT_NOT_FOUND` - Project doesn't exist
- `INVALID_STATUS` - Invalid inventory status
- `DATABASE_ERROR` - Database operation failed
- `VALIDATION_ERROR` - Request validation failed

## Rate Limiting

**Current Limits:**
- 100 requests per 15-minute window per IP
- No authentication required for local development
- Production deployments should implement proper rate limiting

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Webhooks (Future Feature)

**Planned Webhook Events:**
- `inventory.item.created`
- `inventory.item.updated`
- `inventory.item.deleted`
- `project.created`
- `project.status.changed`
- `project.completed`

## SDK and Client Libraries

### JavaScript/Node.js

```javascript
// Example client usage
const InventoryAPI = require('iot-inventory-client');

const client = new InventoryAPI({
  baseURL: 'http://localhost:3001/api'
});

// Get all inventory items
const items = await client.inventory.getAll();

// Create new item
const newItem = await client.inventory.create({
  name: 'ESP32',
  quantity: 1,
  location: 'Electronics Box',
  status: 'I Have'
});
```

### Python

```python
# Example Python client
import requests

class InventoryClient:
    def __init__(self, base_url='http://localhost:3001/api'):
        self.base_url = base_url
    
    def get_inventory(self):
        response = requests.get(f'{self.base_url}/inventory')
        return response.json()
    
    def create_item(self, item_data):
        response = requests.post(f'{self.base_url}/inventory', json=item_data)
        return response.json()

# Usage
client = InventoryClient()
items = client.get_inventory()
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
```
http://localhost:3001/api/docs
```

This provides interactive API documentation and testing capabilities.

---

**[← Back: Troubleshooting](./troubleshooting.md)** | **[Documentation Home](./README.md)** | **[Next: Database Schema →](./database-schema.md)**