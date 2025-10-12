# User Guide

Complete guide to using IoT Inventory Oracle effectively. Master all features from basic inventory management to advanced AI-powered project planning.

## Getting Started

### First Launch

1. **Open the application** at `http://localhost:3000`
2. **Take the tour** - Interactive walkthrough of key features
3. **Add your first component** - Start building your inventory
4. **Chat with AI** - Try the conversational assistant
5. **Create a project** - Plan your first build

### Interface Overview

**Main Navigation:**
- **Inventory** 📦 - Manage all your components and items
- **Projects** 🎯 - Plan and track your builds
- **Chat** 💬 - AI assistant for everything
- **Settings** ⚙️ - Configuration and integrations

**Sidebar Features:**
- **Collapsible Design** - Click chevron to maximize workspace
- **Quick Actions** - Add items, create projects, search
- **Status Indicators** - See counts for each inventory status

## Inventory Management

### Adding Components

**Quick Add:**
1. Click the `+` button in inventory view
2. Fill in basic information (name, quantity, location, status)
3. Let AI suggest category and generate description
4. Save and continue adding more components

**AI-Assisted Add:**
```
Chat: "I just bought 5 ESP32s from Amazon for $60"
Result: AI automatically creates inventory entry with all details
```

**Bulk Import:**
- Use CLI tools for large inventories
- Import from CSV files
- Copy from existing spreadsheets

### Managing Items

**Editing Items:**
- Click any item to edit inline
- Use detail view for complete information
- Bulk edit multiple items at once

**Status Management:**
- Drag and drop between status categories
- Use AI commands: "Mark my sensor as broken"
- Bulk status changes for multiple items

**Search and Filter:**
- Real-time search across all fields
- Filter by status, category, location
- Save common search combinations

### Purchase Tracking

**Recording Purchases:**
```
"I bought an Arduino Uno R3 from Amazon yesterday for $25.99. 
Serial number ARD123456, model UNO-R3, 2-year warranty."
```

**AI Extracts:**
- Purchase date: Yesterday
- Supplier: Amazon
- Price: $25.99
- Serial: ARD123456
- Model: UNO-R3
- Warranty: 2 years

**Warranty Management:**
- Track warranty expiration dates
- Get alerts for expiring warranties
- Maintain warranty claim history

## Project Management

### Creating Projects

**Manual Creation:**
1. Click "Create New Project"
2. Enter project details (name, description, category)
3. Add components manually or from inventory
4. Set timeline and budget

**AI Project Creation:**
```
"Help me plan a smart home temperature monitoring system"
→ Complete project with components, instructions, and code
```

**GitHub Integration:**
1. Link repository to project
2. AI analyzes code for component requirements
3. Automatic component list generation
4. Sync updates when code changes

### Project Workflow

**Planning Phase:**
- Define requirements and goals
- Research components and compatibility
- Create shopping lists for missing items
- Set budget and timeline

**In Progress Phase:**
- Allocate components from inventory
- Track assembly progress (0-100%)
- Document build steps and issues
- Test and troubleshoot

**Completed Phase:**
- Final testing and validation
- Photo documentation
- Return unused components
- Share project results

### AI Kickstart

**Getting Started:**
1. Select any project
2. Click "AI Kickstart"
3. Get complete build plan including:
   - Detailed component list
   - Step-by-step instructions
   - Complete code with comments
   - Wiring diagrams
   - Troubleshooting tips

**Example Output:**
```
Smart Weather Station Project

Components Needed:
├── ESP32 Development Board
├── BME280 Temperature/Humidity/Pressure Sensor
├── 0.96" OLED Display
├── Solar Panel and Battery
└── Weatherproof Enclosure

Code Generated:
├── WiFi connection setup
├── Sensor reading functions
├── Display output routines
├── Web server for data access
└── Deep sleep power management
```

## AI Assistant

### Natural Language Commands

**Inventory Commands:**
```
"I just received my order from Adafruit"
"Add 10 LEDs to my electronics box"
"My ESP32 is broken, mark it as discarded"
"Show me all sensors I have"
"What components do I need for a weather station?"
```

**Project Commands:**
```
"Create a new IoT project for plant monitoring"
"Set my Arduino project to 75% complete"
"Generate code for reading a DHT22 sensor"
"What can I build with an ESP32 and some sensors?"
"Help me troubleshoot my I2C communication"
```

**Purchase Commands:**
```
"I bought 5 resistors from Mouser for $2.50"
"Find me the best price for Raspberry Pi 5"
"Check warranty status for my Arduino"
"When did I buy my last ESP32?"
```

### Auto-Population

**Automatic Actions:**
The AI automatically performs actions based on your conversation:

- **Component Addition**: Mentions of purchases automatically add items
- **Status Updates**: Natural language updates component statuses
- **Project Creation**: Project discussions create project plans
- **Relationship Linking**: Component mentions create relationships

**Control Settings:**
- Enable/disable auto-population
- Review mode: confirm before applying changes
- Selective auto-execution by action type

### AI Features

**Code Generation:**
- Complete Arduino/ESP32 sketches
- Python scripts for Raspberry Pi
- Configuration files for services
- HTML/CSS for web interfaces

**Technical Support:**
- Troubleshooting guidance
- Component compatibility checking
- Performance optimization suggestions
- Best practices recommendations

**Market Intelligence:**
- Real-time price comparisons
- Supplier recommendations
- Stock availability checking
- Deal alerts and notifications

## Component Relationships

### Understanding Relationships

**Relationship Types:**
- **Requires**: Component A needs Component B to function
- **Compatible With**: Components work well together
- **Enhances**: Component B improves Component A
- **Part Of**: Component A is part of Component B
- **Contains**: Component A contains Component B

**Automatic Detection:**
```
"ESP12E with NodeMCU shield" 
→ Creates separate components with "requires" relationship
```

### Managing Relationships

**Viewing Relationships:**
- Component detail view shows all relationships
- Visual relationship maps
- Quick navigation between related components

**Creating Relationships:**
1. Select primary component
2. Click "Add Relationship"
3. Choose related component and relationship type
4. Add description and notes

**Component Bundles:**
- Group related components into logical sets
- Create kits, combos, and systems
- Manage bundle contents and descriptions

## Advanced Features

### CLI Tools

**Quick Commands:**
```bash
# List all components
npm run cli inventory list

# Search for ESP32 components
npm run cli inventory search "ESP32"

# Show project statistics
npm run cli projects stats

# Create backup
npm run cli backup inventory-backup.db
```

**Bulk Operations:**
- Import/export large inventories
- Batch status updates
- Database maintenance
- Automated reporting

### Home Assistant Integration

**Setup:**
1. Go to Settings → Integrations
2. Enter Home Assistant URL and token
3. Test connection
4. Link entities to inventory components

**Features:**
- View HA entities alongside inventory
- Link physical components to digital entities
- Track smart home hardware
- Monitor device status and health

### Customization

**Interface Customization:**
- Collapsible sidebar for more workspace
- Custom themes and colors
- Adjustable list views and sorting
- Personalized dashboard layouts

**AI Behavior:**
- Adjust AI response style
- Configure auto-population preferences
- Set conversation memory duration
- Customize suggestion aggressiveness

## Tips and Best Practices

### Organization Tips

1. **Consistent Naming**: Use standard component names and descriptions
2. **Detailed Locations**: Be specific about where items are stored
3. **Regular Updates**: Keep quantities and statuses current
4. **Use Categories**: Proper categorization improves searchability
5. **Add Notes**: Include important details and usage history

### Workflow Optimization

1. **Plan Before Building**: Check inventory before starting projects
2. **Use Shopping Lists**: Leverage "I Need" status for purchasing
3. **Track Allocations**: Monitor component usage across projects
4. **Document Everything**: Keep detailed project notes and photos
5. **Regular Maintenance**: Audit inventory and clean up old data

### AI Interaction

1. **Be Specific**: Provide detailed information in conversations
2. **Use Natural Language**: Talk normally, don't use formal commands
3. **Provide Context**: Mention project names and specific requirements
4. **Follow Up**: Ask clarifying questions for better results
5. **Correct Mistakes**: Help AI learn by correcting errors

### Project Success

1. **Clear Objectives**: Define specific, measurable project goals
2. **Component Research**: Verify compatibility before starting
3. **Budget Planning**: Include contingency for unexpected costs
4. **Timeline Management**: Set realistic milestones and deadlines
5. **Documentation**: Keep detailed build logs and lessons learned

## Troubleshooting

### Common Issues

**AI Not Responding:**
- Check Gemini API key in settings
- Verify internet connection
- Check API quota limits
- Restart application if needed

**Components Not Auto-Adding:**
- Ensure auto-population is enabled
- Check for JSON blocks in AI responses
- Try rephrasing requests more specifically
- Look for error messages in browser console

**Search Not Working:**
- Clear search filters
- Check spelling and try synonyms
- Use broader search terms
- Verify database connectivity

**Project Issues:**
- Check component availability in inventory
- Verify all required fields are filled
- Ensure proper component allocation
- Review project status and permissions

### Getting Help

**Built-in Help:**
- Ask AI: "How do I..." for any feature
- Use tooltips and help text throughout interface
- Check status indicators for system health

**Documentation:**
- Browse complete documentation
- Search specific topics
- Follow step-by-step guides
- Review examples and tutorials

**Community Support:**
- Share projects and get feedback
- Ask questions in community forums
- Contribute to documentation improvements
- Report bugs and suggest features

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New item/project
- `Ctrl/Cmd + S`: Save current changes
- `Esc`: Close modals and dialogs

### Navigation
- `Tab`: Navigate between form fields
- `Enter`: Submit forms and confirm actions
- `Arrow Keys`: Navigate lists and tables
- `Space`: Toggle checkboxes and selections

### Chat Interface
- `Enter`: Send message
- `Shift + Enter`: New line in message
- `Up Arrow`: Edit last message
- `Ctrl/Cmd + L`: Clear chat history

---

**[← Back: Component Relationships](./component-relationships.md)** | **[Documentation Home](./README.md)** | **[Next: Home Assistant →](./home-assistant.md)**