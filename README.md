# IoT Inventory Oracle 🚀

A comprehensive inventory management system for IoT makers and electronics enthusiasts, powered by advanced AI assistance and smart project management capabilities.

## ✨ Latest Features (v2.1) - Modern Storage System

### 🗄️ Advanced Data Storage
- **SQLite Database**: Fast, reliable inventory storage with proper indexing and relationships
- **Markdown Projects**: Human-readable project files with rich metadata and documentation
- **File-Based Architecture**: No more localStorage limitations - proper data persistence
- **Data Integrity**: Foreign key constraints and transaction support

### 🛠️ Developer Tools
- **CLI Interface**: Comprehensive command-line tools for power users and automation
- **Database Analytics**: Advanced querying and reporting capabilities
- **Markdown Documentation**: Projects stored as readable markdown files with frontmatter
- **Search Performance**: Indexed database searches across all data

### 📊 Enhanced Analytics
- **Real-time Statistics**: Fast aggregation queries for inventory insights
- **Rich Project Documentation**: Markdown format with code snippets and diagrams
- **Global Search**: Search across inventory and projects simultaneously
- **Status Tracking**: Detailed breakdowns by category, status, and usage

### 🧠 Enhanced AI Context Management
- **Persistent Memory**: AI remembers your projects and components across conversations
- **Cross-Project Operations**: Move components between projects with one-click
- **Smart Suggestions**: AI analyzes compatibility and suggests optimal component allocation
- **Context-Aware Recommendations**: Maintains conversation continuity for better assistance

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

## 🗄️ Storage Architecture

The application uses a modern client-server architecture:

### Server-Side Storage
- **Database**: `inventory.db` (SQLite database) for inventory data
- **Projects**: `projects/` directory with Markdown files
- **Features**: ACID transactions, indexed queries, file-based documentation
- **API**: RESTful endpoints for all data operations

### Client-Side (React App)
- **API Client**: Communicates with server via HTTP requests
- **State Management**: React context with local state
- **Fallback**: localStorage backup when server is unavailable
- **Real-time**: Immediate UI updates with server synchronization

### Data Flow
1. **React App** → API calls → **Express Server** → **Database/Files**
2. **CLI Tools** → Direct access → **Database/Files**
3. **Fallback**: localStorage when server unavailable

## 🛠️ Command Line Interface (CLI)

The application includes powerful CLI tools for direct database management and advanced operations. These tools provide direct access to the SQLite database and markdown files:

### Inventory Management

```bash
# List all inventory items
npm run cli inventory list

# List items by status
npm run cli inventory list "I Have"
npm run cli inventory list "I Want"
npm run cli inventory list "I Need"

# List items by category
npm run cli inventory list "Sensors"
npm run cli inventory list "Core"

# Add new inventory item
npm run cli inventory add <name> <quantity> <location> <status> [category] [description]
# Example:
npm run cli inventory add "ESP32-DevKit" 3 "Electronics-Box" "I Have" "Microcontrollers"

# Search inventory
npm run cli inventory search <query>
# Example:
npm run cli inventory search "ESP32"

# Show inventory statistics
npm run cli inventory stats
```

### Project Management

```bash
# List all projects
npm run cli projects list

# List projects by status
npm run cli projects list "In Progress"
npm run cli projects list "Completed"

# Show detailed project information
npm run cli projects show <project-id>

# Search projects
npm run cli projects search <query>
# Example:
npm run cli projects search "temperature"

# Show project statistics
npm run cli projects stats
```

### Global Operations

```bash
# Search across both inventory and projects
npm run cli search <query>
# Example:
npm run cli search "ESP32"

# Show comprehensive statistics
npm run cli stats
```

### CLI Examples

```bash
# Quick inventory check
npm run cli inventory list "I Have"

# Find all sensor-related items
npm run cli search "sensor"

# Check project status
npm run cli projects list "In Progress"

# Get overview of everything
npm run cli stats

# Add a new component
npm run cli inventory add "Arduino-Nano" 2 "Dev-Board-Box" "I Have" "Microcontrollers"

# Search for specific projects
npm run cli projects search "LED"

# View detailed project info
npm run cli projects show "2025-10-11T23:45:25.501Z"
```

### CLI Tips

- **Status Values**: Use exact status names: "I Have", "I Want", "I Need", "I Salvaged", "I Returned", "Discarded", "Given Away"
- **Quotes**: Use quotes around multi-word arguments: `"I Have"`, `"Test Component"`
- **Project IDs**: Use the full project ID from the list command for detailed views
- **Search**: Search works across names, descriptions, categories, and project components

## 🛠️ Setup and Installation

### Prerequisites

1. **Node.js** (v16 or higher) and **npm** or **yarn**
2. **Modern web browser** with ES Modules support
3. **Google Gemini API Key** - Get yours at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iot-inventory-oracle
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   # Replace 'your_gemini_api_key_here' with your actual API key
   ```

4. **Start both server and client**
   ```bash
   # Start both API server and React app
   npm run dev:full
   
   # Or start them separately:
   npm run server  # API server on http://localhost:3001
   npm run dev     # React app on http://localhost:3000
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

### Architecture
- **API Server**: `http://localhost:3001` - Handles database operations
- **React App**: `http://localhost:3000` - User interface
- **CLI Tools**: Direct database access for advanced operations

### Environment Configuration

The app uses environment variables for configuration. Create a `.env` file in the root directory:

```env
# Required: Google Gemini API Key
VITE_API_KEY=your_actual_gemini_api_key_here

# Optional: Home Assistant integration (can also be set via Settings UI)
VITE_HOME_ASSISTANT_URL=http://your-home-assistant-ip:8123
VITE_HOME_ASSISTANT_TOKEN=your_long_lived_access_token_here
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore` for protection
- Keep your API keys secure and rotate them regularly
- Use different API keys for development and production

### Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env` file

### Deployment

For production deployment:

1. **Build the application**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Set environment variables** in your hosting platform
3. **Deploy the `dist` folder** to your web server

Popular deployment options:
- **Vercel**: Automatic deployments with environment variable support
- **Netlify**: Easy static site hosting with build integration
- **GitHub Pages**: Free hosting for public repositories
- **Self-hosted**: Any web server that can serve static files

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

## 🔧 Troubleshooting

### Common Issues

**"VITE_API_KEY environment variable not set" Error**
- Ensure you've created a `.env` file in the root directory
- Verify your API key is correctly set as `VITE_API_KEY=your_key_here`
- Restart the development server after adding environment variables

**AI Chat Not Working**
- Check that your Gemini API key is valid and has quota remaining
- Verify the API key has the necessary permissions for the Gemini API
- Check browser console for detailed error messages

**Home Assistant Integration Issues**
- Ensure your Home Assistant URL is accessible from your browser
- Verify your Long-Lived Access Token has the required permissions
- Check that CORS is properly configured in Home Assistant if needed

**Development Server Won't Start**
- Ensure Node.js version is 16 or higher: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for port conflicts (default is 3000)

### Getting Help

- Check the browser console for error messages
- Verify all environment variables are properly set
- Ensure your API keys are valid and have sufficient quota
- Try clearing browser cache and localStorage
