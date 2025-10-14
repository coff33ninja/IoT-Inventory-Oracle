import { PinoutData, ParsedDatasheet, ComponentSpecification } from "../types";

export interface PinoutDiagram {
  componentId: string;
  componentName: string;
  packageType: string;
  pinCount: number;
  pins: PinoutPin[];
  dimensions: {
    width: number;
    height: number;
    pinSpacing: number;
  };
  layout: "dip" | "qfp" | "bga" | "sop" | "custom";
  svgData: string;
  interactiveElements: InteractiveElement[];
}

export interface PinoutPin {
  number: number;
  name: string;
  type:
    | "input"
    | "output"
    | "bidirectional"
    | "power"
    | "ground"
    | "nc"
    | "analog";
  description: string;
  position: {
    x: number;
    y: number;
  };
  electricalProperties: {
    voltage?: number;
    current?: number;
    impedance?: number;
    frequency?: number;
  };
  alternativeFunctions?: string[];
  group?: string; // For grouping related pins (e.g., "SPI", "I2C", "GPIO")
}

export interface InteractiveElement {
  id: string;
  type: "pin" | "label" | "highlight" | "tooltip";
  pinNumber?: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };
}

export interface PinoutGenerationOptions {
  includeLabels: boolean;
  showPinNumbers: boolean;
  showPinNames: boolean;
  colorCodeByType: boolean;
  includeTooltips: boolean;
  theme: "light" | "dark" | "auto";
  scale: number;
  format: "svg" | "png" | "pdf";
}

/**
 * Service for generating interactive pinout diagrams
 */
export class PinoutGeneratorService {
  private static readonly PIN_COLORS = {
    input: "#3B82F6", // Blue
    output: "#10B981", // Green
    bidirectional: "#8B5CF6", // Purple
    power: "#EF4444", // Red
    ground: "#6B7280", // Gray
    nc: "#9CA3AF", // Light gray
    analog: "#F59E0B", // Orange
  };

  private static readonly PACKAGE_LAYOUTS = {
    dip: { pinSpacing: 2.54, bodyWidth: 15.24, bodyHeight: 35.56 },
    qfp: { pinSpacing: 0.8, bodyWidth: 10, bodyHeight: 10 },
    bga: { pinSpacing: 1.0, bodyWidth: 12, bodyHeight: 12 },
    sop: { pinSpacing: 1.27, bodyWidth: 7.5, bodyHeight: 10 },
    custom: { pinSpacing: 2.54, bodyWidth: 15.24, bodyHeight: 35.56 }, // Default to DIP dimensions
  };

  /**
   * Analyze pins based on component specifications
   */
  static analyzePinsFromSpecifications(
    pins: PinoutData[],
    specifications: ComponentSpecification[]
  ): PinoutPin[] {
    return pins.map(pin => {
      // Find relevant specifications for this pin
      const relevantSpecs = specifications.filter(spec =>
        spec.parameter.toLowerCase().includes(pin.pinName.toLowerCase()) ||
        pin.description.toLowerCase().includes(spec.parameter.toLowerCase())
      );

      // Extract electrical properties from specifications
      const electricalProperties = {
        voltage: pin.voltage,
        current: pin.current,
        impedance: relevantSpecs.find(s => s.parameter.includes('Impedance'))?.typical,
        frequency: relevantSpecs.find(s => s.parameter.includes('Frequency'))?.max,
      };

      return {
        number: pin.pinNumber,
        name: pin.pinName,
        type: pin.pinType as any,
        description: pin.description,
        position: { x: 0, y: 0 }, // Will be calculated later
        electricalProperties,
        alternativeFunctions: this.extractAlternativeFunctions(pin.description),
        group: this.determinePinGroup(pin.pinName, pin.description),
      };
    });
  }

