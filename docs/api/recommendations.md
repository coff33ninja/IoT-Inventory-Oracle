# Recommendation API Documentation

This document describes the REST API endpoints for the intelligent component recommendation system.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently, the API does not require authentication. In production, implement proper authentication and authorization.

## Rate Limiting
- **Limit**: 100 requests per minute per IP address
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: When the rate limit resets

## Error Handling
All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "fallback": "Fallback data when applicable"
}
```

## Recommendation Endpoints

### Get Component Alternatives
Get alternative components for a given component.

```http
GET /recommendations/alternatives/:componentId
```

**Parameters:**
- `componentId` (path): ID of the component to find alternatives for

**Query Parameters:**
- `projectId` (optional): Project context for better recommendations
- `projectType` (optional): Type of project (e.g., "IoT", "Robotics")
- `budget` (optional): Budget constraint for alternatives

**Response:**
```json
[
  {
    "componentId": "alt-123",
    "name": "Alternative Component",
    "compatibilityScore": 95,
    "priceComparison": {
      "original": 10.00,
      "alternative": 8.50,
      "savings": 1.50,
      "percentageDifference": -15
    },
    "technicalDifferences": [
      {
        "property": "Operating Voltage",
        "original": "5V",
        "alternative": "3.3V-5V",
        "impact": "positive",
        "description": "Wider voltage range"
      }
    ],
    "usabilityImpact": "minimal",
    "explanation": "This alternative offers better voltage compatibility...",
    "confidence": 0.9,
    "requiredModifications": ["Add voltage divider if using 3.3V logic"]
  }
]
```

### Get Component Predictions
Get stock depletion and usage predictions for a project.

```http
GET /recommendations/predictions/:projectId
```

**Parameters:**
- `projectId` (path): ID of the project

**Response:**
```json
[
  {
    "componentId": "comp-123",
    "predictedNeedDate": "2024-02-15T00:00:00.000Z",
    "confidence": 0.8,
    "quantity": 5,
    "reasoning": "Based on current usage patterns...",
    "basedOnProjects": ["proj-1", "proj-2"],
    "urgency": "medium"
  }
]
```

### Get Project Component Suggestions
Get component suggestions for a new project.

```http
POST /recommendations/project-suggestions
```

**Request Body:**
```json
{
  "projectType": "IoT",
  "userPreferences": {
    "budgetLimits": {
      "enabled": true,
      "maxProjectBudget": 500
    },
    "categoryPreferences": {
      "preferredCategories": ["Sensors", "Microcontrollers"]
    }
  }
}
```

**Response:**
```json
[
  {
    "componentId": "comp-123",
    "name": "ESP32 Development Board",
    "category": "Microcontrollers",
    "quantity": 1,
    "confidence": 0.9,
    "reasoning": "Essential for IoT projects with WiFi connectivity",
    "priority": "high",
    "estimatedCost": 15.99,
    "alternatives": []
  }
]
```

### Analyze Component Compatibility
Analyze compatibility between multiple components.

```http
POST /recommendations/compatibility
```

**Request Body:**
```json
{
  "componentIds": ["comp-1", "comp-2", "comp-3"]
}
```

**Response:**
```json
{
  "overallCompatibility": 85,
  "issues": [
    {
      "type": "voltage",
      "severity": "medium",
      "description": "Voltage mismatch between components",
      "affectedComponents": ["comp-1", "comp-2"],
      "solution": "Add level shifter"
    }
  ],
  "suggestions": [
    {
      "type": "addition",
      "description": "Add pull-up resistors for I2C communication",
      "components": ["comp-2"],
      "estimatedCost": 0.50,
      "difficulty": "easy"
    }
  ],
  "requiredModifications": ["Add level shifter circuit"]
}
```

### Get Personalized Recommendations
Get personalized recommendations for a user.

```http
GET /recommendations/personalized/:userId
```

**Parameters:**
- `userId` (path): ID of the user

**Response:**
```json
[
  {
    "type": "component",
    "itemId": "comp-123",
    "title": "Recommended Sensor Upgrade",
    "description": "Based on your recent projects...",
    "relevanceScore": 0.85,
    "reasoning": "You frequently use temperature sensors...",
    "estimatedCost": 12.99,
    "difficulty": "beginner"
  }
]
```

## Analytics Endpoints

### Get Usage Patterns
Analyze component usage patterns over time.

```http
GET /analytics/usage-patterns?timeframe=30d
```

**Query Parameters:**
- `timeframe`: Time period (7d, 30d, 90d, 1y, all)

**Response:**
```json
{
  "totalProjects": 15,
  "componentUtilization": [
    {
      "componentId": "comp-123",
      "componentName": "ESP32",
      "utilizationRate": 85,
      "totalQuantityUsed": 12,
      "averageProjectsPerMonth": 3,
      "lastUsed": "2024-01-15T00:00:00.000Z"
    }
  ],
  "categoryBreakdown": [
    {
      "category": "Microcontrollers",
      "totalComponents": 5,
      "totalQuantityUsed": 15,
      "averagePrice": 18.50,
      "popularityTrend": "increasing"
    }
  ]
}
```

### Get Stock Prediction
Get stock depletion prediction for a component.

```http
GET /analytics/stock-predictions/:componentId
```

**Response:**
```json
{
  "componentId": "comp-123",
  "currentStock": 8,
  "predictedDepletionDate": "2024-03-15T00:00:00.000Z",
  "recommendedReorderQuantity": 10,
  "confidence": 0.75,
  "consumptionRate": 2.5,
  "factors": ["Seasonal increase", "New project pipeline"]
}
```

### Get Component Popularity
Get component popularity metrics.

```http
GET /analytics/popularity?category=Sensors
```

**Query Parameters:**
- `category` (optional): Filter by component category

**Response:**
```json
[
  {
    "componentId": "comp-123",
    "componentName": "DHT22 Temperature Sensor",
    "popularityScore": 92,
    "usageCount": 45,
    "trendDirection": "up",
    "category": "Sensors"
  }
]
```

### Get Spending Insights
Get spending analysis and insights.

```http
GET /analytics/spending?timeframe=30d
```

**Response:**
```json
{
  "totalSpent": 245.67,
  "spendingByCategory": [
    {
      "category": "Sensors",
      "amount": 89.50,
      "percentage": 36.4
    }
  ],
  "spendingTrend": "increasing",
  "averageProjectCost": 32.75,
  "budgetUtilization": 49.1,
  "costSavingOpportunities": [
    {
      "type": "bulk_purchase",
      "description": "Buy resistors in bulk to save 15%",
      "potentialSavings": 12.50,
      "effort": "low",
      "components": ["resistor-pack"]
    }
  ]
}
```

## Prediction Endpoints

### Predict Project Success
Predict the success probability of a project based on components.

```http
POST /predictions/project-success
```

**Request Body:**
```json
{
  "components": ["comp-1", "comp-2", "comp-3"],
  "projectType": "IoT"
}
```

**Response:**
```json
{
  "successProbability": 0.87,
  "confidence": 0.92,
  "factors": [
    {
      "factor": "Component compatibility",
      "impact": "positive",
      "weight": 0.3
    }
  ],
  "recommendations": [
    "Consider adding pull-up resistors for I2C reliability"
  ]
}
```

### Forecast Component Demand
Forecast future demand for a component.

```http
GET /predictions/demand/:componentId?horizon=30
```

**Query Parameters:**
- `horizon`: Forecast horizon in days (default: 30)

**Response:**
```json
{
  "componentId": "comp-123",
  "predictedDemand": 8,
  "confidence": 0.78,
  "trend": "increasing",
  "seasonalFactors": ["Back-to-school projects"],
  "forecastPeriod": 30
}
```

### Suggest Optimal Quantities
Get optimal quantity suggestions for component ordering.

```http
POST /predictions/optimal-quantities
```

**Request Body:**
```json
{
  "componentId": "comp-123",
  "projectPipeline": [
    {
      "projectId": "proj-1",
      "estimatedStart": "2024-02-01",
      "requiredQuantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "componentId": "comp-123",
  "recommendedQuantity": 12,
  "reasoning": "Based on pipeline projects and buffer stock",
  "costAnalysis": {
    "unitCost": 5.99,
    "totalCost": 71.88,
    "bulkDiscount": 8.5,
    "savings": 6.12
  },
  "riskFactors": ["Supply chain delays", "Price volatility"]
}
```

## User Preferences Endpoints

### Get User Preferences
Get recommendation preferences for a user.

```http
GET /preferences/:userId
```

**Response:**
```json
{
  "budgetLimits": {
    "enabled": true,
    "maxProjectBudget": 500,
    "maxComponentCost": 100,
    "currency": "USD",
    "alertThreshold": 80
  },
  "preferredSuppliers": {
    "suppliers": ["Adafruit", "SparkFun"],
    "avoidSuppliers": ["BadSupplier"],
    "prioritizeLocal": false,
    "maxShippingTime": 14
  },
  "recommendationSettings": {
    "sensitivity": "balanced",
    "frequency": "normal",
    "showAlternatives": true,
    "confidenceThreshold": 70
  }
}
```

### Update User Preferences
Update recommendation preferences for a user.

```http
PUT /preferences/:userId
```

**Request Body:**
```json
{
  "budgetLimits": {
    "enabled": true,
    "maxProjectBudget": 600
  },
  "recommendationSettings": {
    "sensitivity": "aggressive",
    "confidenceThreshold": 60
  }
}
```

## Utility Endpoints

### Update Component Usage
Track component usage for recommendation learning.

```http
POST /recommendations/usage/:componentId
```

**Request Body:**
```json
{
  "projectId": "proj-123",
  "quantity": 2
}
```

### Get System Health
Get recommendation system health and statistics.

```http
GET /recommendations/health
```

**Response:**
```json
{
  "healthy": true,
  "stats": {
    "totalRecommendations": 1250,
    "cacheHitRate": 0.85,
    "averageConfidence": 0.78,
    "errorRate": 0.02
  },
  "errorStats": {
    "totalErrors": 5,
    "errorsByType": {
      "timeout": 2,
      "ai_service": 1,
      "validation": 2
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Batch Get Alternatives
Get alternatives for multiple components in a single request.

```http
POST /recommendations/batch/alternatives
```

**Request Body:**
```json
{
  "componentIds": ["comp-1", "comp-2", "comp-3"],
  "context": {
    "projectType": "IoT",
    "budget": 200
  }
}
```

**Response:**
```json
[
  {
    "componentId": "comp-1",
    "alternatives": [...],
    "error": null
  },
  {
    "componentId": "comp-2",
    "alternatives": [],
    "error": "Component not found"
  }
]
```

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `408 Request Timeout`: Request timed out
- `422 Unprocessable Entity`: Insufficient data for recommendation
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: AI service temporarily unavailable

## Examples

### Getting alternatives for an ESP32 in an IoT project context:
```bash
curl "http://localhost:3001/api/recommendations/alternatives/esp32-123?projectType=IoT&budget=50"
```

### Analyzing compatibility of three components:
```bash
curl -X POST "http://localhost:3001/api/recommendations/compatibility" \
  -H "Content-Type: application/json" \
  -d '{"componentIds": ["esp32-123", "sensor-456", "resistor-789"]}'
```

### Getting personalized recommendations:
```bash
curl "http://localhost:3001/api/recommendations/personalized/user-123"
```

### Updating user preferences:
```bash
curl -X PUT "http://localhost:3001/api/preferences/user-123" \
  -H "Content-Type: application/json" \
  -d '{"budgetLimits": {"enabled": true, "maxProjectBudget": 500}}'
```