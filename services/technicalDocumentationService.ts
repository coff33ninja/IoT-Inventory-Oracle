import DatabaseService from './databaseService.js';
import { InventoryItem } from '../types.js';

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

export interface ParsedDatasheet {
  extractedSpecs: { [key: string]: string };
  features: string[];
  applications: string[];
  pinCount: number;
  packageType: string;
}

class TechnicalDocumentationService {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  async getTechnicalDocuments(): Promise<TechnicalDocument[]> {
    try {
      // Get all inventory items to generate documents for
      const items = this.dbService.getAllItems();
      
      // Generate technical documents for each component
      const documents: TechnicalDocument[] = [];
      
      for (const item of items) {
        // Generate datasheet document
        documents.push({
          id: `${item.id}-datasheet`,
          componentId: item.id,
          type: 'datasheet',
          title: `${item.name} Datasheet`,
          url: this.generateDatasheetUrl(item),
          description: `Official datasheet for ${item.name}`,
          fileSize: '2.3 MB',
          language: 'English',
          lastUpdated: new Date().toISOString().split('T')[0],
          tags: ['official', 'specifications', 'electrical']
        });

        // Generate manual document
        documents.push({
          id: `${item.id}-manual`,
          componentId: item.id,
          type: 'manual',
          title: `${item.name} User Manual`,
          url: this.generateManualUrl(item),
          description: `User manual and application guide for ${item.name}`,
          fileSize: '5.1 MB',
          language: 'English',
          lastUpdated: new Date().toISOString().split('T')[0],
          tags: ['manual', 'usage', 'examples']
        });

        // Generate example code document if it's a programmable component
        if (this.isProgrammableComponent(item)) {
          documents.push({
            id: `${item.id}-example`,
            componentId: item.id,
            type: 'example',
            title: `${item.name} Code Examples`,
            url: this.generateExampleUrl(item),
            description: `Arduino and Raspberry Pi code examples for ${item.name}`,
            language: 'Multiple',
            lastUpdated: new Date().toISOString().split('T')[0],
            tags: ['code', 'arduino', 'raspberry-pi', 'examples']
          });
        }
      }

      return documents;
    } catch (error) {
      console.error('Error getting technical documents:', error);
      return [];
    }
  }

  async getTechnicalSpecifications(): Promise<ComponentSpecification[]> {
    try {
      const items = this.dbService.getAllItems();
      const specifications: ComponentSpecification[] = [];

      for (const item of items) {
        const spec = this.generateComponentSpecification(item);
        if (spec) {
          specifications.push(spec);
        }
      }

      return specifications;
    } catch (error) {
      console.error('Error getting technical specifications:', error);
      return [];
    }
  }

  async parseDatasheet(documentId: string): Promise<ParsedDatasheet> {
    try {
      // Extract component ID from document ID
      const componentId = documentId.replace('-datasheet', '');
      const item = this.dbService.getItemById(componentId);
      
      if (!item) {
        throw new Error('Component not found');
      }

      // Simulate datasheet parsing - in a real implementation, this would use OCR/PDF parsing
      return this.simulateDatasheetParsing(item);
    } catch (error) {
      console.error('Error parsing datasheet:', error);
      return {
        extractedSpecs: {},
        features: [],
        applications: [],
        pinCount: 0,
        packageType: 'Unknown'
      };
    }
  }

  async generatePinoutDiagram(componentId: string): Promise<any> {
    try {
      const item = this.dbService.getItemById(componentId);
      if (!item) {
        throw new Error('Component not found');
      }

      const specification = this.generateComponentSpecification(item);
      return {
        componentId,
        pinout: specification?.pinout || [],
        packageInfo: specification?.packageInfo,
        diagramUrl: this.generatePinoutDiagramUrl(item)
      };
    } catch (error) {
      console.error('Error generating pinout diagram:', error);
      return null;
    }
  }

  async generateSchematicSymbol(componentId: string): Promise<any> {
    try {
      const item = this.dbService.getItemById(componentId);
      if (!item) {
        throw new Error('Component not found');
      }

      return {
        componentId,
        symbolType: this.detectSymbolType(item),
        symbolData: this.generateSymbolData(item),
        downloadUrl: this.generateSchematicSymbolUrl(item)
      };
    } catch (error) {
      console.error('Error generating schematic symbol:', error);
      return null;
    }
  }

  async searchTechnicalDocuments(query: string, filters?: any): Promise<TechnicalDocument[]> {
    try {
      const allDocuments = await this.getTechnicalDocuments();
      
      // Filter documents based on query and filters
      let filteredDocuments = allDocuments.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.description?.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      // Apply additional filters if provided
      if (filters) {
        if (filters.documentType && filters.documentType.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => 
            filters.documentType.includes(doc.type)
          );
        }
        
        if (filters.language) {
          filteredDocuments = filteredDocuments.filter(doc => 
            doc.language === filters.language
          );
        }
      }

      return filteredDocuments;
    } catch (error) {
      console.error('Error searching technical documents:', error);
      return [];
    }
  }

  private generateDatasheetUrl(item: InventoryItem): string {
    // Map to real datasheet sources based on component type
    const name = item.name.toLowerCase();
    
    if (name.includes('arduino uno')) {
      return 'https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf';
    }
    if (name.includes('esp32')) {
      return 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf';
    }
    if (name.includes('hc-sr04')) {
      return 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf';
    }
    if (name.includes('dht22')) {
      return 'https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf';
    }
    if (name.includes('sg90')) {
      return 'http://www.ee.ic.ac.uk/pcheung/teaching/DE1_EE/stores/sg90_datasheet.pdf';
    }
    if (name.includes('raspberry pi')) {
      return 'https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-datasheet.pdf';
    }
    
    // Generic search URL for unknown components
    const searchName = encodeURIComponent(item.name);
    return `https://www.google.com/search?q=${searchName}+datasheet+filetype:pdf`;
  }

  private generateManualUrl(item: InventoryItem): string {
    const name = item.name.toLowerCase();
    
    if (name.includes('arduino')) {
      return 'https://docs.arduino.cc/';
    }
    if (name.includes('esp32')) {
      return 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/';
    }
    if (name.includes('raspberry pi')) {
      return 'https://www.raspberrypi.org/documentation/';
    }
    
    // Generic documentation search
    const searchName = encodeURIComponent(item.name);
    return `https://www.google.com/search?q=${searchName}+documentation+manual`;
  }

  private generateExampleUrl(item: InventoryItem): string {
    const name = item.name.toLowerCase();
    
    if (name.includes('arduino')) {
      return 'https://github.com/arduino/arduino-examples';
    }
    if (name.includes('esp32')) {
      return 'https://github.com/espressif/esp-idf/tree/master/examples';
    }
    if (name.includes('raspberry pi')) {
      return 'https://github.com/raspberrypi/pico-examples';
    }
    if (name.includes('hc-sr04')) {
      return 'https://github.com/search?q=HC-SR04+arduino+example';
    }
    
    // Generic GitHub search for examples
    const searchName = encodeURIComponent(item.name.replace(/\s+/g, '+'));
    return `https://github.com/search?q=${searchName}+example`;
  }

  private generatePinoutDiagramUrl(item: InventoryItem): string {
    const cleanName = item.name.replace(/\s+/g, '-').toLowerCase();
    return `https://pinouts.example.com/${cleanName}.svg`;
  }

  private generateSchematicSymbolUrl(item: InventoryItem): string {
    const cleanName = item.name.replace(/\s+/g, '-').toLowerCase();
    return `https://symbols.example.com/${cleanName}.lib`;
  }

  private isProgrammableComponent(item: InventoryItem): boolean {
    const programmableKeywords = ['microcontroller', 'arduino', 'raspberry', 'esp', 'sensor', 'module'];
    const name = item.name.toLowerCase();
    const category = item.category?.toLowerCase() || '';
    
    return programmableKeywords.some(keyword => 
      name.includes(keyword) || category.includes(keyword)
    );
  }

  private generateComponentSpecification(item: InventoryItem): ComponentSpecification | null {
    try {
      // Generate specifications based on component type and category
      const specs = this.generateSpecsForComponent(item);
      const pinout = this.generatePinoutForComponent(item);
      const operatingConditions = this.generateOperatingConditions(item);
      const features = this.generateFeatures(item);
      const applications = this.generateApplications(item);
      const packageInfo = this.generatePackageInfo(item);

      return {
        componentId: item.id,
        specifications: specs,
        pinout,
        operatingConditions,
        features,
        applications,
        packageInfo
      };
    } catch (error) {
      console.error('Error generating component specification:', error);
      return null;
    }
  }

  private generateSpecsForComponent(item: InventoryItem): { [key: string]: string | number | boolean } {
    const name = item.name.toLowerCase();
    const category = item.category?.toLowerCase() || '';
    
    // Specific component specifications
    if (name.includes('arduino uno')) {
      return {
        'Microcontroller': 'ATmega328P',
        'Operating Voltage': '5V',
        'Input Voltage': '7-12V',
        'Digital I/O Pins': 14,
        'PWM Pins': 6,
        'Analog Input Pins': 6,
        'DC Current per I/O Pin': '20mA',
        'Flash Memory': '32KB',
        'SRAM': '2KB',
        'EEPROM': '1KB',
        'Clock Speed': '16MHz'
      };
    }
    
    if (name.includes('esp32')) {
      return {
        'CPU': 'Xtensa dual-core 32-bit LX6',
        'Clock Speed': '240MHz',
        'Flash Memory': '4MB',
        'SRAM': '520KB',
        'WiFi': '802.11 b/g/n',
        'Bluetooth': 'v4.2 BR/EDR and BLE',
        'GPIO Pins': 34,
        'ADC': '12-bit',
        'Operating Voltage': '3.3V',
        'Input Voltage': '3.0V - 3.6V'
      };
    }
    
    if (name.includes('hc-sr04')) {
      return {
        'Working Voltage': '5V DC',
        'Working Current': '15mA',
        'Working Frequency': '40Hz',
        'Max Range': '4m',
        'Min Range': '2cm',
        'Measuring Angle': '15°',
        'Trigger Input Signal': '10µS TTL pulse',
        'Echo Output Signal': 'Input TTL lever signal',
        'Dimensions': '45mm x 20mm x 15mm'
      };
    }
    
    if (name.includes('dht22')) {
      return {
        'Power Supply': '3.3V - 6V DC',
        'Output Signal': 'Digital signal via single-bus',
        'Sensing Element': 'Polymer capacitor',
        'Operating Range': '-40°C to 80°C, 0-100% RH',
        'Accuracy': '±0.5°C, ±1% RH',
        'Resolution': '0.1°C, 0.1% RH',
        'Repeatability': '±0.2°C, ±0.1% RH',
        'Humidity Hysteresis': '±0.3% RH',
        'Long-term Stability': '±0.5% RH/year'
      };
    }
    
    if (name.includes('sg90')) {
      return {
        'Weight': '9g',
        'Dimension': '22.2 x 11.8 x 31mm',
        'Stall Torque': '1.8kgf·cm',
        'Operating Speed': '0.1s/60°',
        'Operating Voltage': '4.8V - 6V',
        'Dead Band Width': '10µs',
        'Operating Angle': '180°',
        'Control System': 'Analog',
        'Gear Type': 'Plastic'
      };
    }
    
    // Fallback based on category
    if (category.includes('microcontroller')) {
      return {
        'Type': 'Microcontroller',
        'Operating Voltage': '3.3V - 5V',
        'Flash Memory': 'Varies',
        'GPIO Pins': 'Multiple',
        'Communication': 'UART, SPI, I2C'
      };
    }
    
    if (category.includes('sensor')) {
      return {
        'Type': 'Sensor',
        'Operating Voltage': '3.3V - 5V',
        'Output': 'Digital/Analog',
        'Interface': 'GPIO/I2C/SPI'
      };
    }
    
    return {
      'Type': category || 'Electronic Component',
      'Status': 'Available in inventory'
    };
  }

  private generatePinoutForComponent(item: InventoryItem): PinConfiguration[] | undefined {
    const name = item.name.toLowerCase();
    
    if (name.includes('hc-sr04')) {
      return [
        { pin: 1, name: 'VCC', type: 'power', voltage: 5, description: '5V power supply' },
        { pin: 2, name: 'Trig', type: 'input', description: 'Trigger input pin' },
        { pin: 3, name: 'Echo', type: 'output', description: 'Echo output pin' },
        { pin: 4, name: 'GND', type: 'ground', description: 'Ground connection' }
      ];
    }
    
    if (name.includes('dht22')) {
      return [
        { pin: 1, name: 'VDD', type: 'power', voltage: 3.3, description: '3.3V-5V power supply' },
        { pin: 2, name: 'DATA', type: 'bidirectional', description: 'Serial data, single bus' },
        { pin: 3, name: 'NC', type: 'input', description: 'Not connected' },
        { pin: 4, name: 'GND', type: 'ground', description: 'Ground connection' }
      ];
    }
    
    if (name.includes('sg90')) {
      return [
        { pin: 1, name: 'GND', type: 'ground', description: 'Ground (Brown wire)' },
        { pin: 2, name: 'VCC', type: 'power', voltage: 5, description: '5V power (Red wire)' },
        { pin: 3, name: 'Signal', type: 'input', description: 'PWM control signal (Orange wire)' }
      ];
    }
    
    if (name.includes('esp32')) {
      return [
        { pin: 1, name: '3V3', type: 'power', voltage: 3.3, description: '3.3V power output' },
        { pin: 2, name: 'GND', type: 'ground', description: 'Ground' },
        { pin: 3, name: 'GPIO0', type: 'bidirectional', description: 'General purpose I/O' },
        { pin: 4, name: 'GPIO2', type: 'bidirectional', description: 'General purpose I/O' },
        { pin: 5, name: 'GPIO4', type: 'bidirectional', description: 'General purpose I/O' },
        { pin: 6, name: 'GPIO5', type: 'bidirectional', description: 'General purpose I/O' },
        { pin: 7, name: 'VIN', type: 'power', voltage: 5, description: 'External power input' },
        { pin: 8, name: 'EN', type: 'input', description: 'Enable pin (active high)' }
      ];
    }
    
    // Generic microcontroller pinout
    const category = item.category?.toLowerCase() || '';
    if (category.includes('microcontroller')) {
      return [
        { pin: 1, name: 'VCC', type: 'power', voltage: 5, description: 'Power supply' },
        { pin: 2, name: 'GND', type: 'ground', description: 'Ground' },
        { pin: 3, name: 'RST', type: 'input', description: 'Reset pin' },
        { pin: 4, name: 'GPIO', type: 'bidirectional', description: 'General purpose I/O' }
      ];
    }
    
    return undefined;
  }

  private generateOperatingConditions(item: InventoryItem): ComponentSpecification['operatingConditions'] {
    const category = item.category?.toLowerCase() || '';
    
    if (category.includes('microcontroller') || category.includes('sensor')) {
      return {
        voltage: { min: 3.3, max: 5.0, unit: 'V' },
        current: { max: 50, unit: 'mA' },
        temperature: { min: -40, max: 85, unit: '°C' },
        frequency: { min: 0, max: 16, unit: 'MHz' }
      };
    }
    
    return {
      voltage: { min: 3.3, max: 5.0, unit: 'V' },
      temperature: { min: -40, max: 85, unit: '°C' }
    };
  }

  private generateFeatures(item: InventoryItem): string[] {
    const name = item.name.toLowerCase();
    
    if (name.includes('arduino uno')) {
      return [
        'ATmega328P microcontroller',
        'USB programming interface',
        '14 digital I/O pins',
        '6 analog inputs',
        'Built-in LED on pin 13',
        'Auto-reset capability',
        'Extensive library support'
      ];
    }
    
    if (name.includes('esp32')) {
      return [
        'Dual-core processor',
        'Built-in WiFi and Bluetooth',
        'Low power consumption',
        'Rich peripheral interfaces',
        'Security features',
        'Real-time operating system',
        'Arduino IDE compatible'
      ];
    }
    
    if (name.includes('hc-sr04')) {
      return [
        'Non-contact measurement',
        '2cm to 400cm range',
        'High accuracy',
        'Stable performance',
        'Easy to use',
        'Low cost',
        'Widely supported'
      ];
    }
    
    if (name.includes('dht22')) {
      return [
        'Digital output',
        'High precision',
        'Excellent long-term stability',
        'Fast response',
        'Anti-interference ability',
        'Cost-effective',
        'Single wire interface'
      ];
    }
    
    if (name.includes('sg90')) {
      return [
        'Lightweight design',
        'High precision',
        'Smooth operation',
        'Easy control',
        'Standard servo interface',
        'Affordable price',
        'Reliable performance'
      ];
    }
    
    return [
      'Standard electronic component',
      'Reliable operation',
      'Industry standard',
      'Cost effective'
    ];
  }

  private generateApplications(item: InventoryItem): string[] {
    const name = item.name.toLowerCase();
    
    if (name.includes('arduino uno')) {
      return [
        'Learning programming and electronics',
        'Prototyping IoT devices',
        'Home automation systems',
        'Robotics control',
        'Sensor data collection',
        'LED matrix displays',
        'Motor control projects'
      ];
    }
    
    if (name.includes('esp32')) {
      return [
        'WiFi-enabled IoT projects',
        'Bluetooth communication',
        'Web server applications',
        'Remote monitoring systems',
        'Smart home controllers',
        'Wireless sensor networks',
        'Edge computing devices'
      ];
    }
    
    if (name.includes('hc-sr04')) {
      return [
        'Distance measurement',
        'Obstacle avoidance robots',
        'Parking sensors',
        'Water level monitoring',
        'Security systems',
        'Automatic doors',
        'Range finding applications'
      ];
    }
    
    if (name.includes('dht22')) {
      return [
        'Weather stations',
        'Greenhouse monitoring',
        'HVAC control systems',
        'Indoor air quality monitoring',
        'Data logging applications',
        'Smart thermostats',
        'Environmental research'
      ];
    }
    
    if (name.includes('sg90')) {
      return [
        'Robot arm joints',
        'Camera pan/tilt mechanisms',
        'RC vehicle steering',
        'Automated blinds/curtains',
        'Robotic grippers',
        'Antenna positioning',
        'Educational robotics'
      ];
    }
    
    return [
      'Electronics prototyping',
      'Educational projects',
      'Hobby applications',
      'System integration'
    ];
  }

  private generatePackageInfo(item: InventoryItem): ComponentSpecification['packageInfo'] {
    const category = item.category?.toLowerCase() || '';
    
    if (category.includes('microcontroller')) {
      return {
        type: 'DIP-28',
        dimensions: '35.56mm x 7.62mm',
        pinCount: 28
      };
    } else if (category.includes('sensor')) {
      return {
        type: 'QFN-16',
        dimensions: '3mm x 3mm',
        pinCount: 16
      };
    } else if (category.includes('resistor') || category.includes('capacitor')) {
      return {
        type: '0805',
        dimensions: '2.0mm x 1.25mm',
        pinCount: 2
      };
    }
    
    return {
      type: 'Generic',
      pinCount: 2
    };
  }

  private simulateDatasheetParsing(item: InventoryItem): ParsedDatasheet {
    const specs = this.generateSpecsForComponent(item);
    const features = this.generateFeatures(item);
    const applications = this.generateApplications(item);
    const packageInfo = this.generatePackageInfo(item);
    
    return {
      extractedSpecs: Object.fromEntries(
        Object.entries(specs).map(([key, value]) => [key, value.toString()])
      ),
      features,
      applications,
      pinCount: packageInfo?.pinCount || 0,
      packageType: packageInfo?.type || 'Unknown'
    };
  }

  private detectSymbolType(item: InventoryItem): string {
    const name = item.name.toLowerCase();
    const category = item.category?.toLowerCase() || '';
    
    if (name.includes('resistor') || category.includes('resistor')) return 'resistor';
    if (name.includes('capacitor') || category.includes('capacitor')) return 'capacitor';
    if (name.includes('inductor') || category.includes('inductor')) return 'inductor';
    if (name.includes('diode') || category.includes('diode')) return 'diode';
    if (name.includes('transistor') || category.includes('transistor')) return 'transistor';
    if (name.includes('connector') || category.includes('connector')) return 'connector';
    if (name.includes('ic') || name.includes('chip') || category.includes('ic') || category.includes('microcontroller')) return 'ic';
    
    return 'generic';
  }

  private generateSymbolData(item: InventoryItem): any {
    const symbolType = this.detectSymbolType(item);
    const packageInfo = this.generatePackageInfo(item);
    
    return {
      type: symbolType,
      width: symbolType === 'ic' ? 120 : 80,
      height: symbolType === 'ic' ? 80 : 40,
      pinCount: packageInfo?.pinCount || 0,
      label: item.name
    };
  }
}

export default TechnicalDocumentationService;