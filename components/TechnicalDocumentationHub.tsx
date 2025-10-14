import React, { useState, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { InventoryItem } from '../types';
import DatasheetViewer from './technical/DatasheetViewer';
import PinoutGenerator from './technical/PinoutGenerator';
import SchematicGenerator from './technical/SchematicGenerator';
import TechnicalSpecsPanel from './technical/TechnicalSpecsPanel';
import DocumentationSearch from './technical/DocumentationSearch';
import { 
  DocumentTextIcon,
  CpuChipIcon,
  CircuitBoardIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  DocumentArrowDownIcon
} from './icons/AnalyticsIcons';

interface TechnicalDocumentationHubProps {
  className?: string;
}

export interface TechnicalDocument {
  id: string;
  componentId: string;
  type: 'datasheet' | 'manual' | 'schematic' | 'pinout' | 'example' | 'tutorial';
  title: string;
  url: string;
  description?: string;
  fileSize?: string;
  language?: string;
  lastUpdated?: string;
  tags?: string[];
}

export interface ComponentSpecification {
  componentId: string;
  specifications: {
    [key: string]: string | number | boolean;
  };
  pinout?: PinConfiguration[];
  operatingConditions?: {
    voltage?: { min: number; max: number; unit: string };
    current?: { max: number; unit: string };
    temperature?: { min: number; max: number; unit: string };
    frequency?: { min: number; max: number; unit: string };
  };
  features?: string[];
  applications?: string[];
  packageInfo?: {
    type: string;
    dimensions?: string;
    pinCount?: number;
  };
}

export interface PinConfiguration {
  pin: number | string;
  name: string;
  type: 'input' | 'output' | 'bidirectional' | 'power' | 'ground' | 'analog' | 'digital';
  voltage?: number;
  description?: string;
  alternateFunction?: string;
}

const TechnicalDocumentationHub: React.FC<TechnicalDocumentationHubProps> = ({ 
  className = '' 
}) => {
  const { inventory } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'search' | 'datasheets' | 'pinouts' | 'schematics' | 'specs'>('search');
  const [selectedComponent, setSelectedComponent] = useState<InventoryItem | null>(null);
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [specifications, setSpecifications] = useState<ComponentSpecification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTechnicalData();
  }, []);

  const loadTechnicalData = async () => {
    setIsLoading(true);
    try {
      // Load technical documentation from API
      const [documentsResponse, specificationsResponse] = await Promise.all([
        fetch('/api/technical/documents'),
        fetch('/api/technical/specifications')
      ]);
      
      if (documentsResponse.ok && specificationsResponse.ok) {
        const documentsData = await documentsResponse.json();
        const specificationsData = await specificationsResponse.json();
        
        setDocuments(documentsData);
        setSpecifications(specificationsData);
      }
    } catch (error) {
      console.error('Failed to load technical data:', error);
      // Fallback to empty arrays if API fails
      setDocuments([]);
      setSpecifications([]);
    } finally {
      setIsLoading(false);
    }
  };



  const getDocumentsForComponent = (componentId: string) => {
    return documents.filter(doc => doc.componentId === componentId);
  };

  const getSpecificationForComponent = (componentId: string) => {
    return specifications.find(spec => spec.componentId === componentId);
  };

  const handleComponentSelect = (component: InventoryItem) => {
    setSelectedComponent(component);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <DocumentationSearch
            inventory={filteredInventory}
            documents={documents}
            onComponentSelect={handleComponentSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
        
      case 'datasheets':
        return (
          <DatasheetViewer
            selectedComponent={selectedComponent}
            documents={getDocumentsForComponent(selectedComponent?.id || '')}
            onComponentSelect={handleComponentSelect}
            inventory={inventory}
          />
        );
        
      case 'pinouts':
        return (
          <PinoutGenerator
            selectedComponent={selectedComponent}
            specification={getSpecificationForComponent(selectedComponent?.id || '')}
            onComponentSelect={handleComponentSelect}
            inventory={inventory}
          />
        );
        
      case 'schematics':
        return (
          <SchematicGenerator
            selectedComponent={selectedComponent}
            specification={getSpecificationForComponent(selectedComponent?.id || '')}
            onComponentSelect={handleComponentSelect}
            inventory={inventory}
          />
        );
        
      case 'specs':
        return (
          <TechnicalSpecsPanel
            selectedComponent={selectedComponent}
            specification={getSpecificationForComponent(selectedComponent?.id || '')}
            onComponentSelect={handleComponentSelect}
            inventory={inventory}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`technical-documentation-hub ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-500 mr-3" />
              Technical Documentation
            </h1>
            <p className="text-text-secondary">Access datasheets, pinouts, schematics, and technical specifications</p>
          </div>
          <button
            type="button"
            onClick={loadTechnicalData}
            disabled={isLoading}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <DocumentTextIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Documents</p>
              <p className="text-2xl font-semibold text-text-primary">{documents.length}</p>
              <p className="text-xs text-text-secondary">Available resources</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <CpuChipIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Components</p>
              <p className="text-2xl font-semibold text-text-primary">{specifications.length}</p>
              <p className="text-xs text-text-secondary">With specifications</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <CircuitBoardIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Pinout Diagrams</p>
              <p className="text-2xl font-semibold text-text-primary">
                {specifications.filter(s => s.pinout && s.pinout.length > 0).length}
              </p>
              <p className="text-xs text-text-secondary">Available</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <LinkIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">External Links</p>
              <p className="text-2xl font-semibold text-text-primary">
                {documents.filter(d => d.url.startsWith('http')).length}
              </p>
              <p className="text-xs text-text-secondary">To resources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-border-color">
          {[
            { id: 'search', label: 'Search & Browse', icon: MagnifyingGlassIcon },
            { id: 'datasheets', label: 'Datasheets', icon: DocumentTextIcon },
            { id: 'pinouts', label: 'Pinout Diagrams', icon: CpuChipIcon },
            { id: 'schematics', label: 'Schematics', icon: CircuitBoardIcon },
            { id: 'specs', label: 'Specifications', icon: DocumentTextIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading technical documentation...</p>
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex items-start">
          <DocumentTextIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div className="text-sm text-text-primary">
            <p className="font-medium mb-1 text-blue-300">Technical Documentation Features:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Search and browse component documentation and datasheets</li>
              <li>View and generate pinout diagrams with detailed pin descriptions</li>
              <li>Access schematic symbols and connection diagrams</li>
              <li>Browse detailed technical specifications and operating conditions</li>
              <li>Link to external resources, code examples, and tutorials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDocumentationHub;