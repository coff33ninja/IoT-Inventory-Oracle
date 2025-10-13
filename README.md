# IoT Inventory Oracle 🚀

> **Current Version**: v1.0.0-beta (Released: October 12, 2025)

A comprehensive, AI-powered inventory management system for makers, developers, and tech enthusiasts. Manage electronics components, computer hardware, tools, and general items with intelligent project management, conversational AI assistance, and smart component relationships.

## ✨ Latest Features (v1.0.0-beta) - Complete Feature Release

### 🔗 Smart Component Relationships
- **Intelligent Component Linking**: AI recognizes when components work together
  - *"ESP12E with NodeMCU HW-389 shield"* → Creates separate but linked entries
  - *"Intel i7 with ASUS motherboard"* → Tracks compatibility relationships
- **Component Bundles**: Group related items into logical kits and systems
- **Relationship Types**: requires, compatible_with, enhances, part_of, contains
- **Auto-Population**: AI automatically creates relationships when you mention compound components

### 💻 Universal Inventory Support
- **Computer Components**: Full support for PC builds, servers, and workstations
  - CPU/Processor, GPU/Graphics Card, Motherboard, RAM/Memory
  - Storage/SSD/HDD, Power Supply Unit, Cooling systems
  - Peripherals, networking equipment, and accessories
- **General Items**: Tools, furniture, office supplies, software licenses
- **Smart Categorization**: 40+ categories covering electronics, computers, and general items
- **Build Projects**: AI suggests PC builds, server setups, and workstation configurations

### 🧠 Enhanced AI Intelligence
- **Compound Component Recognition**: Understands complex component descriptions
- **Compatibility Analysis**: Checks component compatibility (CPU sockets, power requirements)
- **Build Optimization**: Suggests improvements and identifies potential issues
- **Universal Project Support**: IoT projects, PC builds, office setups, home labs

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

### 📦 Universal Smart Inventory System
- **7 Status Categories**: I Have, I Need, I Want, I Salvaged, I Returned, Discarded, Given Away
- **40+ Categories**: Electronics, computer components, tools, furniture, software, and more
- **Component Relationships**: Track which components work together or require each other
- **Component Bundles**: Group related items into kits, builds, and systems
- **Allocation Tracking**: See which components are used in which projects
- **Market Intelligence**: AI-powered price comparison and sourcing
- **Compatibility Analysis**: Smart compatibility checking for complex builds

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

## 📚 Documentation

For comprehensive documentation, guides, and examples, visit our **[Documentation Hub](./docs/README.md)**:

- **[Getting Started Guide](./docs/getting-started.md)** - Quick setup and first steps
- **[User Guide](./docs/user-guide.md)** - Complete feature walkthrough  
- **[API Reference](./docs/api-reference.md)** - Developer documentation
- **[Changelog](./docs/changelog.md)** - Version history and updates
- **[Roadmap](./docs/roadmap.md)** - Future plans and features

## 🎯 Core Features

### 🤖 Conversational AI Assistant
- **Natural Language Management**: Control projects and inventory through chat
- **Context-Aware Intelligence**: AI remembers your components and projects across sessions
- **Auto-Execution**: Simple updates applied automatically with smart confirmation
- **Interactive Actions**: Manual buttons for complex operations with preview
- **Code Generation**: Complete Arduino/ESP32/Raspberry Pi code with explanations
- **Real-time Sourcing**: Find components online with pricing from multiple suppliers
- **Project Suggestions**: Get project ideas based on your available components

### 📦 Universal Advanced Inventory Management
- **7 Status Categories**: I Have, I Need, I Want, I Salvaged, I Returned, Discarded, Given Away
- **40+ Categories**: Electronics, computer hardware, tools, furniture, software, consumables
- **Smart Component Relationships**: AI recognizes and links related components
- **Component Bundles**: Group items into kits, builds, and systems
- **AI-Enhanced Cataloging**: Auto-generate descriptions and suggest categories
- **Allocation Tracking**: See which components are allocated to which projects
- **Market Intelligence**: AI-powered price comparison and supplier recommendations
- **Compatibility Analysis**: Smart compatibility checking for PC builds and complex systems
- **Smart Analytics**: Inventory value, utilization rates, and distribution insights

