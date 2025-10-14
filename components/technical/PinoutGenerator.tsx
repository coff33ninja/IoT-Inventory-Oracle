import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { ComponentSpecification, PinConfiguration } from '../TechnicalDocumentationHub';
import { 
  CpuChipIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PrinterIcon,
  ShareIcon,
  InformationCircleIcon
} from '../icons/AnalyticsIcons';

interface PinoutGeneratorProps {
  selectedComponent: InventoryItem | null;
  specification: ComponentSpecification | undefined;
  onComponentSelect: (component: InventoryItem) => void;
  inventory: InventoryItem[];
}

const PinoutGenerator: React.FC<PinoutGeneratorProps> = ({
  selectedComponent,
  specification,
  onComponentSelect,
  inventory
}) => {
  const [viewMode, setViewMode] = useState<'diagram' | 'table'>('diagram');
  const [selectedPin, setSelectedPin] = useState<PinConfiguration | null>(null);

  const getPinTypeColor = (type: string) => {
    switch (type) {
      case 'power': return 'bg-red-100 text-red-800 border-red-200';
      case 'ground': return 'bg-green-100 text-green-800 border-green-200';
      case 'input': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'output': return 'bg-green-100 text-green-800 border-green-200';
      case 'bidirectional': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'analog': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'digital': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPinTypeSymbol = (type: string) => {
    switch (type) {
      case 'power': return '⚡';
      case 'ground': return '⏚';
      case 'input': return '→';
      case 'output': return '←';
      case 'bidirectional': return '↔';
      case 'analog': return '~';
      case 'digital': return '□';
      default: return '○';
    }
  };

  const generatePinoutDiagram = () => {
    if (!specification?.pinout) return null;

    const pins = specification.pinout;
    const pinsPerSide = Math.ceil(pins.length / 2);
    const leftPins = pins.slice(0, pinsPerSide);
    const rightPins = pins.slice(pinsPerSide).reverse();

    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          {/* IC Package */}
          <div className="bg-gray-800 rounded-lg p-8 min-w-80 min-h-60 flex items-center justify-center relative">
            {/* IC Label */}
            <div className="text-white text-center">
              <div className="text-lg font-bold">{selectedComponent?.name}</div>
              <div className="text-sm opacity-75">{specification.packageInfo?.type}</div>
              {specification.packageInfo?.pinCount && (
                <div className="text-xs opacity-50">{specification.packageInfo.pinCount} pins</div>
              )}
            </div>
            
            {/* Pin 1 Indicator */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          
          {/* Left Side Pins */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-around -ml-24">
            {leftPins.map((pin, index) => (
              <div
                key={`left-${pin.pin}`}
                className="flex items-center cursor-pointer group"
                onClick={() => setSelectedPin(pin)}
              >
                <div className="text-right mr-2 min-w-16">
                  <div className="text-xs font-medium text-text-primary">{pin.name}</div>
                  <div className="text-xs text-text-secondary">{pin.pin}</div>
                </div>
                <div className={`w-6 h-1 ${getPinTypeColor(pin.type).split(' ')[0]} group-hover:bg-blue-400 transition-colors`}></div>
              </div>
            ))}
          </div>
          
          {/* Right Side Pins */}
          <div className="absolute right-0 top-0 h-full flex flex-col justify-around -mr-24">
            {rightPins.map((pin, index) => (
              <div
                key={`right-${pin.pin}`}
                className="flex items-center cursor-pointer group"
                onClick={() => setSelectedPin(pin)}
              >
                <div className={`w-6 h-1 ${getPinTypeColor(pin.type).split(' ')[0]} group-hover:bg-blue-400 transition-colors`}></div>
                <div className="text-left ml-2 min-w-16">
                  <div className="text-xs font-medium text-text-primary">{pin.name}</div>
                  <div className="text-xs text-text-secondary">{pin.pin}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const exportPinout = (format: 'png' | 'pdf' | 'svg') => {
    // In a real implementation, this would generate and download the pinout diagram
    console.log(`Exporting pinout as ${format}`);
    alert(`Pinout export as ${format.toUpperCase()} would be implemented here`);
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
          {/* Component Header */}
          <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-text-primary flex items-center">
                  <CpuChipIcon className="h-6 w-6 text-green-500 mr-2" />
                  {selectedComponent.name} Pinout
                </h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                  {specification?.packageInfo && (
                    <>
                      <span className="px-2 py-1 bg-primary rounded border border-border-color">{specification.packageInfo.type}</span>
                      <span>{specification.packageInfo.pinCount} pins</span>
                      {specification.packageInfo.dimensions && (
                        <span>{specification.packageInfo.dimensions}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('diagram')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'diagram' ? 'bg-green-100 text-green-800' : 'text-text-secondary hover:bg-primary'
                  }`}
                >
                  <EyeIcon className="h-4 w-4 mr-1 inline" />
                  Diagram
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'table' ? 'bg-green-100 text-green-800' : 'text-text-secondary hover:bg-primary'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Pinout Content */}
          {!specification?.pinout ? (
            <div className="bg-secondary p-8 rounded-lg shadow border border-border-color text-center">
              <CpuChipIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Pinout Available</h3>
              <p className="text-text-secondary">
                Pinout information for {selectedComponent.name} is not available.
              </p>
              <button type="button" className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-green-600">
                Generate from Datasheet
              </button>
            </div>
          ) : (
            <div className="bg-secondary rounded-lg shadow border border-border-color">
              {/* Controls */}
              <div className="p-4 border-b border-border-color">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-text-primary">
                    Pinout {viewMode === 'diagram' ? 'Diagram' : 'Table'}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => exportPinout('png')}
                      className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary flex items-center"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPinout('pdf')}
                      className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary flex items-center"
                    >
                      <PrinterIcon className="h-4 w-4 mr-1" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPinout('svg')}
                      className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary flex items-center"
                    >
                      <ShareIcon className="h-4 w-4 mr-1" />
                      SVG
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'diagram' ? (
                <div>
                  {generatePinoutDiagram()}
                  
                  {/* Pin Legend */}
                  <div className="p-4 border-t border-border-color">
                    <h5 className="font-medium text-text-primary mb-3">Pin Types</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Array.from(new Set(specification.pinout.map(p => p.type))).map(type => (
                        <div key={type} className="flex items-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium border mr-2 ${getPinTypeColor(type)}`}>
                            {getPinTypeSymbol(type)}
                          </span>
                          <span className="text-sm text-text-primary capitalize">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-primary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Pin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Voltage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-secondary divide-y divide-border-color">
                      {specification.pinout.map((pin, index) => (
                        <tr
                          key={pin.pin}
                          className={`hover:bg-primary cursor-pointer ${
                            selectedPin?.pin === pin.pin ? 'bg-green-500/10 border border-green-500/20' : ''
                          }`}
                          onClick={() => setSelectedPin(pin)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                            {pin.pin}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                            {pin.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPinTypeColor(pin.type)}`}>
                              {getPinTypeSymbol(pin.type)} {pin.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                            {pin.voltage ? `${pin.voltage}V` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-primary">
                            {pin.description}
                            {pin.alternateFunction && (
                              <div className="text-xs text-text-secondary mt-1">
                                Alt: {pin.alternateFunction}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Selected Pin Details */}
          {selectedPin && (
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <h4 className="text-lg font-semibold text-text-primary mb-4">
                Pin {selectedPin.pin} - {selectedPin.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-text-primary mb-2">Pin Information</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Pin Number:</span>
                      <span className="font-medium text-text-primary">{selectedPin.pin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Pin Name:</span>
                      <span className="font-medium text-text-primary">{selectedPin.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Type:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPinTypeColor(selectedPin.type)}`}>
                        {getPinTypeSymbol(selectedPin.type)} {selectedPin.type}
                      </span>
                    </div>
                    {selectedPin.voltage && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Voltage:</span>
                        <span className="font-medium text-text-primary">{selectedPin.voltage}V</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-text-primary mb-2">Description</h5>
                  <p className="text-sm text-text-primary">{selectedPin.description}</p>
                  {selectedPin.alternateFunction && (
                    <div className="mt-3">
                      <h6 className="font-medium text-text-primary text-sm">Alternate Function</h6>
                      <p className="text-sm text-text-secondary">{selectedPin.alternateFunction}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Help Section */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-medium mb-1">Pinout Generator Features:</p>
            <ul className="list-disc list-inside space-y-1 text-green-600">
              <li>Interactive pinout diagrams with hover details</li>
              <li>Comprehensive pin tables with type and voltage information</li>
              <li>Export capabilities (PNG, PDF, SVG formats)</li>
              <li>Pin type color coding and symbols</li>
              <li>Detailed pin descriptions and alternate functions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinoutGenerator;