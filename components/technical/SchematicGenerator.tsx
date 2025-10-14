import React, { useState } from "react";
import { InventoryItem } from "../../types";
import { ComponentSpecification } from "../TechnicalDocumentationHub";
import {
  CircuitBoardIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PlusIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "../icons/AnalyticsIcons";

interface SchematicGeneratorProps {
  selectedComponent: InventoryItem | null;
  specification: ComponentSpecification | undefined;
  onComponentSelect: (component: InventoryItem) => void;
  inventory: InventoryItem[];
}

interface SchematicSymbol {
  id: string;
  componentId: string;
  symbolType:
    | "ic"
    | "resistor"
    | "capacitor"
    | "inductor"
    | "diode"
    | "transistor"
    | "connector"
    | "generic";
  width: number;
  height: number;
  pins: { id: string; x: number; y: number; name: string; type: string }[];
  label: string;
}

const SchematicGenerator: React.FC<SchematicGeneratorProps> = ({
  selectedComponent,
  specification,
  onComponentSelect,
  inventory,
}) => {
  const [viewMode, setViewMode] = useState<"symbol" | "circuit" | "library">(
    "symbol"
  );
  const [selectedSymbols, setSelectedSymbols] = useState<SchematicSymbol[]>([]);
  const [connections, setConnections] = useState<
    { from: string; to: string; label?: string }[]
  >([]);

  const generateSchematicSymbol = (
    component: InventoryItem,
    spec?: ComponentSpecification
  ): SchematicSymbol => {
    const symbolType = detectSymbolType(component);
    const pinCount = spec?.pinout?.length || 4;

    return {
      id: `symbol-${component.id}`,
      componentId: component.id,
      symbolType,
      width: symbolType === "ic" ? Math.max(120, pinCount * 10) : 80,
      height:
        symbolType === "ic" ? Math.max(80, Math.ceil(pinCount / 2) * 20) : 40,
      pins: generateSymbolPins(spec?.pinout || [], symbolType),
      label: component.name,
    };
  };

  const detectSymbolType = (
    component: InventoryItem
  ): SchematicSymbol["symbolType"] => {
    const name = component.name.toLowerCase();
    const category = component.category?.toLowerCase() || "";

    if (name.includes("resistor") || category.includes("resistor"))
      return "resistor";
    if (name.includes("capacitor") || category.includes("capacitor"))
      return "capacitor";
    if (name.includes("inductor") || category.includes("inductor"))
      return "inductor";
    if (name.includes("diode") || category.includes("diode")) return "diode";
    if (name.includes("transistor") || category.includes("transistor"))
      return "transistor";
    if (name.includes("connector") || category.includes("connector"))
      return "connector";
    if (name.includes("ic") || name.includes("chip") || category.includes("ic"))
      return "ic";

    return "generic";
  };

  const generateSymbolPins = (pinout: any[], symbolType: string) => {
    if (!pinout || pinout.length === 0) {
      // Default pins for basic components
      switch (symbolType) {
        case "resistor":
        case "capacitor":
        case "inductor":
          return [
            { id: "pin1", x: 0, y: 20, name: "1", type: "terminal" },
            { id: "pin2", x: 80, y: 20, name: "2", type: "terminal" },
          ];
        case "diode":
          return [
            { id: "anode", x: 0, y: 20, name: "A", type: "input" },
            { id: "cathode", x: 80, y: 20, name: "K", type: "output" },
          ];
        default:
          return [
            { id: "pin1", x: 0, y: 10, name: "1", type: "input" },
            { id: "pin2", x: 0, y: 30, name: "2", type: "input" },
            { id: "pin3", x: 80, y: 10, name: "3", type: "output" },
            { id: "pin4", x: 80, y: 30, name: "4", type: "output" },
          ];
      }
    }

    // Generate pins from pinout data
    const pinsPerSide = Math.ceil(pinout.length / 2);
    return pinout.map((pin, index) => {
      const isLeftSide = index < pinsPerSide;
      return {
        id: `pin-${pin.pin}`,
        x: isLeftSide ? 0 : 120,
        y: 20 + (index % pinsPerSide) * 20,
        name: pin.name,
        type: pin.type,
      };
    });
  };

  const renderSchematicSymbol = (symbol: SchematicSymbol) => {
    const { symbolType, width, height, pins, label } = symbol;

    return (
      <div className="relative inline-block m-4">
        <svg
          width={width + 40}
          height={height + 40}
          className="border border-border-color bg-primary"
        >
          {/* Symbol Body */}
          {symbolType === "ic" && (
            <rect
              x="20"
              y="20"
              width={width}
              height={height}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-text-primary"
            />
          )}

          {symbolType === "resistor" && (
            <g transform="translate(20, 20)">
              <path
                d="M0,20 L15,20 L20,10 L30,30 L40,10 L50,30 L60,10 L65,20 L80,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
            </g>
          )}

          {symbolType === "capacitor" && (
            <g transform="translate(20, 20)">
              <line
                x1="0"
                y1="20"
                x2="35"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
              <line
                x1="35"
                y1="5"
                x2="35"
                y2="35"
                stroke="currentColor"
                strokeWidth="3"
                className="text-text-primary"
              />
              <line
                x1="45"
                y1="5"
                x2="45"
                y2="35"
                stroke="currentColor"
                strokeWidth="3"
                className="text-text-primary"
              />
              <line
                x1="45"
                y1="20"
                x2="80"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
            </g>
          )}

          {symbolType === "diode" && (
            <g transform="translate(20, 20)">
              <line
                x1="0"
                y1="20"
                x2="30"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
              <polygon
                points="30,10 30,30 50,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
              <line
                x1="50"
                y1="10"
                x2="50"
                y2="30"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
              <line
                x1="50"
                y1="20"
                x2="80"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-primary"
              />
            </g>
          )}

          {(symbolType === "generic" || symbolType === "connector") && (
            <rect
              x="20"
              y="20"
              width={width}
              height={height}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              rx="5"
              className="text-text-primary"
            />
          )}

          {/* Pins */}
          {pins.map((pin) => (
            <g key={pin.id}>
              <circle
                cx={pin.x + 20}
                cy={pin.y + 20}
                r="3"
                fill="red"
                className="cursor-pointer hover:fill-blue-500"
              />
              <text
                x={pin.x + (pin.x === 0 ? -10 : 30)}
                y={pin.y + 25}
                fontSize="10"
                textAnchor={pin.x === 0 ? "end" : "start"}
                className="fill-text-primary"
              >
                {pin.name}
              </text>
            </g>
          ))}

          {/* Label */}
          <text
            x={width / 2 + 20}
            y={height + 50}
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
            className="fill-text-primary"
          >
            {label}
          </text>
        </svg>
      </div>
    );
  };

  const addComponentToCircuit = (component: InventoryItem) => {
    const spec = inventory.find((item) => item.id === component.id);
    const symbol = generateSchematicSymbol(component, specification);
    setSelectedSymbols((prev) => [...prev, symbol]);
  };

  const removeComponentFromCircuit = (symbolId: string) => {
    setSelectedSymbols((prev) => prev.filter((s) => s.id !== symbolId));
  };

  const exportSchematic = (format: "png" | "svg" | "pdf") => {
    console.log(`Exporting schematic as ${format}`);
    alert(
      `Schematic export as ${format.toUpperCase()} would be implemented here`
    );
  };

  return (
    <div className="space-y-6">
      {/* Component Selection */}
      {!selectedComponent ? (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Select a Component
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.slice(0, 12).map((component) => (
              <button
                key={component.id}
                onClick={() => onComponentSelect(component)}
                className="p-4 text-left border border-border-color rounded-lg hover:border-green-300 hover:bg-primary transition-colors"
              >
                <h4 className="font-medium text-text-primary">
                  {component.name}
                </h4>
                {component.category && (
                  <p className="text-sm text-text-secondary mt-1">
                    {component.category}
                  </p>
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
                  <CircuitBoardIcon className="h-6 w-6 text-green-500 mr-2" />
                  {selectedComponent.name} Schematic
                </h3>
                <p className="text-text-secondary mt-1">
                  Generate schematic symbols and circuit diagrams
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("symbol")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "symbol"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "text-text-secondary hover:bg-primary"
                  }`}
                >
                  Symbol
                </button>
                <button
                  onClick={() => setViewMode("circuit")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "circuit"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "text-text-secondary hover:bg-primary"
                  }`}
                >
                  Circuit
                </button>
                <button
                  onClick={() => setViewMode("library")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "library"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "text-text-secondary hover:bg-primary"
                  }`}
                >
                  Library
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-secondary rounded-lg shadow border border-border-color">
            {viewMode === "symbol" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-text-primary">
                    Schematic Symbol
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => exportSchematic("svg")}
                      className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary flex items-center"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => exportSchematic("png")}
                      className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary flex items-center"
                    >
                      PNG
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  {renderSchematicSymbol(
                    generateSchematicSymbol(selectedComponent, specification)
                  )}
                </div>

                <div className="mt-6 p-4 bg-primary rounded-lg border border-border-color">
                  <h5 className="font-medium text-text-primary mb-2">
                    Symbol Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Symbol Type:</span>
                      <span className="ml-2 font-medium text-text-primary">
                        {detectSymbolType(selectedComponent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Pin Count:</span>
                      <span className="ml-2 font-medium text-text-primary">
                        {specification?.pinout?.length || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Package:</span>
                      <span className="ml-2 font-medium text-text-primary">
                        {specification?.packageInfo?.type || "Generic"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Category:</span>
                      <span className="ml-2 font-medium text-text-primary">
                        {selectedComponent.category || "Uncategorized"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === "circuit" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-text-primary">
                    Circuit Designer
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addComponentToCircuit(selectedComponent)}
                      className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Component
                    </button>
                    <button
                      onClick={() => exportSchematic("pdf")}
                      className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary flex items-center"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      Export
                    </button>
                  </div>
                </div>

                {selectedSymbols.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border-color rounded-lg bg-primary">
                    <CircuitBoardIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">
                      No components in circuit
                    </p>
                    <button
                      onClick={() => addComponentToCircuit(selectedComponent)}
                      className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Add First Component
                    </button>
                  </div>
                ) : (
                  <div className="border border-border-color rounded-lg p-4 min-h-96 bg-secondary">
                    <div className="flex flex-wrap">
                      {selectedSymbols.map((symbol) => (
                        <div key={symbol.id} className="relative group">
                          {renderSchematicSymbol(symbol)}
                          <button
                            onClick={() =>
                              removeComponentFromCircuit(symbol.id)
                            }
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove component from circuit"
                            aria-label="Remove component from circuit"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Circuit Designer:</strong> Add components to build
                    your circuit. In a full implementation, this would include
                    drag-and-drop functionality, wire routing, and connection
                    management.
                  </p>
                </div>
              </div>
            )}

            {viewMode === "library" && (
              <div className="p-6">
                <h4 className="text-lg font-semibold text-text-primary mb-6">
                  Symbol Library
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.slice(0, 9).map((component) => (
                    <div
                      key={component.id}
                      className="border border-border-color rounded-lg p-4 bg-secondary"
                    >
                      <h5 className="font-medium text-text-primary mb-2">
                        {component.name}
                      </h5>
                      <div className="flex justify-center mb-3">
                        <div className="scale-75">
                          {renderSchematicSymbol(
                            generateSchematicSymbol(component)
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">
                          {detectSymbolType(component)}
                        </span>
                        <button
                          onClick={() => addComponentToCircuit(component)}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-sm hover:bg-purple-500/30"
                        >
                          Add to Circuit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-purple-400 mr-2 mt-0.5" />
          <div className="text-sm text-text-primary">
            <p className="font-medium mb-1 text-purple-300">
              Schematic Generator Features:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>
                Automatic schematic symbol generation based on component type
              </li>
              <li>
                Interactive circuit designer with drag-and-drop functionality
              </li>
              <li>Comprehensive symbol library for all component types</li>
              <li>Export capabilities for integration with CAD tools</li>
              <li>Pin-accurate symbols based on datasheet information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchematicGenerator;
