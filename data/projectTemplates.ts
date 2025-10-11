import { Project } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  estimatedTime: string;
  components: {
    name: string;
    quantity: number;
    required: boolean;
    alternatives?: string[];
  }[];
  instructions: string[];
  codeSnippet?: string;
  circuitDiagram?: string;
  tags: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'smart-led-strip',
    name: 'Smart LED Strip Controller',
    description: 'WiFi-controlled RGB LED strip with mobile app control and preset patterns',
    difficulty: 'Beginner',
    category: 'Lighting',
    estimatedTime: '2-3 hours',
    components: [
      { name: 'ESP32', quantity: 1, required: true },
      { name: 'RGB LED Strip', quantity: 1, required: true },
      { name: 'MOSFET', quantity: 3, required: true },
      { name: '12V Power Supply', quantity: 1, required: true },
      { name: 'Breadboard', quantity: 1, required: false },
      { name: 'Jumper Wires', quantity: 10, required: true }
    ],
    instructions: [
      'Connect ESP32 to breadboard',
      'Wire MOSFETs for RGB channels',
      'Connect LED strip to MOSFETs',
      'Upload WiFi control code',
      'Test with mobile app'
    ],
    codeSnippet: `
#include <WiFi.h>
#include <WebServer.h>

const int redPin = 25;
const int greenPin = 26;
const int bluePin = 27;

WebServer server(80);

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
  
  WiFi.begin("YourWiFi", "YourPassword");
  server.begin();
}

void loop() {
  server.handleClient();
}`,
    tags: ['WiFi', 'LED', 'Mobile Control', 'RGB']
  },
  {
    id: 'weather-station',
    name: 'IoT Weather Station',
    description: 'Complete weather monitoring system with temperature, humidity, and pressure sensors',
    difficulty: 'Intermediate',
    category: 'Sensors',
    estimatedTime: '4-6 hours',
    components: [
      { name: 'ESP32', quantity: 1, required: true },
      { name: 'DHT22', quantity: 1, required: true, alternatives: ['DHT11'] },
      { name: 'BMP280', quantity: 1, required: true, alternatives: ['BME280'] },
      { name: 'OLED Display', quantity: 1, required: false },
      { name: 'Solar Panel', quantity: 1, required: false },
      { name: 'Battery Pack', quantity: 1, required: false }
    ],
    instructions: [
      'Wire sensors to ESP32',
      'Connect OLED display (optional)',
      'Set up WiFi connection',
      'Configure data logging',
      'Create web dashboard',
      'Add solar power (optional)'
    ],
    tags: ['Sensors', 'Weather', 'Data Logging', 'Solar']
  },
  {
    id: 'smart-door-lock',
    name: 'Smart Door Lock System',
    description: 'RFID and mobile app controlled door lock with access logging',
    difficulty: 'Advanced',
    category: 'Security',
    estimatedTime: '8-12 hours',
    components: [
      { name: 'ESP32', quantity: 1, required: true },
      { name: 'RFID Reader', quantity: 1, required: true },
      { name: 'Servo Motor', quantity: 1, required: true },
      { name: 'Relay Module', quantity: 1, required: true },
      { name: 'Buzzer', quantity: 1, required: true },
      { name: 'LED Strip', quantity: 1, required: false },
      { name: '12V Power Supply', quantity: 1, required: true }
    ],
    instructions: [
      'Design mechanical lock mechanism',
      'Wire RFID reader and servo',
      'Implement access control logic',
      'Create mobile app interface',
      'Set up access logging',
      'Add security features',
      'Test and calibrate system'
    ],
    tags: ['RFID', 'Security', 'Mobile App', 'Access Control']
  },
  {
    id: 'plant-monitor',
    name: 'Smart Plant Monitoring System',
    description: 'Automated plant care with soil moisture, light, and temperature monitoring',
    difficulty: 'Beginner',
    category: 'Agriculture',
    estimatedTime: '3-4 hours',
    components: [
      { name: 'Arduino Uno', quantity: 1, required: true, alternatives: ['ESP32'] },
      { name: 'Soil Moisture Sensor', quantity: 1, required: true },
      { name: 'Light Sensor', quantity: 1, required: true },
      { name: 'DHT22', quantity: 1, required: true },
      { name: 'Water Pump', quantity: 1, required: false },
      { name: 'Relay Module', quantity: 1, required: false }
    ],
    instructions: [
      'Connect sensors to Arduino',
      'Set up data collection',
      'Implement watering logic',
      'Create alert system',
      'Add mobile notifications'
    ],
    tags: ['Agriculture', 'Sensors', 'Automation', 'Plants']
  }
];

export const getTemplatesByDifficulty = (difficulty: ProjectTemplate['difficulty']) => 
  PROJECT_TEMPLATES.filter(template => template.difficulty === difficulty);

export const getTemplatesByCategory = (category: string) => 
  PROJECT_TEMPLATES.filter(template => template.category === category);

export const searchTemplates = (query: string) => 
  PROJECT_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(query.toLowerCase()) ||
    template.description.toLowerCase().includes(query.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );