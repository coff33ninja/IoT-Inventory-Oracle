# Changelog

All notable changes to IoT Inventory Oracle will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Mobile app development in progress
- Advanced analytics dashboard
- Multi-user collaboration features
- Enhanced AI model training

### Changed
- Performance optimizations for large inventories
- Improved search algorithms

### Fixed
- Various minor bug fixes and improvements

## [1.0.0-beta] - 2025-10-12

### Added
- **Smart Component Relationships**: AI automatically recognizes and links related components
- **Universal Inventory Support**: Full support for computer components, tools, and general items
- **Enhanced Purchase Tracking**: Serial numbers, warranties, suppliers, and detailed purchase information
- **Component Bundles**: Group related components into logical kits and systems
- **Comprehensive Documentation**: Complete documentation restructure with focused guides
- **Enhanced User Form**: Users can now add all the same fields that AI can populate
- **Global Currency Support**: 60+ currencies including ZAR (South African Rand) as default

### Changed
- **Expanded Categories**: 40+ categories covering electronics, computers, and general items
- **Enhanced AI Intelligence**: Better component recognition and compatibility analysis
- **Improved Database Schema**: Added 12 new fields for comprehensive item tracking
- **TypeScript Strict Mode**: Enhanced type safety throughout the application
- **User Form Parity**: Manual item entry now supports all AI-populated fields

### Fixed
- **Project Deletion Bug**: Fixed issue where deleting projects opened next project in edit view
- **Event Propagation**: Proper event handling in project cards
- **Type Safety Issues**: Resolved all TypeScript compilation warnings
- **ChatView Error**: Fixed undefined object error in inventory/project update displays

### Technical
- Database migration system for seamless upgrades
- Enhanced API endpoints for relationships and bundles
- Improved error handling and validation
- Better performance optimization
- Null safety checks in React components

## [0.9.0] - 2025-09-15

### Added
- **Conversational AI Management**: Natural language control of inventory and projects
- **Auto-Execution**: AI automatically applies simple updates with confirmation
- **Smart Context**: AI remembers projects and components across conversations
- **Interactive Actions**: Manual confirmation buttons for complex changes
- **Advanced Project Management**: 3-stage workflow with sub-project support
- **AI-Generated Instructions**: Step-by-step guides with code examples
- **GitHub Integration**: Import component lists from repositories
- **Project Templates**: Pre-built templates for common IoT projects

### Changed
- **Enhanced UI**: Collapsible sidebar and improved navigation
- **Better Search**: Real-time search with intelligent filtering
- **Improved Performance**: Faster loading and better responsiveness

### Fixed
- **Database Stability**: Improved SQLite connection handling
- **Memory Leaks**: Fixed various memory management issues
- **Search Performance**: Optimized search algorithms

## [0.8.0] - 2025-08-20

### Added
- **Smart Inventory System**: 7 status categories with AI categorization
- **25+ Component Categories**: Specific categories for better organization
- **Allocation Tracking**: See which components are used in which projects
- **Market Intelligence**: AI-powered price comparison and sourcing
- **Component Analysis**: Compatibility checking and optimization suggestions
- **Home Assistant Integration**: Connect digital entities to physical components
- **CLI Tools**: Command-line interface for power users

### Changed
- **Database Architecture**: Moved from localStorage to SQLite
- **File-Based Projects**: Human-readable Markdown project files
- **Modern UI**: Dark theme with responsive design
- **Enhanced AI**: Better natural language understanding

### Fixed
- **Data Persistence**: Reliable data storage and backup
- **Performance Issues**: Optimized for larger inventories
- **Cross-Platform**: Better compatibility across operating systems

## [0.7.0] - 2025-07-10

### Added
- **Basic Inventory Management**: Add, edit, delete components
- **Simple Project Tracking**: Basic project creation and management
- **AI Assistant**: Initial Gemini AI integration
- **Web Interface**: React-based user interface
- **Local Storage**: Browser-based data persistence

### Features
- Component categorization
- Basic search functionality
- Simple project workflow
- AI-powered descriptions
- Responsive design

## Version History Summary

### Major Milestones

**v1.0.0-beta - Complete Feature Release (Beta)**
- Universal inventory system for all item types (electronics, computers, tools, general)
- Intelligent component relationships and bundles
- Enhanced purchase tracking and warranty management
- Conversational AI with auto-execution and smart context
- Advanced project management with sub-projects and AI-generated instructions
- Home Assistant and GitHub integrations
- CLI tools for power users and automation
- Comprehensive documentation and examples

**v0.9.0 - AI-Powered Project Management**
- Conversational AI with auto-execution
- Advanced project management with sub-projects
- GitHub integration and project templates
- Interactive AI actions and confirmations

**v0.8.0 - Professional Architecture**
- SQLite database with proper persistence
- Home Assistant integration
- CLI tools for power users
- Market intelligence and pricing

**v0.7.0 - Foundation Release**
- Basic inventory and project management
- Initial AI integration
- Web-based interface
- Core functionality established

## Breaking Changes

### v1.0.0 Breaking Changes
- **First Major Release**: Establishes stable API and database schema
- **Database Schema**: Comprehensive schema with automatic migration
- **TypeScript**: Strict mode enabled for better type safety
- **API Structure**: RESTful API with standardized endpoints

### v0.9.0 Breaking Changes
- **Project Structure**: Projects now stored as Markdown files
- **API Endpoints**: New REST API structure
- **Configuration**: Environment variables restructured

### v0.8.0 Breaking Changes
- **Storage Migration**: Data moved from localStorage to SQLite
- **File Structure**: New project directory structure
- **Dependencies**: New backend dependencies required

## Migration Guides

### Migrating to v1.0.0

**Automatic Migration:**
The application automatically migrates your database when you first run v1.0.0. No manual intervention required.

**New Features Available:**
- Add serial numbers and purchase details to existing components
- Create component relationships for items that work together
- Group related components into bundles
- Use enhanced AI features for better component management
- Track computer components alongside electronics
- Use comprehensive documentation and examples

### Migrating to v0.9.0

**Data Migration:**
```bash
# Backup your data first
npm run cli backup backup-pre-v3.db

# Start the new version (migration happens automatically)
npm run dev:full
```

**New CLI Commands:**
```bash
# Explore new CLI features
npm run cli --help
npm run cli inventory stats
npm run cli projects list
```

### Migrating to v2.0.0

**Manual Migration Required:**
1. Export data from v1.0.0 (if available)
2. Install v2.0.0 dependencies
3. Import data using CLI tools
4. Configure Home Assistant integration (optional)

## Deprecation Notices

### Deprecated in v4.0.0
- None currently

### Deprecated in v3.0.0
- **localStorage**: Replaced with SQLite database
- **Simple Project Format**: Replaced with Markdown files

### Removed in v2.0.0
- **Browser-only Storage**: Replaced with server-side database
- **Simple File Structure**: Replaced with organized directory structure

## Security Updates

### v1.0.0-beta Security
- Enhanced input validation for new fields
- Improved database query sanitization
- Better error handling without information leakage

### v0.9.0 Security
- Added CORS configuration
- Improved API security
- Enhanced environment variable handling

### v0.8.0 Security
- Database security improvements
- API authentication preparation
- Secure file handling

## Performance Improvements

### v1.0.0-beta Performance
- Optimized database queries with new indexes
- Improved component relationship lookups
- Better memory management for large inventories
- Enhanced search performance

### v0.9.0 Performance
- Faster AI response processing
- Optimized React rendering
- Improved database connection pooling
- Better caching strategies

### v0.8.0 Performance
- SQLite performance optimization
- Indexed database queries
- Reduced memory usage
- Faster startup times

## Known Issues

### Current Known Issues
- Large inventories (1000+ items) may experience slower search
- AI responses occasionally timeout with complex queries
- Home Assistant integration requires manual CORS configuration in some setups

### Resolved Issues
- ✅ Project deletion opening next project (fixed in v1.0.0-beta)
- ✅ TypeScript compilation warnings (fixed in v1.0.0-beta)
- ✅ Memory leaks in chat interface (fixed in v0.9.0)
- ✅ Database locking issues (fixed in v0.8.0)

## Upcoming Features

### v1.1.0 (Planned)
- Enhanced mobile responsiveness
- Bulk component operations
- Advanced filtering options
- Export/import improvements

### v2.0.0 (Future)
- Multi-user support
- Real-time collaboration
- Advanced analytics
- Mobile applications

## Community Contributions

### v1.0.0-beta Contributors
- Enhanced documentation structure
- Bug reports and testing
- Feature suggestions and feedback

### v0.9.0 Contributors
- AI prompt improvements
- UI/UX feedback
- Beta testing and bug reports

### v0.8.0 Contributors
- Database schema suggestions
- CLI tool feature requests
- Integration testing

## Support and Compatibility

### System Requirements

**Current (v1.0.0-beta):**
- Node.js v16+ (v18+ recommended)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- 4GB RAM minimum (8GB recommended for large inventories)
- 1GB disk space

**Previous Versions:**
- v0.9.0: Node.js v14+, 2GB RAM
- v0.8.0: Node.js v14+, 1GB RAM
- v0.7.0: Modern web browser only

### Browser Compatibility

| Browser | v1.0.0-beta | v0.9.0 | v0.8.0 | v0.7.0 |
| ------- | ------------ | ------ | ------ | ------ |
| Chrome  | 90+          | 85+    | 80+    | 70+    |
| Firefox | 88+          | 80+    | 75+    | 65+    |
| Safari  | 14+          | 13+    | 12+    | 11+    |
| Edge    | 90+          | 85+    | 80+    | 79+    |

---

**[← Back: Contributing](./contributing.md)** | **[Documentation Home](./README.md)** | **[Next: Roadmap →](./roadmap.md)**