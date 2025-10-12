# CLI Tools Reference

The IoT Inventory Oracle includes powerful command-line tools for advanced users, bulk operations, and automation. These tools provide direct access to the SQLite database and markdown files.

## Getting Started

All CLI commands use the format:
```bash
npm run cli <command> [arguments]
```

## Inventory Management

### List Operations

```bash
# List all inventory items
npm run cli inventory list

# List items by status
npm run cli inventory list "I Have"
npm run cli inventory list "I Want"
npm run cli inventory list "I Need"

# List items by category
npm run cli inventory list "Sensors"
npm run cli inventory list "Development Board"
```

### Search Operations

```bash
# Search inventory by name or description
npm run cli inventory search "ESP32"
npm run cli inventory search "temperature"
npm run cli inventory search "Arduino"
```

### Add Items

```bash
# Add new inventory item
npm run cli inventory add <name> <quantity> <location> <status> [category] [description]

# Examples:
npm run cli inventory add "ESP32-DevKit" 3 "Electronics-Box" "I Have" "Microcontroller"
npm run cli inventory add "10kΩ Resistor" 50 "Component-Drawer" "I Have" "Resistor" "Carbon film resistors"
npm run cli inventory add "Raspberry Pi 5" 1 "Wishlist" "I Want" "Single-Board Computer"
```

### Statistics

```bash
# Show comprehensive inventory statistics
npm run cli inventory stats
```

**Example Output:**
```
📊 Inventory Statistics
Total Items: 127
Total Quantity: 1,247
Total Value: $2,847.50

Status Breakdown:
├── I Have: 89 items (1,156 units)
├── I Need: 23 items (67 units)
├── I Want: 15 items (24 units)

Top Categories:
├── Resistor: 45 items
├── Sensor: 23 items
├── Development Board: 12 items
```

## Project Management

### List Projects

```bash
# List all projects
npm run cli projects list

# List projects by status
npm run cli projects list "Planning"
npm run cli projects list "In Progress"
npm run cli projects list "Completed"
```

### Project Details

```bash
# Show detailed project information
npm run cli projects show <project-id>

# Example:
npm run cli projects show "2025-10-11T23:45:25.501Z"
```

### Search Projects

```bash
# Search projects by name or description
npm run cli projects search "temperature"
npm run cli projects search "LED"
npm run cli projects search "Arduino"
```

### Project Statistics

```bash
# Show project statistics
npm run cli projects stats
```

**Example Output:**
```
🎯 Project Statistics
Total Projects: 15
Active Projects: 8

Status Breakdown:
├── Planning: 5 projects
├── In Progress: 3 projects
├── Completed: 7 projects

Average Components per Project: 8.3
Most Used Components:
├── ESP32: Used in 6 projects
├── LED: Used in 5 projects
├── Resistor: Used in 4 projects
```

## Global Operations

### Universal Search

```bash
# Search across both inventory and projects
npm run cli search <query>

# Examples:
npm run cli search "ESP32"
npm run cli search "temperature sensor"
npm run cli search "Arduino"
```

### Comprehensive Statistics

```bash
# Show overview of everything
npm run cli stats
```

**Example Output:**
```
🚀 IoT Inventory Oracle - System Overview

📦 Inventory: 127 items (1,247 units) - $2,847.50 value
🎯 Projects: 15 projects (8 active)
💾 Database: 2.3 MB, 1,247 records
📁 Files: 15 project files, 847 KB

Recent Activity:
├── Last inventory update: 2 hours ago
├── Last project update: 1 day ago
├── Most active category: Sensors (5 updates this week)
```

## Advanced Usage

### Bulk Operations

```bash
# Import from CSV (requires custom script)
npm run cli inventory import inventory.csv

# Export to CSV
npm run cli inventory export inventory.csv

# Backup database
npm run cli backup backup-2024-01-15.db
```

### Data Management

```bash
# Validate database integrity
npm run cli validate

# Clean up orphaned records
npm run cli cleanup

# Optimize database
npm run cli optimize
```

### Automation Examples

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
npm run cli backup "backups/inventory-$DATE.db"
npm run cli stats > "reports/daily-report-$DATE.txt"
```

## CLI Tips and Tricks

### Status Values
Use exact status names with quotes:
- `"I Have"`
- `"I Want"`
- `"I Need"`
- `"I Salvaged"`
- `"I Returned"`
- `"Discarded"`
- `"Given Away"`

### Quoting Arguments
Use quotes around multi-word arguments:
```bash
npm run cli inventory add "Arduino Nano" 2 "Dev Board Box" "I Have"
```

### Project IDs
Get project IDs from the list command:
```bash
npm run cli projects list
# Copy the ID from the output
npm run cli projects show "2025-10-11T23:45:25.501Z"
```

### Piping and Filtering
```bash
# Count items by status
npm run cli inventory list "I Have" | wc -l

# Find specific components
npm run cli inventory list | grep "ESP32"

# Export to file
npm run cli inventory stats > inventory-report.txt
```

## Scripting and Automation

### Bash Script Example
```bash
#!/bin/bash
# inventory-report.sh

echo "=== Daily Inventory Report ===" > report.txt
echo "Generated: $(date)" >> report.txt
echo "" >> report.txt

npm run cli inventory stats >> report.txt
echo "" >> report.txt

echo "=== Low Stock Items ===" >> report.txt
npm run cli inventory list "I Need" >> report.txt

echo "Report saved to report.txt"
```

### PowerShell Script Example
```powershell
# inventory-report.ps1

$date = Get-Date -Format "yyyy-MM-dd"
$reportFile = "inventory-report-$date.txt"

"=== Daily Inventory Report ===" | Out-File $reportFile
"Generated: $(Get-Date)" | Out-File $reportFile -Append
"" | Out-File $reportFile -Append

npm run cli inventory stats | Out-File $reportFile -Append
"" | Out-File $reportFile -Append

"=== Projects In Progress ===" | Out-File $reportFile -Append
npm run cli projects list "In Progress" | Out-File $reportFile -Append

Write-Host "Report saved to $reportFile"
```

### Cron Job Example
```bash
# Add to crontab with: crontab -e
# Daily backup at 2 AM
0 2 * * * cd /path/to/iot-inventory-oracle && npm run cli backup "backups/daily-$(date +\%Y-\%m-\%d).db"

# Weekly report on Sundays at 9 AM
0 9 * * 0 cd /path/to/iot-inventory-oracle && npm run cli stats > "reports/weekly-$(date +\%Y-\%m-\%d).txt"
```

## Error Handling

### Common Issues

**Database Locked**
```bash
# Stop the server first
pkill -f "npm run server"
# Then run CLI commands
npm run cli stats
```

**Permission Errors**
```bash
# Check file permissions
ls -la inventory.db
# Fix permissions if needed
chmod 664 inventory.db
```

**Invalid Arguments**
```bash
# Always use quotes for multi-word arguments
npm run cli inventory add "My Component" 1 "Location" "I Have"
```

## Integration with Other Tools

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run cli validate
if [ $? -ne 0 ]; then
    echo "Database validation failed!"
    exit 1
fi
```

### Monitoring Scripts
```bash
# Check for low stock items
LOW_STOCK=$(npm run cli inventory list "I Need" | wc -l)
if [ $LOW_STOCK -gt 10 ]; then
    echo "Warning: $LOW_STOCK items needed!"
fi
```

---

**[← Back: AI Assistant](./ai-assistant.md)** | **[Documentation Home](./README.md)** | **[Next: Troubleshooting →](./troubleshooting.md)**