  /**
   * Generate pinout diagram from component data
   */
  static generatePinoutDiagram(
    componentData: ParsedDatasheet | PinoutData[],
    options: PinoutGenerationOptions = {
      includeLabels: true,
      showPinNumbers: true,
      showPinNames: true,
      colorCodeByType: true,
      includeTooltips: true,
      theme: "auto",
      scale: 1.0,
      format: "svg",
    }
  ): PinoutDiagram {
    let pins: PinoutData[];
    let componentName: string;
    let packageType: string;
    let componentId: string;

    // Extract pin data from input
    if (Array.isArray(componentData)) {
      pins = componentData;
      componentName = "Unknown Component";
      packageType = "DIP";
      componentId = `pinout-${Date.now()}`;
    } else {
      pins = componentData.pinout;
      componentName = componentData.metadata.partNumber;
      packageType = componentData.packageInfo.type;
      componentId = componentData.componentId;
    }

    // Determine package layout
    const layout = this.determinePackageLayout(packageType);
    const layoutConfig =
      this.PACKAGE_LAYOUTS[layout] || this.PACKAGE_LAYOUTS.dip;

    // Generate pin positions
    const pinoutPins = this.generatePinPositions(
      pins,
      layout,
      layoutConfig,
      options.scale
    );

    // Calculate diagram dimensions
    const dimensions = this.calculateDimensions(
      pinoutPins,
      layoutConfig,
      options.scale
    );

    // Generate SVG
    const svgData = this.generateSVG(
      pinoutPins,
      dimensions,
      packageType,
      options
    );

    // Generate interactive elements
    const interactiveElements = this.generateInteractiveElements(
      pinoutPins,
      options
    );

    return {
      componentId,
      componentName,
      packageType,
      pinCount: pins.length,
      pins: pinoutPins,
      dimensions,
      layout,
      svgData,
      interactiveElements,
    };
  }

  /**
   * Determine package layout from package type
   */
  private static determinePackageLayout(
    packageType: string
  ): "dip" | "qfp" | "bga" | "sop" | "custom" {
    const type = packageType.toLowerCase();

    if (type.includes("dip") || type.includes("pdip")) return "dip";
    if (type.includes("qfp") || type.includes("lqfp") || type.includes("tqfp"))
      return "qfp";
    if (type.includes("bga") || type.includes("fbga")) return "bga";
    if (type.includes("sop") || type.includes("soic") || type.includes("ssop"))
      return "sop";

    return "dip"; // Default fallback
  }

  /**
   * Generate pin positions based on package layout
   */
  private static generatePinPositions(
    pins: PinoutData[],
    layout: "dip" | "qfp" | "bga" | "sop" | "custom",
    layoutConfig: any,
    scale: number
  ): PinoutPin[] {
    switch (layout) {
      case "dip":
        return this.generateDIPLayout(pins, layoutConfig, scale);
      case "qfp":
        return this.generateQFPLayout(pins, layoutConfig, scale);
      case "bga":
        return this.generateBGALayout(pins, layoutConfig, scale);
      case "sop":
        return this.generateSOPLayout(pins, layoutConfig, scale);
      default:
        return this.generateDIPLayout(pins, layoutConfig, scale);
    }
  }

  /**
   * Generate DIP (Dual In-line Package) layout
   */
  private static generateDIPLayout(
    pins: PinoutData[],
    layoutConfig: any,
    scale: number
  ): PinoutPin[] {
    const pinoutPins: PinoutPin[] = [];
    const pinCount = pins.length;
    const pinsPerSide = Math.ceil(pinCount / 2);
    const spacing = layoutConfig.pinSpacing * scale;
    const bodyWidth = layoutConfig.bodyWidth * scale;

    pins.forEach((pin) => {
      const isLeftSide = pin.pinNumber <= pinsPerSide;
      const sideIndex = isLeftSide
        ? pin.pinNumber - 1
        : pinCount - pin.pinNumber;

      const x = isLeftSide ? 0 : bodyWidth;
      const y = sideIndex * spacing + spacing;

      pinoutPins.push({
        number: pin.pinNumber,
        name: pin.pinName,
        type: pin.pinType as any,
        description: pin.description,
        position: { x, y },
        electricalProperties: {
          voltage: pin.voltage,
          current: pin.current,
        },
        alternativeFunctions: this.extractAlternativeFunctions(pin.description),
        group: this.determinePinGroup(pin.pinName, pin.description),
      });
    });

    return pinoutPins;
  }

  /**
   * Generate QFP (Quad Flat Package) layout
   */
  private static generateQFPLayout(
    pins: PinoutData[],
    layoutConfig: any,
    scale: number
  ): PinoutPin[] {
    const pinoutPins: PinoutPin[] = [];
    const pinCount = pins.length;
    const pinsPerSide = pinCount / 4;
    const spacing = layoutConfig.pinSpacing * scale;
    const bodySize = layoutConfig.bodyWidth * scale;

    pins.forEach((pin) => {
      const pinNum = pin.pinNumber - 1;
      const side = Math.floor(pinNum / pinsPerSide);
      const sideIndex = pinNum % pinsPerSide;

      let x: number, y: number;

      switch (side) {
        case 0: // Bottom
          x = sideIndex * spacing + spacing;
          y = 0;
          break;
        case 1: // Right
          x = bodySize;
          y = sideIndex * spacing + spacing;
          break;
        case 2: // Top
          x = bodySize - (sideIndex * spacing + spacing);
          y = bodySize;
          break;
        case 3: // Left
          x = 0;
          y = bodySize - (sideIndex * spacing + spacing);
          break;
        default:
          x = 0;
          y = 0;
      }

      pinoutPins.push({
        number: pin.pinNumber,
        name: pin.pinName,
        type: pin.pinType as any,
        description: pin.description,
        position: { x, y },
        electricalProperties: {
          voltage: pin.voltage,
          current: pin.current,
        },
        alternativeFunctions: this.extractAlternativeFunctions(pin.description),
        group: this.determinePinGroup(pin.pinName, pin.description),
      });
    });

    return pinoutPins;
  }

  /**
   * Generate BGA (Ball Grid Array) layout
   */
  private static generateBGALayout(
    pins: PinoutData[],
    layoutConfig: any,
    scale: number
  ): PinoutPin[] {
    const pinoutPins: PinoutPin[] = [];
    const gridSize = Math.ceil(Math.sqrt(pins.length));
    const spacing = layoutConfig.pinSpacing * scale;

    pins.forEach((pin, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const x = col * spacing + spacing;
      const y = row * spacing + spacing;

      pinoutPins.push({
        number: pin.pinNumber,
        name: pin.pinName,
        type: pin.pinType as any,
        description: pin.description,
        position: { x, y },
        electricalProperties: {
          voltage: pin.voltage,
          current: pin.current,
        },
        alternativeFunctions: this.extractAlternativeFunctions(pin.description),
        group: this.determinePinGroup(pin.pinName, pin.description),
      });
    });

    return pinoutPins;
  }

  /**
   * Generate SOP (Small Outline Package) layout
   */
  private static generateSOPLayout(
    pins: PinoutData[],
    layoutConfig: any,
    scale: number
  ): PinoutPin[] {
    // Similar to DIP but with different spacing and dimensions
    return this.generateDIPLayout(pins, layoutConfig, scale);
  }

  /**
   * Extract alternative functions from pin description
   */
  private static extractAlternativeFunctions(description: string): string[] {
    const functions: string[] = [];

    // Common alternative function patterns
    const patterns = [
      /SPI|MOSI|MISO|SCK|SS/gi,
      /I2C|SDA|SCL/gi,
      /UART|TX|RX|RTS|CTS/gi,
      /PWM|Timer|TIM/gi,
      /ADC|DAC|Analog/gi,
      /GPIO|Digital/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = description.match(pattern);
      if (matches) {
        functions.push(...matches.map((m) => m.toUpperCase()));
      }
    });

    return [...new Set(functions)]; // Remove duplicates
  }

  /**
   * Determine pin group based on name and description
   */
  private static determinePinGroup(
    pinName: string,
    description: string
  ): string {
    const name = pinName.toLowerCase();
    const desc = description.toLowerCase();

    if (name.includes("vcc") || name.includes("vdd") || desc.includes("power"))
      return "Power";
    if (name.includes("gnd") || name.includes("vss") || desc.includes("ground"))
      return "Ground";
    if (desc.includes("spi") || name.includes("spi")) return "SPI";
    if (desc.includes("i2c") || name.includes("sda") || name.includes("scl"))
      return "I2C";
    if (desc.includes("uart") || name.includes("tx") || name.includes("rx"))
      return "UART";
    if (desc.includes("pwm") || desc.includes("timer")) return "PWM/Timer";
    if (desc.includes("adc") || desc.includes("analog")) return "Analog";
    if (desc.includes("gpio") || desc.includes("digital")) return "GPIO";
    if (name.includes("rst") || name.includes("reset")) return "Control";
    if (name.includes("clk") || name.includes("osc")) return "Clock";

    return "General";
  }

  /**
   * Calculate diagram dimensions
   */
  private static calculateDimensions(
    pins: PinoutPin[],
    layoutConfig: any,
    scale: number
  ): { width: number; height: number; pinSpacing: number } {
    if (pins.length === 0) {
      return { width: 100, height: 100, pinSpacing: 2.54 };
    }

    const maxX = Math.max(...pins.map((p) => p.position.x));
    const maxY = Math.max(...pins.map((p) => p.position.y));
    const padding = 20 * scale;

    return {
      width: maxX + padding * 2,
      height: maxY + padding * 2,
      pinSpacing: layoutConfig.pinSpacing * scale,
    };
  }

  /**
   * Generate SVG representation
   */
  private static generateSVG(
    pins: PinoutPin[],
    dimensions: { width: number; height: number; pinSpacing: number },
    packageType: string,
    options: PinoutGenerationOptions
  ): string {
    const { width, height } = dimensions;
    const theme = options.theme === "auto" ? "light" : options.theme;

    const colors = {
      background: theme === "dark" ? "#1F2937" : "#FFFFFF",
      text: theme === "dark" ? "#F9FAFB" : "#111827",
      package: theme === "dark" ? "#374151" : "#E5E7EB",
      packageStroke: theme === "dark" ? "#6B7280" : "#9CA3AF",
    };

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Background
    svg += `<rect width="${width}" height="${height}" fill="${colors.background}"/>`;

    // Package body
    const bodyPadding = 20;
    const bodyWidth = width - bodyPadding * 2;
    const bodyHeight = height - bodyPadding * 2;

    svg += `<rect x="${bodyPadding}" y="${bodyPadding}" width="${bodyWidth}" height="${bodyHeight}" 
             fill="${colors.package}" stroke="${colors.packageStroke}" stroke-width="2" rx="4"/>`;

    // Package label
    if (options.includeLabels) {
      svg += `<text x="${width / 2}" y="${
        bodyPadding + 20
      }" text-anchor="middle" 
               fill="${
                 colors.text
               }" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
               ${packageType}
             </text>`;
    }

    // Pins
    pins.forEach((pin) => {
      const pinX = pin.position.x + bodyPadding;
      const pinY = pin.position.y + bodyPadding;
      const pinColor = options.colorCodeByType
        ? this.PIN_COLORS[pin.type]
        : colors.packageStroke;

      // Pin circle
      svg += `<circle cx="${pinX}" cy="${pinY}" r="3" fill="${pinColor}" stroke="${colors.text}" stroke-width="1"/>`;

      // Pin number
      if (options.showPinNumbers) {
        svg += `<text x="${pinX}" y="${pinY + 1}" text-anchor="middle" 
                 fill="${
                   colors.background
                 }" font-family="Arial, sans-serif" font-size="8" font-weight="bold">
                 ${pin.number}
               </text>`;
      }

      // Pin name
      if (options.showPinNames && pin.name !== `P${pin.number}`) {
        const labelX = pinX + (pin.position.x < width / 2 ? -15 : 15);
        const anchor = pin.position.x < width / 2 ? "end" : "start";

        svg += `<text x="${labelX}" y="${pinY + 1}" text-anchor="${anchor}" 
                 fill="${
                   colors.text
                 }" font-family="Arial, sans-serif" font-size="10">
                 ${pin.name}
               </text>`;
      }
    });

    svg += "</svg>";
    return svg;
  }

  /**
   * Generate interactive elements for tooltips and highlighting
   */
  private static generateInteractiveElements(
    pins: PinoutPin[],
    options: PinoutGenerationOptions
  ): InteractiveElement[] {
    const elements: InteractiveElement[] = [];

    if (options.includeTooltips) {
      pins.forEach((pin) => {
        elements.push({
          id: `pin-${pin.number}`,
          type: "tooltip",
          pinNumber: pin.number,
          bounds: {
            x: pin.position.x - 5,
            y: pin.position.y - 5,
            width: 10,
            height: 10,
          },
          content: this.generateTooltipContent(pin),
        });
      });
    }

    return elements;
  }

  /**
   * Generate tooltip content for a pin
   */
  private static generateTooltipContent(pin: PinoutPin): string {
    let content = `<div class="pinout-tooltip">`;
    content += `<div class="pin-header">Pin ${pin.number}: ${pin.name}</div>`;
    content += `<div class="pin-type">Type: ${pin.type}</div>`;
    content += `<div class="pin-description">${pin.description}</div>`;

    if (pin.electricalProperties.voltage) {
      content += `<div class="pin-voltage">Voltage: ${pin.electricalProperties.voltage}V</div>`;
    }

    if (pin.alternativeFunctions && pin.alternativeFunctions.length > 0) {
      content += `<div class="pin-alt-functions">Alt Functions: ${pin.alternativeFunctions.join(
        ", "
      )}</div>`;
    }

    if (pin.group) {
      content += `<div class="pin-group">Group: ${pin.group}</div>`;
    }

    content += `</div>`;
    return content;
  }

  /**
   * Export pinout diagram to different formats
   */
  static exportPinoutDiagram(
    diagram: PinoutDiagram,
    format: "svg" | "png" | "pdf" = "svg"
  ): string | Blob {
    switch (format) {
      case "svg":
        return diagram.svgData;
      case "png":
        return this.convertSVGToPNG(diagram.svgData);
      case "pdf":
        return this.convertSVGToPDF(diagram.svgData);
      default:
        return diagram.svgData;
    }
  }

  /**
   * Convert SVG to PNG (placeholder implementation)
   */
  private static convertSVGToPNG(svgData: string): Blob {
    // In a real implementation, this would use canvas or a library like svg2png
    const canvas = document.createElement("canvas");
    const _ctx = canvas.getContext("2d"); // Reserved for future implementation

    // This is a simplified placeholder - real implementation would be more complex
    return new Blob([svgData], { type: "image/svg+xml" });
  }

  /**
   * Convert SVG to PDF (placeholder implementation)
   */
  private static convertSVGToPDF(svgData: string): Blob {
    // In a real implementation, this would use a library like jsPDF or PDFKit
    return new Blob([svgData], { type: "application/pdf" });
  }

  /**
   * Generate pinout diagram from component name (using datasheet service)
   */
  static async generateFromComponentName(
    componentName: string,
    options?: PinoutGenerationOptions
  ): Promise<PinoutDiagram | null> {
    try {
      // This would integrate with the DatasheetService to get component data
      // For now, return a mock implementation
      const mockPinData: PinoutData[] = this.generateMockPinData(componentName);

      if (mockPinData.length === 0) {
        return null;
      }

      return this.generatePinoutDiagram(mockPinData, options);
    } catch (error) {
      console.error("Error generating pinout from component name:", error);
      return null;
    }
  }

  /**
   * Generate mock pin data for demonstration
   */
  private static generateMockPinData(componentName: string): PinoutData[] {
    const name = componentName.toLowerCase();

    if (name.includes("atmega") || name.includes("arduino")) {
      return this.generateArduinoPinData();
    } else if (name.includes("esp32")) {
      return this.generateESP32PinData();
    } else if (name.includes("raspberry")) {
      return this.generateRaspberryPiPinData();
    }

    return this.generateGenericPinData(28); // Default 28-pin DIP
  }

  /**
   * Generate Arduino/ATmega pin data
   */
  private static generateArduinoPinData(): PinoutData[] {
    return [
      {
        pinNumber: 1,
        pinName: "RESET",
        pinType: "input",
        description: "Reset input (active low)",
      },
      {
        pinNumber: 2,
        pinName: "D0/RX",
        pinType: "bidirectional",
        description: "Digital I/O, UART RX",
      },
      {
        pinNumber: 3,
        pinName: "D1/TX",
        pinType: "bidirectional",
        description: "Digital I/O, UART TX",
      },
      {
        pinNumber: 4,
        pinName: "D2",
        pinType: "bidirectional",
        description: "Digital I/O",
      },
      {
        pinNumber: 5,
        pinName: "D3/PWM",
        pinType: "bidirectional",
        description: "Digital I/O, PWM output",
      },
      {
        pinNumber: 6,
        pinName: "D4",
        pinType: "bidirectional",
        description: "Digital I/O",
      },
      {
        pinNumber: 7,
        pinName: "VCC",
        pinType: "power",
        description: "Power supply",
        voltage: 5.0,
      },
      {
        pinNumber: 8,
        pinName: "GND",
        pinType: "ground",
        description: "Ground",
        voltage: 0,
      },
      {
        pinNumber: 9,
        pinName: "XTAL1",
        pinType: "input",
        description: "Crystal oscillator input",
      },
      {
        pinNumber: 10,
        pinName: "XTAL2",
        pinType: "output",
        description: "Crystal oscillator output",
      },
      // ... more pins would be added for a complete implementation
    ];
  }

  /**
   * Generate ESP32 pin data
   */
  private static generateESP32PinData(): PinoutData[] {
    return [
      {
        pinNumber: 1,
        pinName: "GND",
        pinType: "ground",
        description: "Ground",
        voltage: 0,
      },
      {
        pinNumber: 2,
        pinName: "3V3",
        pinType: "power",
        description: "3.3V power supply",
        voltage: 3.3,
      },
      {
        pinNumber: 3,
        pinName: "EN",
        pinType: "input",
        description: "Enable (active high)",
      },
      {
        pinNumber: 4,
        pinName: "GPIO36",
        pinType: "input",
        description: "GPIO36, ADC1_CH0",
      },
      {
        pinNumber: 5,
        pinName: "GPIO39",
        pinType: "input",
        description: "GPIO39, ADC1_CH3",
      },
      {
        pinNumber: 6,
        pinName: "GPIO34",
        pinType: "input",
        description: "GPIO34, ADC1_CH6",
      },
      // ... more pins would be added for a complete implementation
    ];
  }

  /**
   * Generate Raspberry Pi pin data
   */
  private static generateRaspberryPiPinData(): PinoutData[] {
    return [
      {
        pinNumber: 1,
        pinName: "3V3",
        pinType: "power",
        description: "3.3V power",
        voltage: 3.3,
      },
      {
        pinNumber: 2,
        pinName: "5V",
        pinType: "power",
        description: "5V power",
        voltage: 5.0,
      },
      {
        pinNumber: 3,
        pinName: "GPIO2/SDA",
        pinType: "bidirectional",
        description: "GPIO2, I2C SDA",
      },
      {
        pinNumber: 4,
        pinName: "5V",
        pinType: "power",
        description: "5V power",
        voltage: 5.0,
      },
      {
        pinNumber: 5,
        pinName: "GPIO3/SCL",
        pinType: "bidirectional",
        description: "GPIO3, I2C SCL",
      },
      {
        pinNumber: 6,
        pinName: "GND",
        pinType: "ground",
        description: "Ground",
        voltage: 0,
      },
      // ... more pins would be added for a complete implementation
    ];
  }

  /**
   * Generate generic pin data
   */
  private static generateGenericPinData(pinCount: number): PinoutData[] {
    const pins: PinoutData[] = [];

    for (let i = 1; i <= pinCount; i++) {
      let pinType: PinoutData["pinType"] = "bidirectional";
      let pinName = `P${i}`;
      let description = `General purpose I/O pin ${i}`;

      // Special pins
      if (i === 1) {
        pinType = "input";
        pinName = "RESET";
        description = "Reset input";
      } else if (i === Math.floor(pinCount / 4)) {
        pinType = "power";
        pinName = "VCC";
        description = "Power supply";
      } else if (i === Math.floor(pinCount / 2)) {
        pinType = "ground";
        pinName = "GND";
        description = "Ground";
      }

      pins.push({
        pinNumber: i,
        pinName,
        pinType,
        description,
      });
    }

    return pins;
  }
}

export default PinoutGeneratorService;
