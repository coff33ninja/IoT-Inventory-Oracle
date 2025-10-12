# IoT Inventory Oracle 🚀

A comprehensive, AI-powered inventory management system for IoT makers and electronics enthusiasts. Features intelligent project management, conversational AI assistance, and seamless integration between your physical components and digital projects.

## ✨ Latest Features (v3.0) - AI-Powered Project & Inventory Management

### 🤖 Conversational AI Management
- **Natural Language Control**: Manage projects and inventory through chat
  - *"Mark my Arduino project as completed"*
  - *"I just bought 5 ESP32s, put them in my electronics drawer"*
  - *"Set weather station to 75% progress"*
- **Auto-Execution**: AI automatically applies simple updates with confirmation
- **Smart Context**: AI remembers your projects and components across conversations
- **Interactive Actions**: Manual confirmation buttons for complex changes

### 🎯 Advanced Project Management
- **3-Stage Workflow**: Planning → In Progress → Completed
- **Sub-Project Support**: Break complex projects into manageable phases
- **AI-Generated Instructions**: Step-by-step guides with code examples
- **Auto-Save AI Content**: Instructions, insights, and descriptions persist automatically
- **GitHub Integration**: Import component lists from repositories
- **Project Templates**: Pre-built templates for common IoT projects

### 📦 Smart Inventory System
- **7 Status Categories**: I Have, I Need, I Want, I Salvaged, I Returned, Discarded, Given Away
- **AI Categorization**: 25+ specific categories (Resistor, Capacitor, LED, Motor, etc.)
- **Allocation Tracking**: See which components are used in which projects
- **Market Intelligence**: AI-powered price comparison and sourcing
- **Component Analysis**: Compatibility checking and optimization suggestions

### 🎨 Modern User Interface
- **Collapsible Sidebar**: Icon-only mode for more workspace
- **Chat History Sidebar**: Dedicated right panel for conversation management
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Theme**: Professional dark interface optimized for long sessions
- **Interactive Components**: Drag-and-drop, one-click actions, smart forms

### 🗄️ Enterprise-Grade Storage
- **SQLite Database**: Fast, reliable inventory storage with ACID transactions
- **Markdown Projects**: Human-readable project files with rich metadata
- **File-Based Architecture**: No localStorage limitations - proper data persistence
- **CLI Tools**: Command-line interface for power users and automation
- **Data Integrity**: Foreign key constraints and relationship management

