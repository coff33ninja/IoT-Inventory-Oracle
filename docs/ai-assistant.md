# AI Assistant Guide

The AI Assistant is the heart of IoT Inventory Oracle, powered by Google Gemini. It understands natural language and can manage your entire inventory and projects through conversation.

## Core Capabilities

### 🗣️ Natural Language Understanding
The AI understands how you naturally talk about electronics and projects:

```
✅ "I just bought an Arduino from Amazon for $25"
✅ "I need components for a temperature monitoring project"
✅ "My ESP32 is broken, mark it as discarded"
✅ "What can I build with these components?"
```

### 🤖 Auto-Population
The AI automatically creates and updates inventory items as you mention them:

- **Purchase Detection**: "I bought 5 LEDs" → Adds 5 LEDs with "I Have" status
- **Need Recognition**: "I need resistors" → Adds resistors with "I Need" status
- **Status Updates**: "My sensor is broken" → Updates status to "Discarded"

## Conversation Examples

### Inventory Management

**Adding Components:**
```
You: "I just received my Adafruit order - 3 ESP32s, 10 sensors, and a power supply"
AI: I've added your components to inventory:
    - 3x ESP32 Development Boards (I Have)
    - 10x Various Sensors (I Have) 
    - 1x Power Supply (I Have)
```

**Purchase Tracking:**
```
You: "I bought an Arduino Uno R3 from Amazon yesterday for $25.99. Serial number ARD123456"
AI: Added Arduino Uno R3 with complete purchase details:
    - Supplier: Amazon
    - Price: $25.99
    - Serial: ARD123456
    - Status: I Have
```

### Project Management

**Project Creation:**
```
You: "Help me plan a smart home temperature monitoring system"
AI: I'll create a comprehensive project for you with:
    - Component list (ESP32, temperature sensors, display)
    - Step-by-step instructions
    - Complete Arduino code
    - Wiring diagrams
```

**Status Updates:**
```
You: "My weather station project is 75% complete"
AI: Updated "Weather Station" project:
    - Progress: 75%
    - Status: In Progress
    - Added completion notes
```

### Technical Assistance

**Code Generation:**
```
You: "Write Arduino code to read a DHT22 sensor"
AI: Here's complete code with explanations:
    - Library includes
    - Pin definitions
    - Setup and loop functions
    - Error handling
```

**Troubleshooting:**
```
You: "My I2C sensor isn't working"
AI: Let's troubleshoot your I2C issue:
    - Check wiring (SDA/SCL pins)
    - Verify pull-up resistors
    - Test with I2C scanner code
    - Common solutions...
```

## Advanced Features

### 🔗 Component Relationships
AI recognizes when components work together:

```
You: "ESP12E with NodeMCU HW-389 shield"
AI: Created separate but linked components:
    - ESP12E Wi-Fi Module (requires shield)
    - NodeMCU HW-389 Shield (compatible with ESP12E)
```

### 📦 Component Bundles
AI groups related components:

```
You: "I have a complete Arduino starter kit"
AI: Created "Arduino Starter Kit" bundle:
    - Arduino Uno
    - Breadboard
    - Jumper wires
    - LEDs and resistors
    - USB cable
```

### 💰 Market Intelligence
AI finds current prices and suppliers:

```
You: "Find me the best price for Raspberry Pi 5"
AI: Current market analysis:
    - Amazon: $75.99 (in stock)
    - Adafruit: $75.00 (backorder)
    - Best Buy: $79.99 (in stock)
```

## JSON Auto-Population

The AI uses structured JSON blocks for automatic actions:

### Component Suggestions
```json
{
  "name": "DHT22 Temperature Sensor",
  "category": "Sensor",
  "status": "I Need",
  "supplier": "Adafruit",
  "price": "$9.95"
}
```

### Project Creation
```json
{
  "projectName": "Smart Weather Station",
  "components": [
    {"name": "ESP32", "quantity": 1},
    {"name": "DHT22 Sensor", "quantity": 1}
  ]
}
```

### Component Relationships
```json
{
  "primaryComponent": {"name": "ESP12E Module"},
  "relatedComponent": {"name": "NodeMCU Shield"},
  "relationshipType": "requires"
}
```

## AI Triggers

The AI automatically responds to these phrases:

### Status Triggers
- **"I Have"**: "I just bought", "I received", "I own"
- **"I Need"**: "I need to buy", "I require", "I must get"
- **"I Want"**: "I'd like to have", "I want to get"
- **"Discarded"**: "It's broken", "It's dead", "It's unusable"

### Action Triggers
- **Project Creation**: "Help me build", "I want to make", "Plan a project"
- **Component Search**: "Find me", "Where can I buy", "What's the price"
- **Code Generation**: "Write code for", "How do I program", "Show me the code"

## Best Practices

### 🎯 Effective Communication
1. **Be Specific**: "ESP32 WROOM-32" vs "microcontroller"
2. **Include Context**: "for my weather station project"
3. **Mention Quantities**: "I bought 5 LEDs" vs "I bought LEDs"
4. **Add Details**: Include prices, suppliers, model numbers

### 🚀 Power User Tips
1. **Batch Operations**: "I got 10 resistors, 5 capacitors, and 3 sensors"
2. **Purchase Details**: Always mention supplier and price for tracking
3. **Project Context**: Reference existing projects for better suggestions
4. **Follow-up Questions**: Ask "What else do I need?" for complete lists

### ⚠️ Common Mistakes
1. **Too Vague**: "I have some components" → Be specific
2. **Missing Context**: "Add LED" → What kind? How many? For what?
3. **Ignoring Suggestions**: AI provides JSON blocks for auto-population
4. **Not Using Natural Language**: Formal commands work less well

## Customization

### Auto-Population Settings
- **Enable/Disable**: Toggle in chat settings
- **Confirmation Mode**: Review before applying changes
- **Selective Auto-Population**: Choose which actions to auto-execute

### AI Behavior
- **Conversation Memory**: AI remembers context across sessions
- **Project Awareness**: AI knows your current projects and components
- **Learning**: AI adapts to your terminology and preferences

## Troubleshooting AI Issues

### AI Not Responding
1. Check your Gemini API key in settings
2. Verify internet connection
3. Check API quota limits
4. Restart the application

### Incorrect Suggestions
1. Be more specific in your requests
2. Provide additional context
3. Correct the AI when it makes mistakes
4. Use follow-up questions for clarification

### Auto-Population Not Working
1. Ensure auto-population is enabled
2. Check for JSON blocks in AI responses
3. Look for error messages in browser console
4. Try rephrasing your request

---

**[← Back: Quick Start](./quick-start.md)** | **[Documentation Home](./README.md)** | **[Next: Inventory Management →](./inventory-management.md)**