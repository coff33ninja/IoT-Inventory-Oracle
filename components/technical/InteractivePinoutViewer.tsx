import React, { useState, useEffect, useRef } from "react";
import { PinoutDiagram, PinoutPin, InteractiveElement } from "../../types";
import PinoutGeneratorService from "../../services/pinoutGeneratorService";
import {
  CpuChipIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  CircuitBoardIcon,
} from "../icons/AnalyticsIcons";

interface InteractivePinoutViewerProps {
  componentName?: string;
  pinoutData?: PinoutDiagram;
  className?: string;
  onPinSelect?: (pin: PinoutPin) => void;
}

const InteractivePinoutViewer: React.FC<InteractivePinoutViewerProps> = ({
  componentName,
  pinoutData,
  className = "",
  onPinSelect,
}) => {
  const [diagram, setDiagram] = useState<PinoutDiagram | null>(
    pinoutData || null
  );
  const [selectedPin, setSelectedPin] = useState<PinoutPin | null>(null);
  const [hoveredPin, setHoveredPin] = useState<PinoutPin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const [viewSettings, setViewSettings] = useState({
    showPinNumbers: true,
    showPinNames: true,
    colorCodeByType: true,
    showTooltips: true,
    showPowerAnalysis: false,
    highlightActiveGroups: false,
    theme: "auto" as "light" | "dark" | "auto",
    scale: 1.0,
  });

  useEffect(() => {
    if (componentName && !pinoutData) {
      generatePinoutFromName();
    }
  }, [componentName]);

  const generatePinoutFromName = async () => {
    if (!componentName) return;

    setIsLoading(true);
    setError(null);

    try {
      const generatedDiagram =
        await PinoutGeneratorService.generateFromComponentName(componentName, {
          includeLabels: true,
          showPinNumbers: viewSettings.showPinNumbers,
          showPinNames: viewSettings.showPinNames,
          colorCodeByType: viewSettings.colorCodeByType,
          includeTooltips: viewSettings.showTooltips,
          theme: viewSettings.theme,
          scale: viewSettings.scale,
          format: "svg",
        });

      if (generatedDiagram) {
        setDiagram(generatedDiagram);
      } else {
        setError("Could not generate pinout for this component");
      }
    } catch (err) {
      setError("Failed to generate pinout diagram");
      console.error("Pinout generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinClick = (pin: PinoutPin) => {
    setSelectedPin(pin);
    if (onPinSelect) {
      onPinSelect(pin);
    }
  };

  const handlePinHover = (pin: PinoutPin | null) => {
    setHoveredPin(pin);

    // Enhanced interactivity using svgRef for future SVG manipulation
    if (svgRef.current && pin) {
      // Future: Could highlight corresponding SVG elements
      console.debug(`Hovering pin ${pin.number}: ${pin.name}`);
    }
  };

  const getInteractiveElements = (): InteractiveElement[] => {
    if (!diagram) return [];

    // Use the interactive elements from the diagram for enhanced tooltips and highlighting
    return diagram.interactiveElements.filter((element) => {
      if (viewSettings.highlightActiveGroups && selectedPin) {
        return element.pinNumber === selectedPin.number;
      }
      return viewSettings.showTooltips;
    });
  };

  const handleSettingsChange = (newSettings: Partial<typeof viewSettings>) => {
    setViewSettings((prev) => ({ ...prev, ...newSettings }));

    // Regenerate diagram with new settings if we have component name
    if (componentName) {
      generatePinoutFromName();
    }
  };

  const getFilteredPins = () => {
    if (!diagram) return [];

    let filteredPins = diagram.pins;

    // Filter by search query
    if (searchQuery) {
      filteredPins = filteredPins.filter(
        (pin) =>
          pin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pin.number.toString().includes(searchQuery)
      );
    }

    // Filter by group
    if (filterGroup !== "all") {
      filteredPins = filteredPins.filter((pin) => pin.group === filterGroup);
    }

    return filteredPins;
  };

  const getUniqueGroups = () => {
    if (!diagram) return [];

    const groups = new Set(
      diagram.pins.map((pin) => pin.group).filter(Boolean)
    );
    return Array.from(groups).sort();
  };

  const handleExport = (format: "svg" | "png" | "pdf") => {
    if (!diagram) return;

    try {
      const exported = PinoutGeneratorService.exportPinoutDiagram(
        diagram,
        format
      );

      if (typeof exported === "string") {
        // SVG export
        const blob = new Blob([exported], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${diagram.componentName}_pinout.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Binary export (PNG/PDF)
        const url = URL.createObjectURL(exported);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${diagram.componentName}_pinout.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className={`interactive-pinout-viewer ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CpuChipIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-text-primary">Generating pinout diagram...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`interactive-pinout-viewer ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CircuitBoardIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">{error}</p>
            <button
              type="button"
              onClick={generatePinoutFromName}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className={`interactive-pinout-viewer ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CpuChipIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-primary">No pinout data available</p>
            <p className="text-text-secondary">
              Provide a component name or pinout data to view the diagram
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredPins = getFilteredPins();
  const groups = getUniqueGroups();

  return (
    <div className={`interactive-pinout-viewer ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center">
              <CpuChipIcon className="h-8 w-8 text-blue-500 mr-3" />
              Interactive Pinout Viewer
            </h2>
            <p className="text-text-secondary">
              {diagram.componentName} • {diagram.packageType} •{" "}
              {diagram.pinCount} pins
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-text-secondary hover:text-text-primary rounded"
              title="Settings">
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                onClick={() => handleExport("svg")}>
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-secondary p-4 rounded-lg shadow border border-border-color mb-6">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary placeholder-text-secondary"
                placeholder="Search pins by name, number, or description..."
              />
            </div>
          </div>

          {/* Group Filter */}
          <div>
            <label htmlFor="group-filter" className="sr-only">
              Filter by pin group
            </label>
            <select
              id="group-filter"
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 bg-primary border border-border-color rounded-lg text-text-primary"
              title="Filter pins by group">
              <option value="all">All Groups</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-secondary p-4 rounded-lg shadow border border-border-color mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Display Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showPinNumbers}
                onChange={(e) =>
                  handleSettingsChange({ showPinNumbers: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-text-primary">Show pin numbers</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showPinNames}
                onChange={(e) =>
                  handleSettingsChange({ showPinNames: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-text-primary">Show pin names</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.colorCodeByType}
                onChange={(e) =>
                  handleSettingsChange({ colorCodeByType: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-text-primary">Color code by type</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showTooltips}
                onChange={(e) =>
                  handleSettingsChange({ showTooltips: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-text-primary">Show tooltips</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.showPowerAnalysis}
                onChange={(e) =>
                  handleSettingsChange({ showPowerAnalysis: e.target.checked })
                }
                className="mr-2"
              />
              <BoltIcon className="h-4 w-4 mr-1 text-yellow-500" />
              <span className="text-text-primary">Power analysis</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={viewSettings.highlightActiveGroups}
                onChange={(e) =>
                  handleSettingsChange({
                    highlightActiveGroups: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <EyeIcon className="h-4 w-4 mr-1 text-blue-500" />
              <span className="text-text-primary">Highlight groups</span>
            </label>
          </div>

          <div className="mt-4">
            <label
              htmlFor="scale-slider"
              className="block text-sm font-medium text-text-primary mb-2">
              Scale: {viewSettings.scale.toFixed(1)}x
            </label>
            <input
              id="scale-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={viewSettings.scale}
              onChange={(e) =>
                handleSettingsChange({ scale: parseFloat(e.target.value) })
              }
              className="w-full"
              title={`Adjust diagram scale: ${viewSettings.scale.toFixed(1)}x`}
              aria-label={`Diagram scale: ${viewSettings.scale.toFixed(1)}x`}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pinout Diagram */}
        <div className="lg:col-span-2">
          <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Pinout Diagram
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleExport("svg")}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                  SVG
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("png")}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                  PNG
                </button>
              </div>
            </div>

            <div className="overflow-auto">
              <div
                ref={svgRef}
                dangerouslySetInnerHTML={{ __html: diagram.svgData }}
                className="pinout-svg-container"
                style={
                  {
                    "--scale": viewSettings.scale,
                    transform: `scale(var(--scale))`,
                    transformOrigin: "top left",
                  } as React.CSSProperties
                }
              />
              {/* Interactive elements overlay for enhanced functionality */}
              {getInteractiveElements().length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {getInteractiveElements().map((element) => (
                    <div
                      key={element.id}
                      className="absolute bg-blue-500/20 border border-blue-500/40 rounded"
                      // Inline styles required for dynamic positioning based on diagram coordinates
                      style={{
                        left: element.bounds.x,
                        top: element.bounds.y,
                        width: element.bounds.width,
                        height: element.bounds.height,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pin Information */}
        <div className="space-y-6">
          {/* Selected Pin Details */}
          {selectedPin && (
            <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                Pin Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Pin Number:</span>
                  <span className="text-text-primary font-medium">
                    {selectedPin.number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Name:</span>
                  <span className="text-text-primary font-medium">
                    {selectedPin.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Type:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedPin.type === "power"
                        ? "bg-red-900/20 text-red-400"
                        : selectedPin.type === "ground"
                        ? "bg-gray-900/20 text-gray-400"
                        : selectedPin.type === "input"
                        ? "bg-blue-900/20 text-blue-400"
                        : selectedPin.type === "output"
                        ? "bg-green-900/20 text-green-400"
                        : "bg-purple-900/20 text-purple-400"
                    }`}>
                    {selectedPin.type}
                  </span>
                </div>
                <div className="pt-2 border-t border-border-color">
                  <span className="text-text-secondary">Description:</span>
                  <p className="text-text-primary mt-1">
                    {selectedPin.description}
                  </p>
                </div>

                {selectedPin.electricalProperties.voltage && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Voltage:</span>
                    <span className="text-text-primary">
                      {selectedPin.electricalProperties.voltage}V
                    </span>
                  </div>
                )}

                {selectedPin.alternativeFunctions &&
                  selectedPin.alternativeFunctions.length > 0 && (
                    <div className="pt-2 border-t border-border-color">
                      <span className="text-text-secondary">
                        Alt Functions:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPin.alternativeFunctions.map((func, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary text-xs text-text-primary rounded border border-border-color">
                            {func}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedPin.group && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Group:</span>
                    <span className="text-text-primary">
                      {selectedPin.group}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pin List */}
          <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Pin List ({filteredPins.length}/{diagram.pinCount})
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredPins.map((pin) => (
                <div
                  key={pin.number}
                  onClick={() => handlePinClick(pin)}
                  onMouseEnter={() => handlePinHover(pin)}
                  onMouseLeave={() => handlePinHover(null)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedPin?.number === pin.number
                      ? "bg-blue-500/20 border border-blue-500/40"
                      : hoveredPin?.number === pin.number
                      ? "bg-primary border border-border-color"
                      : "bg-primary hover:bg-secondary border border-transparent"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-text-primary w-8">
                        {pin.number}
                      </span>
                      <div>
                        <div className="font-medium text-text-primary">
                          {pin.name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {pin.type}
                        </div>
                      </div>
                    </div>
                    {pin.group && (
                      <span className="px-2 py-1 bg-secondary text-xs text-text-secondary rounded border border-border-color">
                        {pin.group}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Power Analysis */}
          {viewSettings.showPowerAnalysis && (
            <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                <BoltIcon className="h-5 w-5 text-yellow-500 mr-2" />
                Power Analysis
              </h3>
              <div className="space-y-2 text-sm">
                {(() => {
                  const powerPins = diagram.pins.filter(
                    (pin) => pin.type === "power"
                  );
                  const groundPins = diagram.pins.filter(
                    (pin) => pin.type === "ground"
                  );
                  const totalVoltage = powerPins.reduce(
                    (sum, pin) => sum + (pin.electricalProperties.voltage || 0),
                    0
                  );

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Power Pins:</span>
                        <span className="text-text-primary">
                          {powerPins.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Ground Pins:
                        </span>
                        <span className="text-text-primary">
                          {groundPins.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Total Voltage:
                        </span>
                        <span className="text-text-primary">
                          {totalVoltage.toFixed(1)}V
                        </span>
                      </div>
                      {powerPins.map((pin) => (
                        <div
                          key={pin.number}
                          className="flex justify-between text-xs">
                          <span className="text-text-secondary">
                            {pin.name}:
                          </span>
                          <span className="text-text-primary">
                            {pin.electricalProperties.voltage || 0}V
                          </span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Pin Types
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { type: "input", color: "bg-blue-500", label: "Input" },
                { type: "output", color: "bg-green-500", label: "Output" },
                {
                  type: "bidirectional",
                  color: "bg-purple-500",
                  label: "Bidirectional",
                },
                { type: "power", color: "bg-red-500", label: "Power" },
                { type: "ground", color: "bg-gray-500", label: "Ground" },
                { type: "analog", color: "bg-orange-500", label: "Analog" },
                { type: "nc", color: "bg-gray-400", label: "Not Connected" },
              ].map(({ type, color, label }) => (
                <div key={type} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${color}`}></div>
                  <span className="text-text-primary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePinoutViewer;
