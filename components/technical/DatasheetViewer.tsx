import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { TechnicalDocument } from '../TechnicalDocumentationHub';
import { 
  DocumentTextIcon,
  LinkIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CalendarIcon,
  LanguageIcon,
  TagIcon
} from '../icons/AnalyticsIcons';

interface DatasheetViewerProps {
  selectedComponent: InventoryItem | null;
  documents: TechnicalDocument[];
  onComponentSelect: (component: InventoryItem) => void;
  inventory: InventoryItem[];
}

const DatasheetViewer: React.FC<DatasheetViewerProps> = ({
  selectedComponent,
  documents,
  onComponentSelect,
  inventory
}) => {
  const [selectedDocument, setSelectedDocument] = useState<TechnicalDocument | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('list');

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'datasheet': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manual': return 'bg-green-100 text-green-800 border-green-200';
      case 'schematic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pinout': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'example': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'tutorial': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

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

  const handleDocumentOpen = (document: TechnicalDocument) => {
    // In a real implementation, this would open the document
    // For now, we'll just show a preview or open in new tab
    if (document.url.startsWith('http')) {
      window.open(document.url, '_blank');
    } else {
      setSelectedDocument(document);
      setViewMode('preview');
    }
  };

  const parseDatasheetContent = async (document: TechnicalDocument) => {
    try {
      // Parse datasheet content using API
      const response = await fetch(`/api/technical/parse-datasheet/${document.id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to parse datasheet:', error);
    }
    
    // Return empty structure if parsing fails
    return {
      extractedSpecs: {},
      features: [],
      applications: [],
      pinCount: 0,
      packageType: 'Unknown'
    };
  };

  return (
    <div className="space-y-6">
      {/* Component Selection */}
      {!selectedComponent ? (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Select a Component</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.slice(0, 12).map(component => (
              <button
                type="button"
                key={component.id}
                onClick={() => onComponentSelect(component)}
                className="p-4 text-left border border-border-color rounded-lg hover:border-green-300 hover:bg-primary transition-colors"
              >
                <h4 className="font-medium text-text-primary">{component.name}</h4>
                {component.category && (
                  <p className="text-sm text-text-secondary mt-1">{component.category}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Selected Component Header */}
          <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedComponent.name}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                  {selectedComponent.category && (
                    <span className="px-2 py-1 bg-primary rounded border border-border-color">{selectedComponent.category}</span>
                  )}
                  <span>{documents.length} document{documents.length !== 1 ? 's' : ''} available</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onComponentSelect(null as any)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Change Component
              </button>
            </div>
          </div>

          {/* Documents List */}
          {documents.length === 0 ? (
            <div className="bg-secondary p-8 rounded-lg shadow border border-border-color text-center">
              <DocumentTextIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Documents Available</h3>
              <p className="text-text-secondary">
                No technical documentation found for {selectedComponent.name}.
              </p>
              <button 
                type="button"
                className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-green-600 transition-colors">
                Request Documentation
              </button>
            </div>
          ) : (
            <div className="bg-secondary rounded-lg shadow border border-border-color">
              <div className="p-4 border-b border-border-color">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Available Documents</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'list' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-primary'
                      }`}
                    >
                      List View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'preview' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-primary'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'list' ? (
                <div className="divide-y divide-border-color">
                  {documents.map(document => (
                    <div key={document.id} className="p-4 hover:bg-primary transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(document.type)}`}>
                              {getDocumentTypeIcon(document.type)} {document.type}
                            </span>
                            <h4 className="font-medium text-text-primary">{document.title}</h4>
                          </div>
                          
                          {document.description && (
                            <p className="text-sm text-text-secondary mb-2">{document.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-text-secondary">
                            {document.fileSize && (
                              <span className="flex items-center">
                                <DocumentTextIcon className="h-3 w-3 mr-1" />
                                {document.fileSize}
                              </span>
                            )}
                            {document.language && (
                              <span className="flex items-center">
                                <LanguageIcon className="h-3 w-3 mr-1" />
                                {document.language}
                              </span>
                            )}
                            {document.lastUpdated && (
                              <span className="flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {new Date(document.lastUpdated).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <TagIcon className="h-3 w-3 text-text-secondary" />
                              {document.tags.map(tag => (
                                <span key={tag} className="px-1 py-0.5 bg-primary text-text-secondary text-xs rounded border border-border-color">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            type="button"
                            onClick={() => setSelectedDocument(document)}
                            className="p-2 text-text-secondary hover:text-text-primary"
                            title="Preview"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDocumentOpen(document)}
                            className="p-2 text-accent hover:text-green-700"
                            title="Open Document"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-green-500 hover:text-green-700"
                            title="Download"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Preview Mode */
                <div className="p-6">
                  {selectedDocument ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-text-primary">{selectedDocument.title}</h4>
                        <button
                          type="button"
                          onClick={() => handleDocumentOpen(selectedDocument)}
                          className="px-4 py-2 bg-accent text-white rounded hover:bg-green-600 flex items-center"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Open Full Document
                        </button>
                      </div>
                      
                      {/* Parsed Content Preview */}
                      {selectedDocument.type === 'datasheet' && (
                        <div className="text-center py-8">
                          <DocumentTextIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                          <p className="text-text-secondary">Datasheet parsing would extract specifications here</p>
                          <button 
                            type="button"
                            onClick={() => parseDatasheetContent(selectedDocument)}
                            className="mt-2 px-4 py-2 bg-accent text-white rounded hover:bg-green-600"
                          >
                            Parse Datasheet
                          </button>
                        </div>
                      )}
                      
                      {/* Document Preview Placeholder */}
                      <div className="border-2 border-dashed border-border-color rounded-lg p-8 text-center">
                        <DocumentTextIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary">Document preview would appear here</p>
                        <p className="text-sm text-text-secondary mt-2">
                          In a full implementation, this would show PDF preview, extracted text, or embedded viewer
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                      <p className="text-text-secondary">Select a document to preview</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Auto-parsing Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <DocumentTextIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Automatic Datasheet Parsing:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-600">
              <li>Specifications are automatically extracted from PDF datasheets</li>
              <li>Key features and applications are identified using AI</li>
              <li>Pinout information is parsed and structured</li>
              <li>Operating conditions and electrical characteristics are captured</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasheetViewer;