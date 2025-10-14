import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { TechnicalDocument } from '../TechnicalDocumentationHub';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  LinkIcon,
  FunnelIcon,
  XMarkIcon
} from '../icons/AnalyticsIcons';

interface DocumentationSearchProps {
  inventory: InventoryItem[];
  documents: TechnicalDocument[];
  onComponentSelect: (component: InventoryItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DocumentationSearch: React.FC<DocumentationSearchProps> = ({
  inventory,
  documents,
  onComponentSelect,
  searchQuery,
  onSearchChange
}) => {
  const [selectedFilters, setSelectedFilters] = useState<{
    documentType: string[];
    category: string[];
    hasDocuments: boolean | null;
  }>({
    documentType: [],
    category: [],
    hasDocuments: null
  });

  const documentTypes = ['datasheet', 'manual', 'schematic', 'pinout', 'example', 'tutorial'];
  const categories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean))) as string[];

  const handleFilterChange = (filterType: keyof typeof selectedFilters, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleDocumentTypeFilter = (type: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      documentType: prev.documentType.includes(type)
        ? prev.documentType.filter(t => t !== type)
        : [...prev.documentType, type]
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      documentType: [],
      category: [],
      hasDocuments: null
    });
  };



  const filteredInventory = inventory.filter(item => {
    // Text search
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedFilters.category.length === 0 ||
      (item.category && selectedFilters.category.includes(item.category));

    // Has documents filter
    const componentDocuments = documents.filter(doc => doc.componentId === item.id);
    const matchesHasDocuments = selectedFilters.hasDocuments === null ||
      (selectedFilters.hasDocuments && componentDocuments.length > 0) ||
      (!selectedFilters.hasDocuments && componentDocuments.length === 0);

    // Document type filter
    const matchesDocumentType = selectedFilters.documentType.length === 0 ||
      componentDocuments.some(doc => selectedFilters.documentType.includes(doc.type));

    return matchesSearch && matchesCategory && matchesHasDocuments && matchesDocumentType;
  });

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'datasheet': return '📋';
      case 'manual': return '📖';
      case 'schematic': return '🔌';
      case 'pinout': return '🔗';
      case 'example': return '💻';
      case 'tutorial': return '🎓';
      default: return '📄';
    }
  };

  const hasActiveFilters = () => {
    return selectedFilters.documentType.length > 0 ||
           selectedFilters.category.length > 0 ||
           selectedFilters.hasDocuments !== null;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-primary text-text-primary"
            placeholder="Search components by name, category, or description..."
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-text-secondary mr-2" />
            <h3 className="text-lg font-medium text-text-primary">Filters</h3>
            {hasActiveFilters() && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>
          {hasActiveFilters() && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-text-secondary hover:text-text-primary flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Document Type Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Document Types
            </label>
            <div className="space-y-2">
              {documentTypes.map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.documentType.includes(type)}
                    onChange={() => toggleDocumentTypeFilter(type)}
                    className="rounded border-border-color text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-text-primary flex items-center">
                    <span className="mr-1">{getDocumentTypeIcon(type)}</span>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Categories
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {categories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.category.includes(category)}
                    onChange={() => toggleCategoryFilter(category)}
                    className="rounded border-border-color text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-text-primary">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Documentation Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Documentation Status
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasDocuments"
                  checked={selectedFilters.hasDocuments === null}
                  onChange={() => handleFilterChange('hasDocuments', null)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-text-primary">All Components</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasDocuments"
                  checked={selectedFilters.hasDocuments === true}
                  onChange={() => handleFilterChange('hasDocuments', true)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-text-primary">With Documentation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasDocuments"
                  checked={selectedFilters.hasDocuments === false}
                  onChange={() => handleFilterChange('hasDocuments', false)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-text-primary">Without Documentation</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-secondary rounded-lg shadow border border-border-color">
        <div className="p-4 border-b border-border-color">
          <h3 className="text-lg font-medium text-text-primary">
            Search Results ({filteredInventory.length} components)
          </h3>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-8 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No components found matching your criteria</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-accent hover:text-green-700"
            >
              Clear filters to see all components
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-color">
            {filteredInventory.map(component => {
              const componentDocuments = documents.filter(doc => doc.componentId === component.id);
              const documentCount = componentDocuments.length;
              
              return (
                <div
                  key={component.id}
                  className="p-4 hover:bg-primary cursor-pointer transition-colors"
                  onClick={() => onComponentSelect(component)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-text-primary">{component.name}</h4>
                        {component.category && (
                          <span className="px-2 py-1 bg-primary text-text-secondary text-xs rounded-full border border-border-color">
                            {component.category}
                          </span>
                        )}
                      </div>
                      {component.description && (
                        <p className="text-sm text-text-secondary mt-1">{component.description}</p>
                      )}
                      
                      {/* Document Types Available */}
                      {componentDocuments.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          <DocumentTextIcon className="h-4 w-4 text-text-secondary" />
                          <div className="flex space-x-1">
                            {Array.from(new Set(componentDocuments.map(doc => doc.type))).map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded border border-green-200"
                                title={type}
                              >
                                {getDocumentTypeIcon(type)} {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {documentCount > 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {documentCount} doc{documentCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-primary text-text-secondary text-sm rounded-full border border-border-color">
                            No docs
                          </span>
                        )}
                        <LinkIcon className="h-4 w-4 text-text-secondary" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <DocumentTextIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-medium mb-1">Quick Actions:</p>
            <ul className="list-disc list-inside space-y-1 text-green-600">
              <li>Click on any component to view its technical documentation</li>
              <li>Use filters to find components with specific document types</li>
              <li>Search by component name, category, or description</li>
              <li>Filter by documentation availability to find gaps</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationSearch;