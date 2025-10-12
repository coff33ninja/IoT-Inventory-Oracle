# Contributing Guide

Welcome to the IoT Inventory Oracle project! We're excited to have you contribute to making this the best inventory management system for makers and developers.

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Git** for version control
- **Code Editor** (VS Code recommended)
- **Google Gemini API Key** for testing AI features

### Development Setup

1. **Fork and Clone:**
```bash
git clone https://github.com/your-username/IoT-Inventory-Oracle.git
cd IoT-Inventory-Oracle
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Environment Setup:**
```bash
cp .env.example .env
# Add your Gemini API key to .env
```

4. **Start Development:**
```bash
npm run dev:full
```

5. **Verify Setup:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/health
- CLI: `npm run cli stats`

## Project Structure

### Key Directories

```
IoT-Inventory-Oracle/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # State management
│   ├── services/          # API clients
│   └── types.ts           # TypeScript definitions
├── server/                # Express backend
├── services/              # Shared business logic
├── docs/                  # Documentation
├── scripts/               # CLI tools
└── tests/                 # Test files
```

### Important Files

- `src/types.ts` - TypeScript type definitions
- `services/databaseService.ts` - Database operations
- `services/geminiService.ts` - AI integration
- `server/api.ts` - REST API endpoints
- `docs/` - All documentation files

## Development Workflow

### Branch Strategy

**Main Branches:**
- `main` - Production-ready code
- `develop` - Integration branch for features

**Feature Branches:**
- `feature/component-relationships` - New features
- `fix/inventory-search-bug` - Bug fixes
- `docs/api-reference-update` - Documentation updates

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature commits
git commit -m "feat: add component relationship linking"
git commit -m "feat(ai): improve component recognition accuracy"

# Bug fixes
git commit -m "fix: resolve inventory search pagination issue"
git commit -m "fix(api): handle database connection errors"

# Documentation
git commit -m "docs: update API reference with new endpoints"
git commit -m "docs(readme): add installation troubleshooting"

# Other types
git commit -m "refactor: simplify inventory context logic"
git commit -m "test: add unit tests for database service"
git commit -m "chore: update dependencies to latest versions"
```

### Pull Request Process

1. **Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes:**
- Write clean, documented code
- Add tests for new functionality
- Update documentation as needed

3. **Test Your Changes:**
```bash
npm run test          # Run test suite
npm run lint          # Check code style
npm run type-check    # TypeScript validation
```

4. **Commit and Push:**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

5. **Create Pull Request:**
- Use the PR template
- Provide clear description
- Link related issues
- Request appropriate reviewers

## Code Standards

### TypeScript Guidelines

**Type Safety:**
```typescript
// ✅ Good: Explicit types
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: ItemStatus;
}

// ❌ Avoid: Any types
const item: any = { ... };

// ✅ Good: Proper error handling
const getItem = async (id: string): Promise<InventoryItem | null> => {
  try {
    return await database.getItem(id);
  } catch (error) {
    console.error('Failed to get item:', error);
    return null;
  }
};
```

**Naming Conventions:**
```typescript
// ✅ Good naming
const inventoryItems = [];
const handleAddItem = () => {};
const ItemStatus = enum { ... };
const InventoryContext = createContext();

// ❌ Poor naming
const items = [];
const add = () => {};
const status = enum { ... };
const ctx = createContext();
```

### React Guidelines

**Component Structure:**
```typescript
// ✅ Good component structure
interface ComponentProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
}

const InventoryList: React.FC<ComponentProps> = ({ 
  items, 
  onItemClick 
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleClick = useCallback((item: InventoryItem) => {
    setSelectedId(item.id);
    onItemClick(item);
  }, [onItemClick]);

  return (
    <div className="inventory-list">
      {items.map(item => (
        <InventoryItem 
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onClick={handleClick}
        />
      ))}
    </div>
  );
};
```

**Hooks Usage:**
```typescript
// ✅ Good: Custom hooks for logic
const useInventorySearch = (items: InventoryItem[], query: string) => {
  return useMemo(() => {
    if (!query) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);
};

// ✅ Good: Proper dependency arrays
useEffect(() => {
  fetchInventoryItems();
}, []);

useEffect(() => {
  updateSearchResults(query);
}, [query, items]);
```

### CSS/Styling Guidelines

**Tailwind CSS Usage:**
```typescript
// ✅ Good: Semantic class grouping
<div className="flex items-center justify-between p-4 bg-secondary border border-border-color rounded-lg">
  <h3 className="text-lg font-semibold text-text-primary">
    {item.name}
  </h3>
  <span className="text-sm text-text-secondary">
    Qty: {item.quantity}
  </span>
</div>

// ✅ Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Custom CSS (when needed):**
```css
/* ✅ Good: BEM methodology */
.inventory-item {
  @apply p-4 border rounded-lg;
}

.inventory-item--selected {
  @apply border-accent bg-accent/10;
}

.inventory-item__name {
  @apply font-semibold text-text-primary;
}
```

## Testing Guidelines

### Unit Tests

**Test Structure:**
```typescript
// tests/services/databaseService.test.ts
import { DatabaseService } from '../../services/databaseService';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService(':memory:'); // In-memory test DB
  });

  afterEach(() => {
    db.close();
  });

  describe('addItem', () => {
    it('should add item to database', async () => {
      const item = {
        name: 'Test Component',
        quantity: 1,
        location: 'Test Location',
        status: 'I Have'
      };

      const result = await db.addItem(item);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(item.name);
    });

    it('should throw error for invalid item', async () => {
      const invalidItem = { name: '' }; // Missing required fields
      
      await expect(db.addItem(invalidItem)).rejects.toThrow();
    });
  });
});
```

### Integration Tests

**API Testing:**
```typescript
// tests/api/inventory.test.ts
import request from 'supertest';
import app from '../../server/api';

describe('Inventory API', () => {
  describe('GET /api/inventory', () => {
    it('should return inventory items', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/inventory', () => {
    it('should create new inventory item', async () => {
      const newItem = {
        name: 'Test Component',
        quantity: 1,
        location: 'Test Location',
        status: 'I Have'
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(newItem)
        .expect(201);

      expect(response.body.name).toBe(newItem.name);
    });
  });
});
```

### Component Tests

**React Testing:**
```typescript
// tests/components/InventoryList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryList } from '../../src/components/InventoryList';

const mockItems = [
  {
    id: '1',
    name: 'Arduino Uno',
    quantity: 2,
    location: 'Box A',
    status: 'I Have'
  }
];

describe('InventoryList', () => {
  it('renders inventory items', () => {
    render(<InventoryList items={mockItems} onItemClick={jest.fn()} />);
    
    expect(screen.getByText('Arduino Uno')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2')).toBeInTheDocument();
  });

  it('calls onItemClick when item is clicked', () => {
    const mockOnClick = jest.fn();
    render(<InventoryList items={mockItems} onItemClick={mockOnClick} />);
    
    fireEvent.click(screen.getByText('Arduino Uno'));
    
    expect(mockOnClick).toHaveBeenCalledWith(mockItems[0]);
  });
});
```

## Documentation Standards

### Code Documentation

**Function Documentation:**
```typescript
/**
 * Adds a new item to the inventory database
 * @param item - The inventory item to add (without ID)
 * @returns Promise resolving to the created item with generated ID
 * @throws DatabaseError if the operation fails
 * 
 * @example
 * ```typescript
 * const newItem = await addItem({
 *   name: 'Arduino Uno',
 *   quantity: 1,
 *   location: 'Electronics Box',
 *   status: 'I Have'
 * });
 * ```
 */
async addItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  // Implementation
}
```

**Component Documentation:**
```typescript
/**
 * Displays a list of inventory items with search and filter capabilities
 * 
 * @param items - Array of inventory items to display
 * @param onItemClick - Callback fired when an item is clicked
 * @param searchQuery - Optional search query to filter items
 * @param selectedStatus - Optional status filter
 * 
 * @example
 * ```tsx
 * <InventoryList
 *   items={inventoryItems}
 *   onItemClick={handleItemClick}
 *   searchQuery="Arduino"
 *   selectedStatus="I Have"
 * />
 * ```
 */
```

### API Documentation

**Endpoint Documentation:**
```typescript
/**
 * @route GET /api/inventory
 * @description Get all inventory items with optional filtering
 * @query {string} search - Search term for item names
 * @query {string} status - Filter by item status
 * @query {string} category - Filter by item category
 * @query {number} page - Page number for pagination
 * @query {number} limit - Items per page (max 100)
 * @returns {InventoryItem[]} Array of inventory items
 * @throws {400} Invalid query parameters
 * @throws {500} Database error
 */
app.get('/api/inventory', async (req, res) => {
  // Implementation
});
```

## Issue Guidelines

### Bug Reports

**Use the Bug Report Template:**
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to inventory page
2. Click on component
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 10
- Browser: Chrome 120
- Node.js: v18.17.0
- App Version: v4.0.0

## Additional Context
Screenshots, logs, etc.
```

### Feature Requests

**Use the Feature Request Template:**
```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples, etc.
```

## Review Process

### Code Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance is acceptable

**Code Quality:**
- [ ] Code follows project conventions
- [ ] TypeScript types are correct
- [ ] No console.log statements in production code
- [ ] Comments explain complex logic

**Testing:**
- [ ] New features have tests
- [ ] Existing tests still pass
- [ ] Test coverage is maintained

**Documentation:**
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Code comments are clear

### Review Guidelines

**For Reviewers:**
- Be constructive and helpful
- Explain the reasoning behind suggestions
- Approve when ready, request changes when needed
- Test the changes locally when possible

**For Contributors:**
- Respond to feedback promptly
- Ask questions if feedback is unclear
- Make requested changes or explain why not
- Keep discussions focused on the code

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Checklist

**Pre-Release:**
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Version number is bumped
- [ ] Changelog is updated
- [ ] Breaking changes are documented

**Release:**
- [ ] Create release branch
- [ ] Final testing on release branch
- [ ] Merge to main
- [ ] Create GitHub release
- [ ] Deploy to production

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Celebrate contributions of all sizes

### Communication

**GitHub Issues:**
- Use for bug reports and feature requests
- Search existing issues before creating new ones
- Provide clear, detailed information

**Pull Requests:**
- Use for code contributions
- Follow the PR template
- Respond to review feedback

**Discussions:**
- Use for questions and general discussion
- Help other community members
- Share your projects and experiences

## Getting Help

### Resources

- **Documentation**: Complete guides in `/docs`
- **Examples**: Real-world usage examples
- **API Reference**: Detailed API documentation
- **Architecture**: Technical implementation details

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community help
- **Documentation**: Comprehensive guides and references

### Mentorship

New contributors are welcome! If you're new to:
- **Open Source**: We'll help you learn the process
- **TypeScript/React**: We'll guide you through the codebase
- **IoT/Electronics**: We'll share domain knowledge

## Recognition

### Contributors

All contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special recognition for major features

### Types of Contributions

We value all types of contributions:
- **Code**: Features, bug fixes, improvements
- **Documentation**: Guides, examples, API docs
- **Testing**: Unit tests, integration tests, manual testing
- **Design**: UI/UX improvements, mockups
- **Community**: Helping other users, triaging issues

Thank you for contributing to IoT Inventory Oracle! 🚀

---

**[← Back: Architecture](./architecture.md)** | **[Documentation Home](./README.md)** | **[Next: Changelog →](./changelog.md)**