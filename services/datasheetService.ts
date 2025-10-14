import { InventoryItem } from "../types";

export interface DatasheetSearchResult {
  id: string;
  componentName: string;
  manufacturer: string;
  partNumber: string;
  datasheetUrl: string;
  thumbnailUrl?: string;
  description: string;
  specifications: ComponentSpecification[];
  confidence: number; // 0-100
  source: "octopart" | "digikey" | "mouser" | "local" | "manual";
  lastUpdated: string;
}

export interface ComponentSpecification {
  parameter: string;
  value: string;
  unit?: string;
  conditions?: string;
  min?: number;
  max?: number;
  typical?: number;
}

export interface ParsedDatasheet {
  componentId: string;
  metadata: {
    title: string;
    manufacturer: string;
    partNumber: string;
    revision: string;
    dateCode: string;
    pages: number;
  };
  specifications: ComponentSpecification[];
  pinout: PinoutData[];
  electricalCharacteristics: ElectricalCharacteristic[];
  mechanicalData: MechanicalData;
  packageInfo: PackageInfo;
  operatingConditions: OperatingConditions;
  features: string[];
  applications: string[];
  extractedText: string;
  confidence: number;
}

export interface PinoutData {
  pinNumber: number;
  pinName: string;
  pinType: "input" | "output" | "bidirectional" | "power" | "ground" | "nc";
  description: string;
  electricalType?: "digital" | "analog" | "power";
  voltage?: number;
  current?: number;
}

export interface ElectricalCharacteristic {
  parameter: string;
  symbol: string;
  conditions: string;
  min?: number;
  typical?: number;
  max?: number;
  unit: string;
}

export interface MechanicalData {
  packageType: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  pinCount: number;
  pinPitch?: number;
  thermalPad?: boolean;
}

export interface PackageInfo {
  type: string;
  description: string;
  pinCount: number;
  mountingType: "through-hole" | "surface-mount" | "socket";
  leadFrame?: string;
}

export interface OperatingConditions {
  temperature: {
    min: number;
    max: number;
    unit: string;
  };
  voltage: {
    min: number;
    max: number;
    unit: string;
  };
  humidity?: {
    max: number;
    unit: string;
  };
}

export interface DatasheetParsingOptions {
  extractPinout: boolean;
  extractSpecs: boolean;
  extractElectrical: boolean;
  extractMechanical: boolean;
  ocrEnabled: boolean;
  language: "en" | "auto";
}

/**
 * Service for searching and parsing component datasheets
 */
export class DatasheetService {
  private static readonly API_ENDPOINTS = {
    octopart: "https://octopart.com/api/v4/rest",
    digikey: "https://api.digikey.com/v1",
    mouser: "https://api.mouser.com/api/v1",
  };

  private static readonly COMMON_MANUFACTURERS = [
    "Texas Instruments",
    "Analog Devices", 
    "Microchip",
    "STMicroelectronics",
    "Infineon",
    "NXP",
    "Maxim",
    "Linear Technology",
    "Atmel",
    "Arduino",
    "Raspberry Pi Foundation",
    "Espressif",
    "Nordic Semiconductor",
  ];

