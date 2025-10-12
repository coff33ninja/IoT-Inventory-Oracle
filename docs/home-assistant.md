# Home Assistant Integration

Connect your Home Assistant smart home system with IoT Inventory Oracle to bridge the gap between your digital entities and physical components.

## Overview

The Home Assistant integration provides:
- **Entity Discovery**: Automatically discover all your HA entities
- **Physical Linking**: Connect digital entities to physical inventory components
- **Hardware Tracking**: Understand what hardware powers your smart home
- **Unified View**: See both digital and physical aspects of your setup
- **Maintenance Planning**: Track component lifecycles and replacements

## Setup and Configuration

### Prerequisites

- **Home Assistant Instance**: Running and accessible
- **Long-Lived Access Token**: Generated in Home Assistant
- **Network Access**: IoT Inventory Oracle can reach your HA instance

### Getting Your Access Token

1. **Open Home Assistant** in your web browser
2. **Go to Profile** (click your name in bottom left)
3. **Scroll to Long-Lived Access Tokens**
4. **Click "Create Token"**
5. **Give it a name** (e.g., "IoT Inventory Oracle")
6. **Copy the token** (you won't see it again!)

### Configuration Methods

#### Method 1: Environment Variables

Add to your `.env` file:
```env
VITE_HOME_ASSISTANT_URL=http://your-home-assistant-ip:8123
VITE_HOME_ASSISTANT_TOKEN=your_long_lived_access_token_here
```

#### Method 2: Settings UI

1. **Open IoT Inventory Oracle**
2. **Go to Settings** → **Integrations**
3. **Find Home Assistant section**
4. **Enter your HA URL** (e.g., `http://192.168.1.100:8123`)
5. **Enter your Long-Lived Access Token**
6. **Click "Test Connection"**
7. **Save settings** if test succeeds

### Connection Testing

**Successful Connection Shows:**
- ✅ Connection Status: Connected
- 📊 Entities Discovered: [number]
- 🕐 Last Updated: [timestamp]
- 📡 API Version: [version]

**Common Connection Issues:**
- ❌ Network unreachable: Check IP address and port
- ❌ Authentication failed: Verify access token
- ❌ CORS error: May need HA configuration changes

## Entity Discovery

### Automatic Discovery

Once connected, the system automatically discovers:

**Device Types:**
- Lights and switches
- Sensors (temperature, humidity, motion, etc.)
- Climate control devices
- Media players and entertainment
- Security and surveillance devices
- Energy monitoring devices

**Entity Information:**
- Entity ID and friendly name
- Current state and attributes
- Device class and capabilities
- Last updated timestamp
- Associated device information

### Entity Categories

**Sensors:**
```
sensor.living_room_temperature
sensor.outdoor_humidity  
sensor.front_door_motion
sensor.energy_consumption
```

**Switches and Lights:**
```
light.kitchen_ceiling
switch.outdoor_lights
light.bedroom_lamp
switch.coffee_maker
```

**Climate:**
```
climate.living_room_thermostat
climate.bedroom_ac
fan.ceiling_fan
```

**Security:**
```
binary_sensor.front_door
camera.driveway
alarm_control_panel.home
lock.front_door
```

## Physical Component Linking

### Understanding the Connection

**Digital Entity** ↔ **Physical Component**
- `sensor.living_room_temperature` ↔ DHT22 Temperature Sensor
- `light.kitchen_ceiling` ↔ Smart LED Bulb
- `switch.outdoor_lights` ↔ Smart Switch Module

### Linking Process

#### Automatic Linking

The AI can automatically suggest links:
```
"My living room temperature sensor is a DHT22 connected to ESP32"
→ AI links sensor.living_room_temperature to DHT22 in inventory
```

#### Manual Linking

1. **Go to Home Assistant view**
2. **Find the entity** you want to link
3. **Click "Link Component"**
4. **Search your inventory** for the physical component
5. **Select the component** and confirm link
6. **Add notes** about the connection (optional)

#### Bulk Linking

For multiple similar devices:
1. **Select multiple entities** of the same type
2. **Choose "Bulk Link"**
3. **Select component type** from inventory
4. **Confirm links** for all selected entities

### Link Management

**Viewing Links:**
- Entity view shows linked physical components
- Component view shows linked HA entities
- Visual indicators for linked vs. unlinked items

**Editing Links:**
- Update component associations
- Add detailed connection notes
- Change link types and relationships
- Remove outdated links

**Link Types:**
- **Direct**: Entity directly represents the component
- **Contains**: Entity represents a device containing the component
- **Controls**: Entity controls the physical component
- **Monitors**: Entity monitors the component's status

## Unified Dashboard

### Combined View

**Entity + Component Information:**
```
Living Room Temperature Sensor
├── 🏠 HA Entity: sensor.living_room_temperature
│   ├── Current: 22.5°C
│   ├── Last Updated: 2 minutes ago
│   └── State: Available
├── 📦 Physical: DHT22 Temperature Sensor
│   ├── Location: Living Room Wall
│   ├── Purchase Date: 2023-06-15
│   ├── Warranty: Until 2025-06-15
│   └── Status: I Have
└── 🔗 Connection: ESP32 DevKit (GPIO 2)
```

### Status Monitoring

**Health Indicators:**
- 🟢 Online and functioning normally
- 🟡 Warning: unusual readings or behavior
- 🔴 Offline or error state
- ⚪ Unknown or unavailable

**Maintenance Alerts:**
- Battery low warnings
- Sensor calibration needed
- Firmware updates available
- Hardware replacement recommended

## Use Cases and Benefits

### Smart Home Documentation

**Hardware Inventory:**
- Complete list of all smart home devices
- Physical locations and installation details
- Purchase information and warranty tracking
- Replacement part identification

**System Architecture:**
- Understand device dependencies
- Map communication protocols (Zigbee, Z-Wave, WiFi)
- Identify single points of failure
- Plan system expansions

### Maintenance Planning

**Proactive Maintenance:**
- Track device lifespans and replacement cycles
- Monitor battery levels and replacement schedules
- Plan firmware updates and system upgrades
- Identify obsolete or end-of-life devices

**Troubleshooting Support:**
- Quick access to device specifications
- Purchase history for warranty claims
- Installation notes and configuration details
- Replacement part sourcing information

### Project Planning

**Expansion Projects:**
- Identify gaps in current coverage
- Plan new device installations
- Budget for system improvements
- Research compatible devices

**Integration Projects:**
- Connect new devices to existing systems
- Plan automation and scene creation
- Optimize device placement and coverage
- Coordinate with other smart home platforms

## Advanced Features

### Automation Integration

**Device Lifecycle Automation:**
```yaml
# Home Assistant automation example
automation:
  - alias: "Low Battery Alert"
    trigger:
      platform: numeric_state
      entity_id: sensor.door_sensor_battery
      below: 20
    action:
      service: notify.mobile_app
      data:
        message: "Door sensor battery low - check inventory for replacement"
```

**Maintenance Reminders:**
- Scheduled maintenance notifications
- Warranty expiration alerts
- Firmware update reminders
- Calibration schedule tracking

### Data Analytics

**Usage Patterns:**
- Device activity and usage statistics
- Energy consumption tracking
- Performance trend analysis
- Reliability and uptime monitoring

**Cost Analysis:**
- Total smart home investment
- Cost per device category
- Energy cost calculations
- ROI analysis for smart devices

### Integration with Other Systems

**Cross-Platform Support:**
- Link with other smart home platforms
- Export data for external analysis
- Import device information from other sources
- Synchronize with manufacturer databases

## Troubleshooting

### Connection Issues

**Cannot Connect to Home Assistant:**
1. Verify HA is running and accessible
2. Check IP address and port (usually 8123)
3. Ensure access token is valid and not expired
4. Test network connectivity from IoT Inventory Oracle server

**Authentication Errors:**
1. Regenerate Long-Lived Access Token in HA
2. Update token in IoT Inventory Oracle settings
3. Verify token permissions and scope
4. Check for special characters in token

**CORS Errors:**
May need to configure Home Assistant:
```yaml
# configuration.yaml
http:
  cors_allowed_origins:
    - http://localhost:3000
    - http://your-inventory-oracle-url
```

### Entity Discovery Issues

**Missing Entities:**
1. Check entity availability in Home Assistant
2. Verify entity is not disabled or hidden
3. Refresh entity discovery in settings
4. Check entity permissions and access levels

**Incorrect Entity Information:**
1. Update entity names and attributes in HA
2. Refresh entity data in IoT Inventory Oracle
3. Check for entity ID changes or renames
4. Verify entity state and availability

### Linking Problems

**Cannot Find Component to Link:**
1. Verify component exists in inventory
2. Check component name and search terms
3. Ensure component is not already linked
4. Try broader search terms or categories

**Link Not Working:**
1. Verify both entity and component exist
2. Check link type and relationship
3. Refresh entity and component data
4. Remove and recreate the link

## Best Practices

### Organization

1. **Consistent Naming**: Use similar naming conventions in HA and inventory
2. **Detailed Descriptions**: Add comprehensive notes about installations
3. **Regular Updates**: Keep entity and component information current
4. **Logical Grouping**: Organize by room, function, or system type
5. **Documentation**: Maintain installation and configuration notes

### Maintenance

1. **Regular Audits**: Verify links are still accurate and relevant
2. **Update Tracking**: Monitor firmware updates and device changes
3. **Battery Monitoring**: Track battery-powered device maintenance
4. **Replacement Planning**: Plan for device lifecycle management
5. **Backup Strategy**: Maintain backups of configuration and links

### Security

1. **Token Security**: Keep access tokens secure and rotate regularly
2. **Network Security**: Use secure connections when possible
3. **Access Control**: Limit token permissions to necessary scopes
4. **Monitoring**: Monitor for unauthorized access or changes
5. **Updates**: Keep both systems updated with security patches

---

**[← Back: User Guide](./user-guide.md)** | **[Documentation Home](./README.md)** | **[Next: Troubleshooting →](./troubleshooting.md)**