![IoT Inventory Oracle Screenshot](https://storage.googleapis.com/aistudio-ux-team-public/sdk-pro-samples/iot-oracle-screenshot.png)

## 🎯 Core Features

### 🤖 Conversational AI Assistant
- **Natural Language Management**: Control projects and inventory through chat
- **Context-Aware Intelligence**: AI remembers your components and projects across sessions
- **Auto-Execution**: Simple updates applied automatically with smart confirmation
- **Interactive Actions**: Manual buttons for complex operations with preview
- **Code Generation**: Complete Arduino/ESP32/Raspberry Pi code with explanations
- **Real-time Sourcing**: Find components online with pricing from multiple suppliers
- **Project Suggestions**: Get project ideas based on your available components

### 📦 Advanced Inventory Management
- **7 Status Categories**: I Have, I Need, I Want, I Salvaged, I Returned, Discarded, Given Away
- **25+ Component Categories**: Resistor, Capacitor, LED, Motor, Sensor, Microcontroller, etc.
- **AI-Enhanced Cataloging**: Auto-generate descriptions and suggest categories
- **Allocation Tracking**: See which components are allocated to which projects
- **Market Intelligence**: AI-powered price comparison and supplier recommendations
- **Smart Analytics**: Inventory value, utilization rates, and distribution insights

### 🎯 Intelligent Project Management
- **3-Stage Workflow**: Planning → In Progress → Completed with progress tracking
- **Sub-Project Support**: Break complex projects into manageable phases with dependencies
- **AI-Generated Content**: Instructions, insights, and enhanced descriptions auto-saved
- **GitHub Integration**: Import component lists from public repositories
- **Project Templates**: Pre-built templates for Smart Home, Weather Station, Security, etc.
- **Readiness Analysis**: See which projects can be built immediately vs missing components
- **Cross-Project Operations**: Move components between projects with AI guidance

### 🏠 Home Assistant Integration
- **Entity Linking**: Connect HA entities to physical components in your inventory
- **Bridge Digital & Physical**: Understand the hardware behind your smart home setup
- **Real-time Monitoring**: View your Home Assistant entities alongside component data
- **Configuration Management**: Track which physical components power your automations

### 🎨 Modern User Experience
- **Collapsible Sidebar**: Icon-only mode for maximum workspace efficiency
- **Chat History Sidebar**: Dedicated right panel for conversation management
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Dark Theme**: Professional interface optimized for extended use
- **Interactive Components**: Drag-and-drop, one-click actions, smart forms
- **Real-time Updates**: Instant UI feedback with server synchronization

## 🚀 Tech Stack

### Frontend
- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript**: Full type safety across the entire application
- **Tailwind CSS 4**: Modern utility-first CSS framework with latest features
- **Vite**: Lightning-fast build tool with HMR and ES modules

### Backend & AI
- **Express.js**: RESTful API server with CORS and middleware support
- **SQLite + better-sqlite3**: High-performance embedded database with ACID transactions
- **Google Gemini API**: Advanced AI with function calling and structured outputs
- **Gray Matter**: Markdown processing for human-readable project documentation

### Architecture
- **Client-Server**: React SPA communicating with Express API
- **File-Based Storage**: Markdown projects + SQLite inventory for optimal performance
- **CLI Tools**: Direct database access for power users and automation
- **Modern ES Modules**: Fast development with native browser module support

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

## 🧠 AI Capabilities Deep Dive

### Conversational Management
The AI assistant can understand and execute complex operations through natural language:

**Project Operations:**
```
User: "I finished testing my weather station, mark it complete and set progress to 100%"
AI: Updates project status, progress, and adds completion notes automatically
```

**Inventory Operations:**
```
User: "I just received my Adafruit order - 3 ESP32s, 10 sensors, put them in storage"
AI: Updates quantities, sets status to "I Have", updates locations
```

**Cross-System Intelligence:**
- Remembers your project history across conversations
- Suggests component moves between projects
- Analyzes compatibility and optimization opportunities
- Provides market intelligence and sourcing recommendations

### AI-Generated Content
All AI-generated content is automatically saved:
- **Project Instructions**: Step-by-step build guides with code
- **Component Insights**: Technical descriptions and project ideas
- **Market Data**: Real-time pricing from multiple suppliers
- **Project Analysis**: Complexity assessment and sub-project suggestions

### Smart Automation
- **Auto-Categorization**: New components get proper categories automatically
- **Status Intelligence**: AI understands "I bought", "I need", "it's broken" naturally
- **Project Breakdown**: Complex projects automatically split into sub-projects
- **Component Allocation**: Smart suggestions for optimal component usage

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

### 🤖 Chat Assistant - The Heart of the System
The AI assistant understands natural language and can manage your entire inventory and projects:

**Project Management Examples:**
- *"Mark my Arduino weather station as completed"*
- *"Set my LED strip project to 75% progress"*
- *"Create a new smart home project with ESP32 and sensors"*
- *"Generate step-by-step instructions for my temperature monitor"*

**Inventory Management Examples:**
- *"I just bought 5 ESP32s, put them in my electronics drawer"*
- *"I need to order more resistors"*
- *"I salvaged LEDs from my old project"*
- *"My sensor is broken, mark it as discarded"*

**Technical Assistance:**
- *"What can I build with an ESP32 and BME280 sensor?"*
- *"Write me Arduino code to read a DHT22 sensor"*
- *"Find suppliers for Raspberry Pi 5"*
- *"Help me troubleshoot my I2C communication issues"*

### 📦 Inventory Management
1. **Adding Components**: Click the `+` button or tell the AI *"I just got new components"*
2. **AI Enhancement**: Use AI buttons to auto-generate descriptions and categories
3. **Status Tracking**: Components automatically move between I Have, I Need, I Want, etc.
4. **Component Details**: Click any item for AI insights, market data, and project usage
5. **Smart Search**: Find components instantly with intelligent filtering

### 🎯 Project Management
1. **Three-Stage Workflow**: Projects flow from Planning → In Progress → Completed
2. **Sub-Projects**: Complex projects automatically break into manageable phases
3. **AI Kickstart**: Get complete build plans, code, and component lists
4. **GitHub Integration**: Import component requirements from repositories
5. **Progress Tracking**: Visual progress bars and milestone management
6. **Component Allocation**: See which inventory items are used in which projects

### 🏠 Home Assistant Integration
1. **Configuration**: Go to Settings and add your HA URL and Long-Lived Access Token
2. **Entity Discovery**: All your HA entities appear automatically
3. **Physical Linking**: Connect digital entities to physical components
4. **Hardware Tracking**: Understand what hardware powers your smart home

### ⚙️ Advanced Features
- **Collapsible Sidebar**: Click the chevron to maximize workspace
- **Chat History**: Right sidebar shows all your AI conversations
- **CLI Tools**: Use `npm run cli` for advanced database operations
- **Export/Import**: Backup and restore your data through Settings

## 🆚 What Makes This Special

### vs. Traditional Inventory Apps
- **AI-Powered**: Natural language control instead of forms and menus
- **Project-Centric**: Built for makers who build things, not just store parts
- **Context-Aware**: Remembers your projects and suggests optimizations
- **Auto-Categorization**: No manual data entry - AI handles the tedious work

### vs. Simple Spreadsheets
- **Intelligent Search**: Find components by project, compatibility, or usage
- **Market Intelligence**: Real-time pricing and supplier recommendations
- **Project Integration**: See which components are used where
- **AI Assistance**: Get help with technical questions and project planning

### vs. Generic Project Management
- **Hardware-Focused**: Designed specifically for electronics and IoT projects
- **Component Allocation**: Track physical inventory usage across projects
- **Technical AI**: Understands electronics, compatibility, and coding
- **Maker Workflow**: Optimized for the build-test-iterate cycle

## 🔧 Troubleshooting

### Common Issues

**"VITE_API_KEY environment variable not set" Error**
- Ensure you've created a `.env` file in the root directory
- Verify your API key is correctly set as `VITE_API_KEY=your_key_here`
- Restart both server and client after adding environment variables

**AI Chat Not Responding**
- Check that your Gemini API key is valid and has quota remaining
- Verify the API key has the necessary permissions for the Gemini API
- Check browser console and server logs for detailed error messages
- Try refreshing the page to reset the AI context

**Server Connection Issues**
- Ensure both server (port 3001) and client (port 3000) are running
- Check that `npm run dev:full` started both processes successfully
- Verify no firewall is blocking the local ports
- Try `npm run server` and `npm run dev` separately to isolate issues

**Database/CLI Issues**
- Ensure SQLite database has proper permissions
- Try `npm run cli stats` to test database connectivity
- Check that the `inventory.db` file exists and is not corrupted
- Restart the server if database locks occur

**Home Assistant Integration Issues**
- Ensure your Home Assistant URL is accessible from your browser
- Verify your Long-Lived Access Token has the required permissions
- Check that CORS is properly configured in Home Assistant if needed
- Test the connection in Settings before using the integration

### Performance Tips
- **Large Inventories**: Use the CLI for bulk operations
- **Slow AI Responses**: Check your internet connection and API quota
- **Memory Usage**: Restart the browser if the app becomes sluggish
- **Database Performance**: Use the CLI `stats` command to monitor database size

### Getting Help
- Check browser console (F12) for client-side errors
- Check server terminal for API and database errors
- Verify all environment variables are properly set
- Test with a fresh `.env` file if issues persist
- Use the CLI tools to verify database integrity

## 🗺️ Roadmap

### 🚀 Coming Soon
- **Mobile App**: Native iOS/Android app with offline sync
- **Team Collaboration**: Share inventories and projects with team members
- **Advanced Analytics**: Predictive analytics for component needs
- **Integration Hub**: Connect with more services (Notion, Airtable, etc.)
- **Voice Control**: Voice commands for hands-free inventory management

### 🔮 Future Vision
- **AR Integration**: Point your phone at components for instant identification
- **Supply Chain Intelligence**: Predict component shortages and price changes
- **Community Features**: Share projects and component reviews with other makers
- **Advanced Automation**: Automated ordering based on project requirements
- **Multi-Location Support**: Manage inventories across multiple workshops/locations

## 📊 Project Stats

- **Components**: 25+ categorized component types
- **Project Templates**: Smart Home, Weather Station, Security, Robotics, and more
- **AI Capabilities**: 7 different JSON action types for intelligent automation
- **Storage**: SQLite database + Markdown files for optimal performance
- **UI Components**: 20+ React components with full TypeScript support
- **CLI Commands**: Comprehensive command-line interface for power users

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper TypeScript types
4. **Test thoroughly** with both UI and CLI
5. **Submit a pull request** with a clear description

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Update tests for new features
- Document AI prompt changes
- Test with real hardware when possible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the intelligent features
- **React Team** for the excellent framework
- **Tailwind CSS** for the beautiful, responsive design
- **SQLite** for reliable, embedded database functionality
- **The Maker Community** for inspiration and feedback

---

**Built with ❤️ for the IoT maker community**

*Transform your electronics workshop from chaos to organized productivity with AI-powered intelligence.*