  /**
   * Search for datasheets across multiple sources
   */
  static async searchDatasheets(
    query: string,
    options: {
      manufacturer?: string;
      category?: string;
      maxResults?: number;
      sources?: ("octopart" | "digikey" | "mouser" | "local")[];
    } = {}
  ): Promise<DatasheetSearchResult[]> {
    const {
      manufacturer,
      category,
      maxResults = 10,
      sources = ["octopart", "digikey", "mouser", "local"],
    } = options;

    const results: DatasheetSearchResult[] = [];

    try {
      // Search local database first (fastest)
      if (sources.includes("local")) {
        const localResults = await this.searchLocalDatasheets(
          query,
          manufacturer,
          category
        );
        results.push(...localResults);
      }

      // Search external APIs if needed
      if (results.length < maxResults) {
        const externalSources = sources.filter(
          (source): source is "octopart" | "digikey" | "mouser" =>
            source !== "local"
        );

        const externalPromises = externalSources.map((source) =>
          this.searchExternalDatasheets(source, query, manufacturer, category)
        );

        const externalResults = await Promise.allSettled(externalPromises);

        externalResults.forEach((result) => {
          if (result.status === "fulfilled") {
            results.push(...result.value);
          }
        });
      }

      // Sort by confidence and relevance
      return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxResults);
    } catch (error) {
      console.error("Error searching datasheets:", error);
      return this.generateFallbackResults(query, manufacturer);
    }
  }

  /**
   * Search local datasheet database
   */
  private static async searchLocalDatasheets(
    query: string,
    manufacturer?: string,
    category?: string
  ): Promise<DatasheetSearchResult[]> {
    // Simulate local database search
    const mockResults: DatasheetSearchResult[] = [];

    // Generate realistic mock results based on query
    const queryLower = query.toLowerCase();

    // Note: category parameter available for future filtering
    if (category) {
      console.debug(`Filtering by category: ${category}`);
    }

    if (queryLower.includes("arduino") || queryLower.includes("atmega")) {
      mockResults.push({
        id: "local-atmega328p",
        componentName: "ATmega328P",
        manufacturer: "Microchip Technology",
        partNumber: "ATMEGA328P-PU",
        datasheetUrl: "/datasheets/atmega328p.pdf",
        thumbnailUrl: "/thumbnails/atmega328p.jpg",
        description: "8-bit AVR Microcontroller with 32KB Flash",
        specifications: [
          { parameter: "Flash Memory", value: "32", unit: "KB" },
          { parameter: "SRAM", value: "2", unit: "KB" },
          { parameter: "EEPROM", value: "1", unit: "KB" },
          { parameter: "Operating Voltage", value: "1.8-5.5", unit: "V" },
          { parameter: "Max Clock Frequency", value: "20", unit: "MHz" },
        ],
        confidence: 95,
        source: "local",
        lastUpdated: new Date().toISOString(),
      });
    }

    if (queryLower.includes("esp32") || queryLower.includes("wifi")) {
      mockResults.push({
        id: "local-esp32",
        componentName: "ESP32-WROOM-32",
        manufacturer: "Espressif Systems",
        partNumber: "ESP32-WROOM-32",
        datasheetUrl: "/datasheets/esp32-wroom-32.pdf",
        thumbnailUrl: "/thumbnails/esp32.jpg",
        description: "WiFi & Bluetooth Combo Module",
        specifications: [
          { parameter: "CPU", value: "Dual-core Xtensa LX6", unit: "" },
          { parameter: "Flash Memory", value: "4", unit: "MB" },
          { parameter: "SRAM", value: "520", unit: "KB" },
          { parameter: "WiFi", value: "802.11 b/g/n", unit: "" },
          { parameter: "Bluetooth", value: "v4.2 BR/EDR and BLE", unit: "" },
        ],
        confidence: 92,
        source: "local",
        lastUpdated: new Date().toISOString(),
      });
    }

    if (queryLower.includes("raspberry") || queryLower.includes("pi")) {
      mockResults.push({
        id: "local-rpi4",
        componentName: "Raspberry Pi 4 Model B",
        manufacturer: "Raspberry Pi Foundation",
        partNumber: "RPI4-MODBP-4GB",
        datasheetUrl: "/datasheets/raspberry-pi-4.pdf",
        thumbnailUrl: "/thumbnails/rpi4.jpg",
        description: "Single Board Computer with ARM Cortex-A72",
        specifications: [
          { parameter: "CPU", value: "Quad-core ARM Cortex-A72", unit: "" },
          { parameter: "RAM", value: "4", unit: "GB" },
          { parameter: "GPIO Pins", value: "40", unit: "" },
          { parameter: "USB Ports", value: "4", unit: "" },
          { parameter: "Ethernet", value: "Gigabit", unit: "" },
        ],
        confidence: 88,
        source: "local",
        lastUpdated: new Date().toISOString(),
      });
    }

    // Filter by manufacturer if specified
    if (manufacturer) {
      return mockResults.filter((result) =>
        result.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
      );
    }

    return mockResults;
  }

  /**
   * Search external datasheet APIs
   */
  private static async searchExternalDatasheets(
    source: "octopart" | "digikey" | "mouser",
    query: string,
    manufacturer?: string,
    category?: string
  ): Promise<DatasheetSearchResult[]> {
    // Simulate API calls with realistic delays and responses
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    const mockResults: DatasheetSearchResult[] = [];

    // Generate source-specific mock results
    // Note: category parameter available for future filtering
    console.debug(
      `Searching ${source} for ${query}${
        category ? ` in category ${category}` : ""
      }`
    );

    switch (source) {
      case "octopart":
        mockResults.push({
          id: `octopart-${Date.now()}`,
          componentName: `${query} (Octopart)`,
          manufacturer: manufacturer || "Generic Manufacturer",
          partNumber: `${query.toUpperCase()}-001`,
          datasheetUrl: `https://octopart.com/datasheets/${query}.pdf`,
          description: `Component found via Octopart API`,
          specifications: [
            { parameter: "Source", value: "Octopart", unit: "" },
            { parameter: "Availability", value: "In Stock", unit: "" },
          ],
          confidence: 75,
          source: "octopart",
          lastUpdated: new Date().toISOString(),
        });
        break;

      case "digikey":
        mockResults.push({
          id: `digikey-${Date.now()}`,
          componentName: `${query} (Digi-Key)`,
          manufacturer: manufacturer || "Generic Manufacturer",
          partNumber: `${query.toUpperCase()}-DK`,
          datasheetUrl: `https://www.digikey.com/datasheets/${query}.pdf`,
          description: `Component found via Digi-Key API`,
          specifications: [
            { parameter: "Source", value: "Digi-Key", unit: "" },
            { parameter: "Stock", value: "1000+", unit: "pcs" },
          ],
          confidence: 80,
          source: "digikey",
          lastUpdated: new Date().toISOString(),
        });
        break;

      case "mouser":
        mockResults.push({
          id: `mouser-${Date.now()}`,
          componentName: `${query} (Mouser)`,
          manufacturer: manufacturer || "Generic Manufacturer",
          partNumber: `${query.toUpperCase()}-MS`,
          datasheetUrl: `https://www.mouser.com/datasheets/${query}.pdf`,
          description: `Component found via Mouser API`,
          specifications: [
            { parameter: "Source", value: "Mouser", unit: "" },
            { parameter: "Lead Time", value: "2-3", unit: "weeks" },
          ],
          confidence: 70,
          source: "mouser",
          lastUpdated: new Date().toISOString(),
        });
        break;
    }

    return mockResults;
  }

  /**
   * Parse a datasheet PDF and extract structured information
   */
  static async parseDatasheet(
    datasheetUrl: string,
    options: DatasheetParsingOptions = {
      extractPinout: true,
      extractSpecs: true,
      extractElectrical: true,
      extractMechanical: true,
      ocrEnabled: true,
      language: "en",
    }
  ): Promise<ParsedDatasheet> {
    try {
      // Simulate PDF parsing with realistic processing time
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 3000)
      );

      // Generate mock parsed data based on URL
      const componentName = this.extractComponentNameFromUrl(datasheetUrl);

      return {
        componentId: `parsed-${Date.now()}`,
        metadata: {
          title: `${componentName} Datasheet`,
          manufacturer: this.guessManufacturer(componentName),
          partNumber: componentName.toUpperCase(),
          revision: "Rev. A",
          dateCode: "2024",
          pages: Math.floor(Math.random() * 50) + 10,
        },
        specifications: this.generateMockSpecifications(componentName),
        pinout: options.extractPinout
          ? this.generateMockPinout(componentName)
          : [],
        electricalCharacteristics: options.extractElectrical
          ? this.generateMockElectricalChars()
          : [],
        mechanicalData: options.extractMechanical
          ? this.generateMockMechanicalData()
          : ({} as MechanicalData),
        packageInfo: {
          type: "DIP-28",
          description: "Dual In-line Package",
          pinCount: 28,
          mountingType: "through-hole",
          leadFrame: "Copper",
        },
        operatingConditions: {
          temperature: { min: -40, max: 85, unit: "°C" },
          voltage: { min: 1.8, max: 5.5, unit: "V" },
          humidity: { max: 95, unit: "%RH" },
        },
        features: [
          "Low power consumption",
          "High performance",
          "Wide operating temperature range",
          "ESD protection",
        ],
        applications: [
          "IoT devices",
          "Embedded systems",
          "Sensor networks",
          "Industrial automation",
        ],
        extractedText: `This is extracted text from the ${componentName} datasheet...`,
        confidence: 85,
      };
    } catch (error) {
      console.error("Error parsing datasheet:", error);
      throw new Error(`Failed to parse datasheet: ${error}`);
    }
  }

  /**
   * Generate fallback results when API calls fail
   */
  private static generateFallbackResults(
    query: string,
    manufacturer?: string
  ): DatasheetSearchResult[] {
    return [
      {
        id: `fallback-${Date.now()}`,
        componentName: query,
        manufacturer: manufacturer || "Unknown",
        partNumber: query.toUpperCase(),
        datasheetUrl: "#",
        description: "Datasheet not found - manual search required",
        specifications: [{ parameter: "Status", value: "Not Found", unit: "" }],
        confidence: 10,
        source: "manual",
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  /**
   * Extract component name from datasheet URL
   */
  private static extractComponentNameFromUrl(url: string): string {
    const filename = url.split("/").pop()?.split(".")[0] || "unknown";
    return filename.replace(/[-_]/g, " ").toUpperCase();
  }

  /**
   * Guess manufacturer from component name
   */
  private static guessManufacturer(componentName: string): string {
    const name = componentName.toLowerCase();

    if (name.includes("atmega") || name.includes("attiny"))
      return "Microchip Technology";
    if (name.includes("esp32") || name.includes("esp8266"))
      return "Espressif Systems";
    if (name.includes("stm32")) return "STMicroelectronics";
    if (name.includes("pic")) return "Microchip Technology";
    if (name.includes("arduino")) return "Arduino";
    if (name.includes("raspberry")) return "Raspberry Pi Foundation";
    if (name.includes("lm") || name.includes("tl")) return "Texas Instruments";

    return "Generic Manufacturer";
  }

  /**
   * Generate mock specifications
   */
  private static generateMockSpecifications(
    componentName: string
  ): ComponentSpecification[] {
    const specs: ComponentSpecification[] = [
      { parameter: "Operating Voltage", value: "3.3-5.0", unit: "V" },
      { parameter: "Operating Temperature", value: "-40 to +85", unit: "°C" },
      { parameter: "Package Type", value: "DIP-28", unit: "" },
    ];

    const name = componentName.toLowerCase();
    if (name.includes("micro") || name.includes("mcu")) {
      specs.push(
        { parameter: "Flash Memory", value: "32", unit: "KB" },
        { parameter: "SRAM", value: "2", unit: "KB" },
        { parameter: "Clock Speed", value: "16", unit: "MHz" }
      );
    }

    return specs;
  }

  /**
   * Generate mock pinout data
   */
  private static generateMockPinout(_componentName: string): PinoutData[] {
    const pinout: PinoutData[] = [];
    const pinCount = 28; // Default DIP-28

    for (let i = 1; i <= pinCount; i++) {
      let pinType: PinoutData["pinType"] = "bidirectional";
      let pinName = `P${i}`;
      let description = `General purpose I/O pin ${i}`;

      // Special pins
      if (i === 1) {
        pinType = "input";
        pinName = "RESET";
        description = "Reset input (active low)";
      } else if (i === 7 || i === 20) {
        pinType = "power";
        pinName = i === 7 ? "VCC" : "GND";
        description = i === 7 ? "Power supply" : "Ground";
      } else if (i >= 9 && i <= 13) {
        pinName = `D${i - 9}`;
        description = `Digital I/O pin ${i - 9}`;
      }

      pinout.push({
        pinNumber: i,
        pinName,
        pinType,
        description,
        electricalType: pinType === "power" ? "power" : "digital",
        voltage: pinType === "power" ? (pinName === "VCC" ? 5.0 : 0) : 3.3,
      });
    }

    return pinout;
  }

  /**
   * Generate mock electrical characteristics
   */
  private static generateMockElectricalChars(): ElectricalCharacteristic[] {
    return [
      {
        parameter: "Supply Voltage",
        symbol: "VCC",
        conditions: "Operating",
        min: 1.8,
        typical: 3.3,
        max: 5.5,
        unit: "V",
      },
      {
        parameter: "Supply Current",
        symbol: "ICC",
        conditions: "Active mode, 1MHz",
        typical: 0.2,
        max: 0.4,
        unit: "mA",
      },
      {
        parameter: "Input High Voltage",
        symbol: "VIH",
        conditions: "VCC = 5V",
        min: 3.0,
        unit: "V",
      },
      {
        parameter: "Input Low Voltage",
        symbol: "VIL",
        conditions: "VCC = 5V",
        max: 1.5,
        unit: "V",
      },
    ];
  }

  /**
   * Generate mock mechanical data
   */
  private static generateMockMechanicalData(): MechanicalData {
    return {
      packageType: "DIP-28",
      dimensions: {
        length: 35.56,
        width: 15.24,
        height: 4.57,
        unit: "mm",
      },
      pinCount: 28,
      pinPitch: 2.54,
      thermalPad: false,
    };
  }

  /**
   * Validate manufacturer against known manufacturers
   */
  static isKnownManufacturer(manufacturer: string): boolean {
    return this.COMMON_MANUFACTURERS.some(known => 
      known.toLowerCase().includes(manufacturer.toLowerCase()) ||
      manufacturer.toLowerCase().includes(known.toLowerCase())
    );
  }

  /**
   * Get API endpoint for a specific source
   */
  static getApiEndpoint(source: keyof typeof DatasheetService.API_ENDPOINTS): string {
    return this.API_ENDPOINTS[source];
  }

  /**
   * Get suggested manufacturers for autocomplete
   */
  static getSuggestedManufacturers(query: string = ""): string[] {
    if (!query) return this.COMMON_MANUFACTURERS;
    
    return this.COMMON_MANUFACTURERS.filter(manufacturer =>
      manufacturer.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get datasheet for inventory item
   */
  static async getDatasheetForItem(
    item: InventoryItem
  ): Promise<DatasheetSearchResult | null> {
    try {
      const searchQuery = item.modelNumber || item.name;
      
      // Validate manufacturer if provided
      if (item.manufacturer && !this.isKnownManufacturer(item.manufacturer)) {
        console.warn(`Unknown manufacturer: ${item.manufacturer}. Consider adding to COMMON_MANUFACTURERS.`);
      }
      
      const results = await this.searchDatasheets(searchQuery, {
        manufacturer: item.manufacturer,
        category: item.category,
        maxResults: 1,
      });

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error getting datasheet for item:", error);
      return null;
    }
  }

  /**
   * Cache datasheet parsing results
   */
  static cacheDatasheet(
    componentId: string,
    parsedData: ParsedDatasheet
  ): void {
    try {
      const cacheKey = `datasheet_${componentId}`;
      localStorage.setItem(cacheKey, JSON.stringify(parsedData));
    } catch (error) {
      console.error("Error caching datasheet:", error);
    }
  }

  /**
   * Get cached datasheet
   */
  static getCachedDatasheet(componentId: string): ParsedDatasheet | null {
    try {
      const cacheKey = `datasheet_${componentId}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting cached datasheet:", error);
      return null;
    }
  }
}

export default DatasheetService;