### 🎯 Universal Intelligent Project Management
- **3-Stage Workflow**: Planning → In Progress → Completed with progress tracking
- **Sub-Project Support**: Break complex projects into manageable phases with dependencies
- **AI-Generated Content**: Instructions, insights, and enhanced descriptions auto-saved
- **GitHub Integration**: Import component lists from public repositories
- **Universal Project Templates**: IoT projects, PC builds, server setups, office configurations
- **Readiness Analysis**: See which projects can be built immediately vs missing components
- **Cross-Project Operations**: Move components between projects with AI guidance
- **Build Optimization**: AI suggests improvements and identifies compatibility issues
- **Component Relationships**: Track which components work together in projects

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

## � Quick Start

### Prerequisites
- **Node.js** v16+ (v18+ recommended)
- **Modern web browser** with ES Modules support
- **Google Gemini API Key** - Get yours at [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Exchange Rate API Key** (Optional) - For currency conversion in market data:
  - **Fixer.io** (Recommended) - [Get free API key](https://fixer.io/) (1000 requests/month free)
  - **CurrencyLayer** (Alternative) - [Get free API key](https://currencylayer.com/) (1000 requests/month free)

### Installation

```bash
# Clone the repository
git clone https://github.com/IdeaGazm/IoT_Oracle.git
cd IoT_Oracle

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
# - VITE_API_KEY: Your Gemini API key (required)
# - VITE_FIXER_API_KEY: Your Fixer.io API key (optional, for currency conversion)

# Start the application
npm run dev:full
```

Open `http://localhost:3000` in your browser to get started!

For detailed setup instructions, see our **[Getting Started Guide](./docs/getting-started.md)**.

## 🌟 What Makes This Special

### AI-Powered Intelligence
- **Natural Language Control**: Manage inventory and projects through conversation
- **Smart Component Recognition**: AI understands complex component relationships
- **Auto-Execution**: Simple updates applied automatically with confirmation
- **Context-Aware**: Remembers your projects and suggests optimizations

### Universal Inventory System
- **40+ Categories**: Electronics, computer hardware, tools, and general items
- **7 Status Types**: I Have, I Need, I Want, I Salvaged, I Returned, Discarded, Given Away
- **Smart Relationships**: Track which components work together
- **Component Bundles**: Group related items into logical kits

### Advanced Project Management
- **3-Stage Workflow**: Planning → In Progress → Completed
- **Sub-Project Support**: Break complex builds into manageable phases
- **AI-Generated Instructions**: Step-by-step guides with code examples
- **GitHub Integration**: Import component lists from repositories

### Professional Architecture
- **SQLite Database**: Reliable, ACID-compliant data storage
- **CLI Tools**: Command-line interface for power users
- **TypeScript**: Full type safety throughout the application
- **Modern Stack**: React 19, Vite, Tailwind CSS 4, Express.js

## 📊 Key Statistics

- **40+ Component Categories** covering all maker needs
- **7 Inventory Status Types** for complete lifecycle tracking
- **5 Relationship Types** for smart component linking
- **25+ React Components** with full TypeScript support
- **9 AI Action Types** for intelligent automation
- **CLI Tools** for advanced database operations

## 🤝 Contributing

We welcome contributions from the maker community! See our **[Contributing Guide](./docs/contributing.md)** for details on:

- Code contributions and development setup
- Bug reports and feature requests  
- Documentation improvements
- Community guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the intelligent features
- **React Team** for the excellent framework and ecosystem
- **Tailwind CSS** for the beautiful, responsive design system
- **SQLite** for reliable, embedded database functionality
- **The Maker Community** for inspiration, feedback, and contributions

---

**Repository**: [IdeaGazm/IoT_Oracle](https://github.com/IdeaGazm/IoT_Oracle)  
**Version**: v1.0.0-beta (October 12, 2025)  
**Built with ❤️ for the IoT maker community**

*Transform your electronics workshop from chaos to organized productivity with AI-powered intelligence.*
