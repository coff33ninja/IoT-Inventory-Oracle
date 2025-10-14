import React, { useState, useEffect } from 'react';
import { DatasheetSearchResult, ParsedDatasheet, ComponentSpecification } from '../../types';
import DatasheetService from '../../services/datasheetService';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CpuChipIcon,
  BoltIcon
} from '../icons/AnalyticsIcons';

interface DatasheetSearchViewerProps {
  componentName?: string;
  manufacturer?: string;
  category?: string;
  className?: string;
}

const DatasheetSearchViewer: React.FC<DatasheetSearchViewerProps> = ({
  componentName = '',
  manufacturer,
  category,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState(componentName);
  const [searchResults, setSearchResults] = useState<DatasheetSearchResult[]>([]);
  const [selectedDatasheet, setSelectedDatasheet] = useState<DatasheetSearchResult | null>(null);
  const [parsedDatasheet, setParsedDatasheet] = useState<ParsedDatasheet | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'specifications' | 'pinout' | 'electrical'>('search');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (componentName) {
      handleSearch();
    }
  }, [componentName]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    
    try {
      const results = await DatasheetService.searchDatasheets(searchQuery, {
        manufacturer,
        category,
        maxResults: 10
      });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No datasheets found for the specified component');
      }
    } catch (err) {
      setError('Failed to search for datasheets. Please try again.');
      console.error('Datasheet search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDatasheet = async (datasheet: DatasheetSearchResult) => {
    setSelectedDatasheet(datasheet);
    setIsParsing(true);
    setError(null);
    
    try {
      // Check cache first
      const cached = DatasheetService.getCachedDatasheet(datasheet.id);
      if (cached) {
        setParsedDatasheet(cached);
        setActiveTab('specifications');
        return;
      }

      // Parse datasheet
      const parsed = await DatasheetService.parseDatasheet(datasheet.datasheetUrl);
      setParsedDatasheet(parsed);
      
      // Cache the result
      DatasheetService.cacheDatasheet(datasheet.id, parsed);
      
      setActiveTab('specifications');
    } catch (err) {
      setError('Failed to parse datasheet. The document may be corrupted or protected.');
      console.error('Datasheet parsing error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const getSourceIcon = (source: DatasheetSearchResult['source']) => {
    switch (source) {
      case 'local': return DocumentTextIcon;
      case 'octopart': 
      case 'digikey': 
      case 'mouser': return MagnifyingGlassIcon;
      default: return DocumentTextIcon;
    }
  };

  const getSourceColor = (source: DatasheetSearchResult['source']) => {
    switch (source) {
      case 'local': return 'text-green-500 bg-green-900/20';
      case 'octopart': return 'text-blue-500 bg-blue-900/20';
      case 'digikey': return 'text-red-500 bg-red-900/20';
      case 'mouser': return 'text-purple-500 bg-purple-900/20';
      default: return 'text-gray-500 bg-gray-900/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`datasheet-search-viewer ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-3" />
          Datasheet Search & Viewer
        </h2>
        <p className="text-text-secondary">
          Search and analyze component datasheets from multiple sources
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary placeholder-text-secondary"
                placeholder="Enter component name, part number, or description..."
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSearching ? (
              <>
                <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </button>
        </div>
        
        {manufacturer && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-text-secondary">
            <span>Manufacturer: {manufacturer}</span>
            {category && <span>• Category: {category}</span>}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && activeTab === 'search' && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-4">
            {searchResults.map((result) => {
              const SourceIcon = getSourceIcon(result.source);
              const sourceColor = getSourceColor(result.source);
              
              return (
                <div key={result.id} className="p-4 bg-primary rounded-lg border border-border-color">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-text-primary">{result.componentName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${sourceColor}`}>
                          {result.source}
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                          {result.confidence}% match
                        </span>
                      </div>
                      
                      <div className="text-sm text-text-secondary mb-2">
                        <span className="font-medium">Manufacturer:</span> {result.manufacturer}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Part Number:</span> {result.partNumber}
                      </div>
                      
                      <p className="text-sm text-text-secondary mb-3">{result.description}</p>
                      
                      {result.specifications.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {result.specifications.slice(0, 3).map((spec, index) => (
                            <span key={index} className="px-2 py-1 bg-secondary text-xs text-text-primary rounded border border-border-color">
                              {spec.parameter}: {spec.value}{spec.unit && ` ${spec.unit}`}
                            </span>
                          ))}
                          {result.specifications.length > 3 && (
                            <span className="px-2 py-1 bg-secondary text-xs text-text-secondary rounded border border-border-color">
                              +{result.specifications.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleViewDatasheet(result)}
                        disabled={isParsing}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <a
                        href={result.datasheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Datasheet Viewer */}
      {selectedDatasheet && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          {/* Datasheet Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-text-primary">{selectedDatasheet.componentName}</h3>
              <p className="text-text-secondary">
                {selectedDatasheet.manufacturer} • {selectedDatasheet.partNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDatasheet(null);
                setParsedDatasheet(null);
                setActiveTab('search');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Search
            </button>
          </div>

          {/* Loading State */}
          {isParsing && (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-text-primary font-medium">Parsing Datasheet...</p>
              <p className="text-text-secondary">This may take a few moments</p>
            </div>
          )}

          {/* Parsed Datasheet Content */}
          {parsedDatasheet && !isParsing && (
            <>
              {/* Tab Navigation */}
              <div className="mb-6">
                <nav className="flex space-x-8 border-b border-border-color">
                  {[
                    { id: 'specifications', label: 'Specifications', icon: DocumentTextIcon },
                    { id: 'pinout', label: 'Pinout', icon: CpuChipIcon },
                    { id: 'electrical', label: 'Electrical', icon: BoltIcon },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-96">
                {activeTab === 'specifications' && (
                  <div className="space-y-6">
                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-primary p-4 rounded-lg border border-border-color">
                        <h4 className="font-medium text-text-primary mb-3">Document Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Title:</span>
                            <span className="text-text-primary">{parsedDatasheet.metadata.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Revision:</span>
                            <span className="text-text-primary">{parsedDatasheet.metadata.revision}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Date Code:</span>
                            <span className="text-text-primary">{parsedDatasheet.metadata.dateCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Pages:</span>
                            <span className="text-text-primary">{parsedDatasheet.metadata.pages}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary p-4 rounded-lg border border-border-color">
                        <h4 className="font-medium text-text-primary mb-3">Package Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Type:</span>
                            <span className="text-text-primary">{parsedDatasheet.packageInfo.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Pin Count:</span>
                            <span className="text-text-primary">{parsedDatasheet.packageInfo.pinCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Mounting:</span>
                            <span className="text-text-primary">{parsedDatasheet.packageInfo.mountingType}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Table */}
                    <div className="bg-primary p-4 rounded-lg border border-border-color">
                      <h4 className="font-medium text-text-primary mb-4">Technical Specifications</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border-color">
                              <th className="text-left py-2 text-text-primary">Parameter</th>
                              <th className="text-left py-2 text-text-primary">Value</th>
                              <th className="text-left py-2 text-text-primary">Unit</th>
                              <th className="text-left py-2 text-text-primary">Conditions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedDatasheet.specifications.map((spec, index) => (
                              <tr key={index} className="border-b border-border-color">
                                <td className="py-2 text-text-primary font-medium">{spec.parameter}</td>
                                <td className="py-2 text-text-primary">{spec.value}</td>
                                <td className="py-2 text-text-secondary">{spec.unit || '-'}</td>
                                <td className="py-2 text-text-secondary">{spec.conditions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Features and Applications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-primary p-4 rounded-lg border border-border-color">
                        <h4 className="font-medium text-text-primary mb-3">Features</h4>
                        <ul className="space-y-1 text-sm">
                          {parsedDatasheet.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-text-secondary">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-primary p-4 rounded-lg border border-border-color">
                        <h4 className="font-medium text-text-primary mb-3">Applications</h4>
                        <ul className="space-y-1 text-sm">
                          {parsedDatasheet.applications.map((application, index) => (
                            <li key={index} className="flex items-center text-text-secondary">
                              <CpuChipIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                              {application}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pinout' && (
                  <div className="space-y-6">
                    <div className="bg-primary p-4 rounded-lg border border-border-color">
                      <h4 className="font-medium text-text-primary mb-4">Pin Configuration</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border-color">
                              <th className="text-left py-2 text-text-primary">Pin #</th>
                              <th className="text-left py-2 text-text-primary">Name</th>
                              <th className="text-left py-2 text-text-primary">Type</th>
                              <th className="text-left py-2 text-text-primary">Description</th>
                              <th className="text-left py-2 text-text-primary">Voltage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedDatasheet.pinout.map((pin) => (
                              <tr key={pin.pinNumber} className="border-b border-border-color">
                                <td className="py-2 text-text-primary font-medium">{pin.pinNumber}</td>
                                <td className="py-2 text-text-primary font-mono">{pin.pinName}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    pin.pinType === 'power' ? 'bg-red-900/20 text-red-400' :
                                    pin.pinType === 'ground' ? 'bg-gray-900/20 text-gray-400' :
                                    pin.pinType === 'input' ? 'bg-blue-900/20 text-blue-400' :
                                    pin.pinType === 'output' ? 'bg-green-900/20 text-green-400' :
                                    'bg-purple-900/20 text-purple-400'
                                  }`}>
                                    {pin.pinType}
                                  </span>
                                </td>
                                <td className="py-2 text-text-secondary">{pin.description}</td>
                                <td className="py-2 text-text-primary">
                                  {pin.voltage ? `${pin.voltage}V` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'electrical' && (
                  <div className="space-y-6">
                    <div className="bg-primary p-4 rounded-lg border border-border-color">
                      <h4 className="font-medium text-text-primary mb-4">Electrical Characteristics</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border-color">
                              <th className="text-left py-2 text-text-primary">Parameter</th>
                              <th className="text-left py-2 text-text-primary">Symbol</th>
                              <th className="text-left py-2 text-text-primary">Min</th>
                              <th className="text-left py-2 text-text-primary">Typical</th>
                              <th className="text-left py-2 text-text-primary">Max</th>
                              <th className="text-left py-2 text-text-primary">Unit</th>
                              <th className="text-left py-2 text-text-primary">Conditions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedDatasheet.electricalCharacteristics.map((char, index) => (
                              <tr key={index} className="border-b border-border-color">
                                <td className="py-2 text-text-primary">{char.parameter}</td>
                                <td className="py-2 text-text-primary font-mono">{char.symbol}</td>
                                <td className="py-2 text-text-primary">{char.min || '-'}</td>
                                <td className="py-2 text-text-primary font-medium">{char.typical || '-'}</td>
                                <td className="py-2 text-text-primary">{char.max || '-'}</td>
                                <td className="py-2 text-text-secondary">{char.unit}</td>
                                <td className="py-2 text-text-secondary">{char.conditions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operating Conditions */}
                    <div className="bg-primary p-4 rounded-lg border border-border-color">
                      <h4 className="font-medium text-text-primary mb-4">Operating Conditions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-secondary rounded border border-border-color">
                          <div className="text-lg font-bold text-text-primary">
                            {parsedDatasheet.operatingConditions.temperature.min}° to {parsedDatasheet.operatingConditions.temperature.max}°
                          </div>
                          <div className="text-sm text-text-secondary">Temperature Range</div>
                        </div>
                        <div className="text-center p-3 bg-secondary rounded border border-border-color">
                          <div className="text-lg font-bold text-text-primary">
                            {parsedDatasheet.operatingConditions.voltage.min}V to {parsedDatasheet.operatingConditions.voltage.max}V
                          </div>
                          <div className="text-sm text-text-secondary">Supply Voltage</div>
                        </div>
                        {parsedDatasheet.operatingConditions.humidity && (
                          <div className="text-center p-3 bg-secondary rounded border border-border-color">
                            <div className="text-lg font-bold text-text-primary">
                              ≤ {parsedDatasheet.operatingConditions.humidity.max}{parsedDatasheet.operatingConditions.humidity.unit}
                            </div>
                            <div className="text-sm text-text-secondary">Humidity</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DatasheetSearchViewer;