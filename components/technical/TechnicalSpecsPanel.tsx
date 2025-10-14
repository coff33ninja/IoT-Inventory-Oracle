import React, { useState } from "react";
import { InventoryItem } from "../../types";
import { ComponentSpecification } from "../TechnicalDocumentationHub";
import {
  DocumentTextIcon,
  ChartBarIcon,
  CpuChipIcon,
  BoltIcon,
  ThermometerIcon,
  ClockIcon,
  InformationCircleIcon,
} from "../icons/AnalyticsIcons";

interface TechnicalSpecsPanelProps {
  selectedComponent: InventoryItem | null;
  specification: ComponentSpecification | undefined;
  onComponentSelect: (component: InventoryItem) => void;
  inventory: InventoryItem[];
}

const TechnicalSpecsPanel: React.FC<TechnicalSpecsPanelProps> = ({
  selectedComponent,
  specification,
  onComponentSelect,
  inventory,
}) => {
  const [activeSection, setActiveSection] = useState<
    "overview" | "electrical" | "mechanical" | "environmental"
  >("overview");

  const getSpecificationIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    if (
      keyLower.includes("voltage") ||
      keyLower.includes("current") ||
      keyLower.includes("power")
    ) {
      return <BoltIcon className="h-4 w-4 text-yellow-500" />;
    }
    if (keyLower.includes("temperature")) {
      return <ThermometerIcon className="h-4 w-4 text-red-500" />;
    }
    if (
      keyLower.includes("frequency") ||
      keyLower.includes("speed") ||
      keyLower.includes("rate")
    ) {
      return <ClockIcon className="h-4 w-4 text-blue-500" />;
    }
    if (
      keyLower.includes("package") ||
      keyLower.includes("dimension") ||
      keyLower.includes("size")
    ) {
      return <CpuChipIcon className="h-4 w-4 text-purple-500" />;
    }
    return <ChartBarIcon className="h-4 w-4 text-text-secondary" />;
  };

  const categorizeSpecifications = (specs: {
    [key: string]: string | number | boolean;
  }) => {
    const categories = {
      electrical: [] as Array<{
        key: string;
        value: string | number | boolean;
      }>,
      mechanical: [] as Array<{
        key: string;
        value: string | number | boolean;
      }>,
      environmental: [] as Array<{
        key: string;
        value: string | number | boolean;
      }>,
      other: [] as Array<{ key: string; value: string | number | boolean }>,
    };

    Object.entries(specs).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      if (
        keyLower.includes("voltage") ||
        keyLower.includes("current") ||
        keyLower.includes("power") ||
        keyLower.includes("resistance") ||
        keyLower.includes("capacitance") ||
        keyLower.includes("frequency")
      ) {
        categories.electrical.push({ key, value });
      } else if (
        keyLower.includes("package") ||
        keyLower.includes("dimension") ||
        keyLower.includes("size") ||
        keyLower.includes("weight") ||
        keyLower.includes("pin")
      ) {
        categories.mechanical.push({ key, value });
      } else if (
        keyLower.includes("temperature") ||
        keyLower.includes("humidity") ||
        keyLower.includes("environment")
      ) {
        categories.environmental.push({ key, value });
      } else {
        categories.other.push({ key, value });
      }
    });

    return categories;
  };

  const renderSpecificationValue = (value: string | number | boolean) => {
    if (typeof value === "boolean") {
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
          {value ? "Yes" : "No"}
        </span>
      );
    }
    return <span className="font-medium text-text-primary">{value}</span>;
  };

  const renderOperatingConditions = () => {
    if (!specification?.operatingConditions) return null;

    const conditions = specification.operatingConditions;

    return (
      <div className="space-y-4">
        {conditions.voltage && (
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center">
              <BoltIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="font-medium text-text-primary">Supply Voltage</span>
            </div>
            <span className="text-text-secondary">
              {conditions.voltage.min}V - {conditions.voltage.max}V
            </span>
          </div>
        )}

        {conditions.current && (
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center">
              <BoltIcon className="h-5 w-5 text-blue-400 mr-2" />
              <span className="font-medium text-text-primary">Maximum Current</span>
            </div>
            <span className="text-text-secondary">
              {conditions.current.max} {conditions.current.unit}
            </span>
          </div>
        )}

        {conditions.temperature && (
          <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center">
              <ThermometerIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="font-medium text-text-primary">
                Operating Temperature
              </span>
            </div>
            <span className="text-text-secondary">
              {conditions.temperature.min}°C to {conditions.temperature.max}°C
            </span>
          </div>
        )}

        {conditions.frequency && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-purple-500 mr-2" />
              <span className="font-medium text-text-primary">
                Operating Frequency
              </span>
            </div>
            <span className="text-text-secondary">
              {conditions.frequency.min} - {conditions.frequency.max}{" "}
              {conditions.frequency.unit}
            </span>
          </div>
        )}
      </div>
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
                type="button"
                key={component.id}
                onClick={() => onComponentSelect(component)}
                className="p-4 text-left border border-border-color rounded-lg hover:border-green-300 hover:bg-primary transition-colors">
                <h4 className="font-medium text-text-primary">{component.name}</h4>
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
                  <DocumentTextIcon className="h-6 w-6 text-green-500 mr-2" />
                  {selectedComponent.name} Specifications
                </h3>
                <p className="text-text-secondary mt-1">
                  Detailed technical specifications and characteristics
                </p>
              </div>
              <button
                type="button"
                onClick={() => onComponentSelect(null as any)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
                Change Component
              </button>
            </div>
          </div>

          {/* Specifications Content */}
          {!specification ? (
            <div className="bg-secondary p-8 rounded-lg shadow border border-border-color text-center">
              <DocumentTextIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No Specifications Available
              </h3>
              <p className="text-text-secondary">
                Technical specifications for {selectedComponent.name} are not
                available.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-blue-600 transition-colors">
                Parse from Datasheet
              </button>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="bg-secondary rounded-lg shadow border border-border-color">
                <div className="border-b border-border-color">
                  <nav className="flex space-x-8 px-6">
                    {[
                      {
                        id: "overview",
                        label: "Overview",
                        icon: DocumentTextIcon,
                      },
                      { id: "electrical", label: "Electrical", icon: BoltIcon },
                      {
                        id: "mechanical",
                        label: "Mechanical",
                        icon: CpuChipIcon,
                      },
                      {
                        id: "environmental",
                        label: "Environmental",
                        icon: ThermometerIcon,
                      },
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeSection === tab.id
                            ? "border-green-500 text-green-600"
                            : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-color"
                        }`}>
                        <tab.icon className="h-4 w-4 mr-2" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {activeSection === "overview" && (
                    <div className="space-y-6">
                      {/* General Specifications */}
                      <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-4">
                          General Specifications
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(specification.specifications).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-3 bg-primary rounded-lg border border-border-color">
                                <div className="flex items-center">
                                  {getSpecificationIcon(key)}
                                  <span className="ml-2 text-text-secondary">
                                    {key}:
                                  </span>
                                </div>
                                {renderSpecificationValue(value)}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Operating Conditions */}
                      <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-4">
                          Operating Conditions
                        </h4>
                        {renderOperatingConditions()}
                      </div>

                      {/* Package Information */}
                      {specification.packageInfo && (
                        <div>
                          <h4 className="text-lg font-semibold text-text-primary mb-4">
                            Package Information
                          </h4>
                          <div className="bg-primary p-4 rounded-lg border border-border-color">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <span className="text-text-secondary">
                                  Package Type:
                                </span>
                                <span className="ml-2 font-medium">
                                  {specification.packageInfo.type}
                                </span>
                              </div>
                              {specification.packageInfo.dimensions && (
                                <div>
                                  <span className="text-text-secondary">
                                    Dimensions:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {specification.packageInfo.dimensions}
                                  </span>
                                </div>
                              )}
                              {specification.packageInfo.pinCount && (
                                <div>
                                  <span className="text-text-secondary">
                                    Pin Count:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {specification.packageInfo.pinCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === "electrical" && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-text-primary">
                        Electrical Characteristics
                      </h4>

                      {/* Operating Conditions */}
                      {renderOperatingConditions()}

                      {/* Electrical Specs */}
                      <div>
                        <h5 className="font-medium text-text-primary mb-3">
                          Electrical Parameters
                        </h5>
                        <div className="space-y-2">
                          {categorizeSpecifications(
                            specification.specifications
                          ).electrical.map(({ key, value }) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                              <div className="flex items-center">
                                <BoltIcon className="h-4 w-4 text-yellow-400 mr-2" />
                                <span className="text-text-primary">{key}:</span>
                              </div>
                              {renderSpecificationValue(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "mechanical" && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-text-primary">
                        Mechanical Specifications
                      </h4>

                      {/* Package Info */}
                      {specification.packageInfo && (
                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                          <h5 className="font-medium text-text-primary mb-3 flex items-center">
                            <CpuChipIcon className="h-5 w-5 text-purple-400 mr-2" />
                            Package Details
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <span className="ml-2 font-medium">
                                {specification.packageInfo.type}
                              </span>
                            </div>
                            {specification.packageInfo.dimensions && (
                              <div>
                                <span className="text-gray-600">
                                  Dimensions:
                                </span>
                                <span className="ml-2 font-medium">
                                  {specification.packageInfo.dimensions}
                                </span>
                              </div>
                            )}
                            {specification.packageInfo.pinCount && (
                              <div>
                                <span className="text-gray-600">
                                  Pin Count:
                                </span>
                                <span className="ml-2 font-medium">
                                  {specification.packageInfo.pinCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mechanical Specs */}
                      <div>
                        <h5 className="font-medium text-text-primary mb-3">
                          Physical Parameters
                        </h5>
                        <div className="space-y-2">
                          {categorizeSpecifications(
                            specification.specifications
                          ).mechanical.map(({ key, value }) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 bg-purple-50 rounded border border-purple-200">
                              <div className="flex items-center">
                                <CpuChipIcon className="h-4 w-4 text-purple-500 mr-2" />
                                <span className="text-text-primary">{key}:</span>
                              </div>
                              {renderSpecificationValue(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "environmental" && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-text-primary">
                        Environmental Specifications
                      </h4>

                      {/* Temperature Conditions */}
                      {specification.operatingConditions?.temperature && (
                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                          <h5 className="font-medium text-text-primary mb-3 flex items-center">
                            <ThermometerIcon className="h-5 w-5 text-red-400 mr-2" />
                            Temperature Range
                          </h5>
                          <div className="text-text-primary">
                            Operating:{" "}
                            {specification.operatingConditions.temperature.min}
                            °C to{" "}
                            {specification.operatingConditions.temperature.max}
                            °C
                          </div>
                        </div>
                      )}

                      {/* Environmental Specs */}
                      <div>
                        <h5 className="font-medium text-text-primary mb-3">
                          Environmental Parameters
                        </h5>
                        <div className="space-y-2">
                          {categorizeSpecifications(
                            specification.specifications
                          ).environmental.map(({ key, value }) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 bg-red-500/10 rounded border border-red-500/20">
                              <div className="flex items-center">
                                <ThermometerIcon className="h-4 w-4 text-red-400 mr-2" />
                                <span className="text-text-primary">{key}:</span>
                              </div>
                              {renderSpecificationValue(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features and Applications */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Features */}
                {specification.features &&
                  specification.features.length > 0 && (
                    <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
                      <h4 className="text-lg font-semibold text-text-primary mb-4">
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {specification.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">•</span>
                            <span className="text-text-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Applications */}
                {specification.applications &&
                  specification.applications.length > 0 && (
                    <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
                      <h4 className="text-lg font-semibold text-text-primary mb-4">
                        Applications
                      </h4>
                      <ul className="space-y-2">
                        {specification.applications.map(
                          (application, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-accent mr-2 mt-1">•</span>
                              <span className="text-text-primary">
                                {application}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </>
          )}
        </>
      )}

      {/* Help Section */}
      <div className="bg-primary border border-border-color rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-text-secondary mr-2 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium mb-1 text-text-primary">
              Technical Specifications Features:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Comprehensive technical parameter documentation</li>
              <li>
                Categorized specifications (electrical, mechanical,
                environmental)
              </li>
              <li>Operating conditions and absolute maximum ratings</li>
              <li>Package information and physical characteristics</li>
              <li>Key features and typical applications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpecsPanel;
