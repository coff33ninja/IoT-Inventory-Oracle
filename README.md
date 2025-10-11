# IoT Inventory Oracle 🚀

A comprehensive inventory management system for IoT makers and electronics enthusiasts, powered by advanced AI assistance and smart project management capabilities.

## ✨ Latest Features (v2.0)

### 🧠 Enhanced AI Context Management
- **Persistent Memory**: AI remembers your projects and components across conversations
- **Cross-Project Operations**: Move components between projects with one-click
- **Smart Suggestions**: AI analyzes compatibility and suggests optimal component allocation
- **Context-Aware Recommendations**: Maintains conversation continuity for better assistance

### 📊 Analytics Dashboard
- **Inventory Insights**: Total value, utilization rates, and category breakdowns
- **Project Readiness**: See which projects are ready to build vs missing components
- **Smart Alerts**: Low stock warnings and duplicate component detection
- **Visual Analytics**: Charts and metrics for better inventory management

### 📋 Project Templates System
- **Pre-built Templates**: Smart home, weather station, security systems, and more
- **Difficulty Ratings**: Beginner, Intermediate, and Advanced project classifications
- **Component Matching**: AI suggests templates based on your available components
- **Guided Instructions**: Step-by-step build guides with code snippets

### 🔍 Smart Search & Discovery
- **Universal Search**: Find components, projects, and categories instantly
- **Intelligent Filtering**: Search by name, category, description, or project usage
- **Quick Navigation**: Jump directly to items or projects from search results

---

A smart inventory management application for IoT projects, powered by Google's Gemini API. Track components you have, need, or want, and chat with an AI assistant to plan projects, find parts, and get coding support.

![IoT Inventory Oracle Screenshot](https://storage.googleapis.com/aistudio-ux-team-public/sdk-pro-samples/iot-oracle-screenshot.png)

## ✨ Core Features

### 🎯 Smart Inventory Management
*   **Detailed Component Tracking**: Record electronic components with status tracking (Have, Need, Want, Salvaged, etc.)
*   **AI-Enhanced Cataloging**: Auto-generate descriptions and suggest categories for new components
*   **Advanced Analytics**: View inventory value, utilization rates, and component distribution
*   **Smart Alerts**: Get notified about low stock items and potential duplicates

### 🤖 AI-Powered Assistant
*   **Persistent Context**: AI remembers your projects and components across conversations
*   **Project Suggestions**: Get project ideas based on your available components
*   **Cross-Project Management**: Move components between projects with AI guidance
*   **Component Analysis**: Compatibility checking and optimization suggestions
*   **Code Generation**: Complete Arduino/ESP32/Raspberry Pi code with explanations
*   **Real-time Sourcing**: Find components online with pricing from multiple suppliers

### 📋 Advanced Project Management
*   **Project Templates**: Pre-built templates for common IoT projects (Smart Home, Weather Station, etc.)
*   **GitHub Integration**: Import component lists from public repositories automatically
*   **Readiness Analysis**: See which projects are ready to build vs missing components
*   **Interactive Operations**: One-click component moves and inventory transfers
*   **AI Kickstart**: Get detailed build plans, circuit diagrams, and starter code

### 🏠 Home Assistant Integration
*   **Entity Linking**: Connect HA entities to physical components in your inventory
*   **Bridge Digital & Physical**: Understand the hardware behind your smart home setup
*   **Real-time Monitoring**: View your Home Assistant entities alongside component data

### 📊 Analytics & Insights
*   **Inventory Dashboard**: Comprehensive analytics with visual charts and metrics
*   **Project Readiness**: Track which projects can be built immediately
*   **Cost Analysis**: Monitor total inventory value and spending by category
*   **Utilization Tracking**: See how well you're using your component collection

## 🚀 Tech Stack

*   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
*   **AI**: [Google Gemini API (`@google/genai`)](https://ai.google.dev/docs)
*   **Core Libraries**: No bundler! The app uses modern browser features like **ES Modules** and **Import Maps** for a fast, buildless development experience.

## 🛠️ Setup and Running the App

This project is designed to run directly in a modern web browser without a complex build step.

### Prerequisites

1.  A modern web browser that supports ES Modules and Import Maps (e.g., Chrome, Firefox, Edge).
2.  A Google Gemini API Key.

### Configuration

The application requires a Google Gemini API key to function. It is designed to be loaded from a `process.env.API_KEY` environment variable.

For local development or deployment, you need to ensure this variable is available to the application. One common way to do this with a static server is to replace the placeholder at serve time or use a service that allows setting environment variables.

For a quick local test, you could temporarily modify `services/geminiService.ts` (this is **not** recommended for production):

```typescript
// In services/geminiService.ts - FOR LOCAL TESTING ONLY
// Replace this:
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// With this:
const YOUR_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
if (!YOUR_API_KEY) {
  throw new Error("API_KEY not set");
}
const ai = new GoogleGenAI({ apiKey: YOUR_API_KEY });
```

### Running

Simply open the `index.html` file in your web browser. A local web server is recommended to avoid potential issues with file pathing.

## 📖 How to Use

1.  **Inventory View**:
    *   Click the **`+`** button to add a new component. Use the AI features in the modal to auto-generate descriptions and suggest categories.
    *   Click on any item in the table to open the **Component Detail Modal**, which provides AI-powered insights and market data.
    *   Use the tabs (`I Have`, `I Want`, `I Need`, etc.) to filter your view.
    *   To start a project, select checkboxes next to items in the "I Have" tab and click the **"Checkout"** button.

2.  **Projects View**:
    *   Here you'll find all the projects you've created.
    *   **Link GitHub Repo**: Click this to associate a project with a public GitHub repository. The AI can then sync the required components.
    *   **AI Kickstart**: Click this to send the project's component list to the chat assistant, asking for a detailed plan, code, and guidance.

3.  **Home Assistant View**:
    *   First, go to **Settings** and enter your Home Assistant URL and a Long-Lived Access Token.
    *   Once configured, this view will populate with all your HA entities.
    *   Click **"Link to Inventory"** on any entity card to associate it with a specific component from your stock.

4.  **Chat Assistant**:
    *   The heart of the application. Ask it anything!
    *   Examples:
        *   _"What can I build with an ESP32 and a BME280 sensor?"_
        *   _"Find me a supplier for a Raspberry Pi 5."_
        *   _"Write me a simple MicroPython script to read a DHT22 sensor."_
        *   _"I'm starting a new project to monitor my 3D printer. What components will I need?"_

5.  **Settings**:
    *   Configure your Home Assistant connection.
    *   Use the **Import/Export** functions to manage your inventory data.
