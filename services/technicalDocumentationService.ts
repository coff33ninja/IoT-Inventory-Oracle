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
    // In a real implementation, this would link to actual datasheets
    const cleanName = item.name.replace(/\s+/g, '-').toLowerCase();
    return `https://datasheets.example.com/${cleanName}.pdf`;
  }

  private generateManualUrl(item: InventoryItem): string {
    const cleanName = item.name.replace(/\s+/g, '-').toLowerCase();
    return `https://manuals.example.com/${cleanName}.pdf`;
  }

  private generateExampleUrl(item: InventoryItem): string {
    const cleanName = item.name.replace(/\s+/g, '-').toLowerCase();
    return `https://github.com/examples/${cleanName}-examples`;
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
    // Generate realistic specifications based on component type
    const category = item.category?.toLowerCase() || '';
    
    if (category.includes('microcontroller') || category.includes('arduino')) {
      return {
        'Supply Voltage': '3.3V - 5V',
        'Operating Current': '20mA',
        'Flash Memory': '32KB',
        'SRAM': '2KB',
        'EEPROM': '1KB',
        'Digital I/O Pins': 14,
        'Analog Input Pins': 6,
        'PWM Pins': 6,
        'Operating Temperature': '-40°C to +85°C',
        'Clock Speed': '16MHz'
      };
    } else if (category.includes('sensor')) {
      return {
        'Supply Voltage': '3.3V - 5V',
        'Operating Current': '0.5mA',
        'Resolution': '12-bit',
        'Accuracy': '±0.5%',
        'Operating Temperature': '-40°C to +85°C',
        'Communication Protocol': 'I2C, SPI',
        'Response Time': '100ms',
        'Package Type': 'QFN-16'
      };
    } else if (category.includes('resistor')) {
      return {
        'Resistance': item.description?.match(/(\d+(?:\.\d+)?)\s*[kKmM]?[Ωω]/)?.[0] || '1kΩ',
        'Tolerance': '±5%',
        'Power Rating': '0.25W',
        'Temperature Coefficient': '±100ppm/°C',
        'Operating Temperature': '-55°C to +155°C',
        'Package Type': '0805'
      };
    } else if (category.includes('capacitor')) {
      return {
        'Capacitance': item.description?.match(/(\d+(?:\.\d+)?)\s*[pnuμmf]F/i)?.[0] || '100nF',
        'Voltage Rating': '50V',
        'Tolerance': '±10%',
        'Temperature Coefficient': 'X7R',
        'Operating Temperature': '-55°C to +125°C',
        'Package Type': '0805'
      };
    } else {
      return {
        'Supply Voltage': '3.3V - 5V',
        'Operating Current': '10mA',
        'Operating Temperature': '-40°C to +85°C',
        'Package Type': 'Generic'
      };
    }
  }

  private generatePinoutForComponent(item: InventoryItem): PinConfiguration[] | undefined {
    const category = item.category?.toLowerCase() || '';
    
    if (category.includes('microcontroller') || category.includes('arduino')) {
      return [
        { pin: 1, name: 'VCC', type: 'power', voltage: 5, description: 'Power supply input' },
        { pin: 2, name: 'GND', type: 'ground', description: 'Ground connection' },
        { pin: 3, name: 'RESET', type: 'input', description: 'Reset input (active low)' },
        { pin: 4, name: 'D0', type: 'bidirectional', description: 'Digital I/O pin 0' },
        { pin: 5, name: 'D1', type: 'bidirectional', description: 'Digital I/O pin 1' },
        { pin: 6, name: 'D2', type: 'bidirectional', description: 'Digital I/O pin 2' },
        { pin: 7, name: 'D3', type: 'bidirectional', description: 'Digital I/O pin 3 (PWM)' },
        { pin: 8, name: 'A0', type: 'analog', description: 'Analog input 0' }
      ];
    } else if (category.includes('sensor')) {
      return [
        { pin: 1, name: 'VCC', type: 'power', voltage: 5, description: 'Power supply input' },
        { pin: 2, name: 'GND', type: 'ground', description: 'Ground connection' },
        { pin: 3, name: 'SDA', type: 'bidirectional', description: 'I2C data line' },
        { pin: 4, name: 'SCL', type: 'input', description: 'I2C clock line' },
        { pin: 5, name: 'INT', type: 'output', description: 'Interrupt output' }
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
    const category = item.category?.toLowerCase() || '';
    
    if (category.includes('microcontroller')) {
      return [
        'Low power consumption',
        'Built-in ADC',
        'PWM outputs',
        'I2C and SPI interfaces',
        'Programmable interrupt',
        'Wide operating voltage range'
      ];
    } else if (category.includes('sensor')) {
      return [
        'High accuracy measurements',
        'Low power consumption',
        'I2C and SPI interfaces',
        'Programmable interrupt',
        'Wide operating voltage range',
        'Integrated temperature compensation'
      ];
    }
    
    return [
      'Reliable performance',
      'Industry standard package',
      'RoHS compliant',
      'Wide operating temperature range'
    ];
  }

  private generateApplications(item: InventoryItem): string[] {
    const category = item.category?.toLowerCase() || '';
    
    if (category.includes('microcontroller')) {
      return [
        'IoT devices',
        'Home automation',
        'Robotics projects',
        'Data logging',
        'Sensor networks'
      ];
    } else if (category.includes('sensor')) {
      return [
        'IoT sensor nodes',
        'Environmental monitoring',
        'Industrial automation',
        'Smart home devices',
        'Wearable electronics'
      ];
    }
    
    return [
      'General electronics projects',
      'Prototyping',
      'Educational projects',
      'Hobby electronics'
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