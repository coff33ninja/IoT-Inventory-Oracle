# IoT Inventory Oracle

A smart inventory management application for IoT projects, powered by Google's Gemini API. Track components you have, need, or want, and chat with an AI assistant to plan projects, find parts, and get coding support.

![IoT Inventory Oracle Screenshot](https://storage.googleapis.com/aistudio-ux-team-public/sdk-pro-samples/iot-oracle-screenshot.png)

## ✨ Key Features

*   **Smart Inventory Management**: Keep a detailed record of your electronic components. Track items you have, need, want, or have salvaged. Organize by custom categories, locations, and purchase sources.
*   **AI-Powered Assistant**: Leverage the power of Gemini to:
    *   Suggest new projects based on the components you already own.
    *   Generate step-by-step project plans, circuit diagrams, and starter code.
    *   Find datasheets and source components online from various suppliers.
    *   Answer technical questions about your parts or code.
*   **Project Tracking**:
    *   Create projects directly from your available inventory.
    *   Link projects to **GitHub repositories** and use AI to automatically parse and import the required bill of materials.
    *   Keep project-specific notes and manage project status.
*   **Component Intelligence**: Go beyond simple tracking. For any component, the AI can generate:
    *   A detailed technical description.
    *   Innovative project ideas.
    *   Real-time market pricing and links from online suppliers, powered by Google Search grounding.
*   **Home Assistant Integration**: Connect to your Home Assistant instance to view your entities and link them to the physical hardware in your inventory, bridging the gap between your smart home and your component stock.
*   **Data Portability**: Easily import and export your entire inventory as a JSON file for backup or migration.

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
