#!/usr/bin/env node

import DatabaseService from '../services/databaseService.js';
import ProjectService from '../services/projectService.js';
import { ItemStatus } from '../types.js';

class InventoryCLI {
  private dbService: DatabaseService;
  private projectService: ProjectService;

  constructor() {
    this.dbService = new DatabaseService();
    this.projectService = new ProjectService();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    const subcommand = args[1];

    try {
      switch (command) {
        case 'inventory':
          await this.handleInventoryCommand(subcommand, args.slice(2));
          break;
        case 'projects':
          await this.handleProjectsCommand(subcommand, args.slice(2));
          break;
        case 'stats':
          await this.showStats();
          break;
        case 'search':
          await this.search(args.slice(1).join(' '));
          break;
        default:
          this.showUsage();
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      this.dbService.close();
    }
  }

  private async handleInventoryCommand(subcommand: string, args: string[]) {
    switch (subcommand) {
      case 'list':
        await this.listInventory(args[1]);
        break;
      case 'add':
        await this.addInventoryItem(args.slice(1));
        break;
      case 'search':
        await this.searchInventory(args.slice(1).join(' '));
        break;
      case 'stats':
        await this.showInventoryStats();
        break;
      default:
        console.log('Inventory commands: list, add, search, stats');
    }
  }

  private async handleProjectsCommand(subcommand: string, args: string[]) {
    switch (subcommand) {
      case 'list':
        await this.listProjects(args[1]);
        break;
      case 'show':
        await this.showProject(args[1]);
        break;
      case 'search':
        await this.searchProjects(args.slice(1).join(' '));
        break;
      case 'stats':
        await this.showProjectStats();
        break;
      default:
        console.log('Project commands: list, show, search, stats');
    }
  }

  private async listInventory(filter?: string) {
    let items;
    
    if (filter) {
      // Check if it's a valid status
      const statusValues = Object.values(ItemStatus);
      if (statusValues.includes(filter as ItemStatus)) {
        items = this.dbService.getItemsByStatus(filter as ItemStatus);
      } else {
        items = this.dbService.getItemsByCategory(filter);
      }
    } else {
      items = this.dbService.getAllItems();
    }

    console.log(`\n📦 Inventory Items${filter ? ` (${filter})` : ''}: ${items.length}\n`);
    
    items.forEach(item => {
      console.log(`🔹 ${item.name}`);
      console.log(`   Quantity: ${item.quantity}`);
      console.log(`   Status: ${item.status}`);
      console.log(`   Location: ${item.location}`);
      if (item.category) console.log(`   Category: ${item.category}`);
      if (item.description) console.log(`   Description: ${item.description}`);
      console.log('');
    });
  }

  private async addInventoryItem(args: string[]) {
    if (args.length < 4) {
      console.log('Usage: cli inventory add <name> <quantity> <location> <status> [category] [description]');
      return;
    }

    const [name, quantityStr, location, status, category, description] = args;
    const quantity = parseInt(quantityStr);

    if (isNaN(quantity)) {
      console.log('❌ Quantity must be a number');
      return;
    }

    if (!Object.values(ItemStatus).includes(status as ItemStatus)) {
      console.log('❌ Invalid status. Valid statuses:', Object.values(ItemStatus).join(', '));
      return;
    }

    const newItem = this.dbService.addItem({
      name,
      quantity,
      location,
      status: status as ItemStatus,
      category: category || undefined,
      description: description || undefined,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Added item: ${newItem.name} (ID: ${newItem.id})`);
  }

  private async searchInventory(query: string) {
    if (!query.trim()) {
      console.log('❌ Please provide a search query');
      return;
    }

    const items = this.dbService.searchItems(query);
    console.log(`\n🔍 Search results for "${query}": ${items.length} items\n`);
    
    items.forEach(item => {
      console.log(`🔹 ${item.name} (${item.quantity}x)`);
      console.log(`   ${item.status} | ${item.location}`);
      if (item.description) console.log(`   ${item.description}`);
      console.log('');
    });
  }

  private async listProjects(status?: string) {
    let projects;
    
    if (status && (status === 'In Progress' || status === 'Completed')) {
      projects = await this.projectService.getProjectsByStatus(status as any);
    } else {
      projects = await this.projectService.getAllProjects();
    }

    console.log(`\n📝 Projects${status ? ` (${status})` : ''}: ${projects.length}\n`);
    
    projects.forEach(project => {
      console.log(`🔹 ${project.name}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Components: ${project.components.length}`);
      console.log(`   Created: ${new Date(project.createdAt).toLocaleDateString()}`);
      if (project.githubUrl) console.log(`   GitHub: ${project.githubUrl}`);
      console.log('');
    });
  }

  private async showProject(projectId: string) {
    if (!projectId) {
      console.log('❌ Please provide a project ID');
      return;
    }

    const project = await this.projectService.getProjectById(projectId);
    if (!project) {
      console.log(`❌ Project with ID "${projectId}" not found`);
      return;
    }

    console.log(`\n📝 ${project.name}\n`);
    console.log(`Description: ${project.description}`);
    console.log(`Status: ${project.status}`);
    console.log(`Created: ${new Date(project.createdAt).toLocaleDateString()}`);
    if (project.githubUrl) console.log(`GitHub: ${project.githubUrl}`);
    
    console.log(`\nComponents (${project.components.length}):`);
    project.components.forEach(comp => {
      console.log(`  • ${comp.name} (${comp.quantity}x)${comp.source ? ` [${comp.source}]` : ''}`);
    });

    if (project.notes) {
      console.log(`\nNotes:\n${project.notes}`);
    }
  }

  private async searchProjects(query: string) {
    if (!query.trim()) {
      console.log('❌ Please provide a search query');
      return;
    }

    const projects = await this.projectService.searchProjects(query);
    console.log(`\n🔍 Project search results for "${query}": ${projects.length} projects\n`);
    
    projects.forEach(project => {
      console.log(`🔹 ${project.name}`);
      console.log(`   ${project.status} | ${project.components.length} components`);
      console.log(`   ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}`);
      console.log('');
    });
  }

  private async showStats() {
    console.log('\n📊 IoT Inventory Oracle - Statistics\n');
    
    // Inventory stats
    const inventoryStats = this.dbService.getInventoryStats();
    console.log('📦 Inventory:');
    console.log(`   Total Items: ${inventoryStats.totalItems}`);
    console.log(`   Total Quantity: ${inventoryStats.totalQuantity}`);
    
    console.log('\n   Status Breakdown:');
    inventoryStats.statusBreakdown.forEach(status => {
      console.log(`     ${status.status}: ${status.count}`);
    });

    if (inventoryStats.categoryBreakdown.length > 0) {
      console.log('\n   Top Categories:');
      inventoryStats.categoryBreakdown.slice(0, 5).forEach(cat => {
        console.log(`     ${cat.category}: ${cat.count}`);
      });
    }

    // Project stats
    const projectStats = await this.projectService.getProjectStats();
    console.log('\n📝 Projects:');
    console.log(`   Total Projects: ${projectStats.totalProjects}`);
    
    if (Object.keys(projectStats.statusBreakdown).length > 0) {
      console.log('\n   Status Breakdown:');
      Object.entries(projectStats.statusBreakdown).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
    }

    if (projectStats.mostUsedComponents.length > 0) {
      console.log('\n   Most Used Components:');
      projectStats.mostUsedComponents.slice(0, 5).forEach(comp => {
        console.log(`     ${comp.name}: ${comp.count}x`);
      });
    }
  }

  private async showInventoryStats() {
    const stats = this.dbService.getInventoryStats();
    console.log('\n📊 Inventory Statistics\n');
    console.log(`Total Items: ${stats.totalItems}`);
    console.log(`Total Quantity: ${stats.totalQuantity}`);
    
    console.log('\nStatus Breakdown:');
    stats.statusBreakdown.forEach(status => {
      console.log(`  ${status.status}: ${status.count}`);
    });

    if (stats.categoryBreakdown.length > 0) {
      console.log('\nCategory Breakdown:');
      stats.categoryBreakdown.forEach(cat => {
        console.log(`  ${cat.category}: ${cat.count}`);
      });
    }
  }

  private async showProjectStats() {
    const stats = await this.projectService.getProjectStats();
    console.log('\n📊 Project Statistics\n');
    console.log(`Total Projects: ${stats.totalProjects}`);
    
    if (Object.keys(stats.statusBreakdown).length > 0) {
      console.log('\nStatus Breakdown:');
      Object.entries(stats.statusBreakdown).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }

    if (stats.mostUsedComponents.length > 0) {
      console.log('\nMost Used Components:');
      stats.mostUsedComponents.forEach(comp => {
        console.log(`  ${comp.name}: ${comp.count}x`);
      });
    }
  }

  private async search(query: string) {
    if (!query.trim()) {
      console.log('❌ Please provide a search query');
      return;
    }

    console.log(`\n🔍 Global search for "${query}"\n`);
    
    // Search inventory
    const items = this.dbService.searchItems(query);
    if (items.length > 0) {
      console.log(`📦 Inventory (${items.length} items):`);
      items.slice(0, 5).forEach(item => {
        console.log(`  • ${item.name} (${item.quantity}x) - ${item.location}`);
      });
      if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
      console.log('');
    }

    // Search projects
    const projects = await this.projectService.searchProjects(query);
    if (projects.length > 0) {
      console.log(`📝 Projects (${projects.length} projects):`);
      projects.slice(0, 5).forEach(project => {
        console.log(`  • ${project.name} - ${project.status}`);
      });
      if (projects.length > 5) console.log(`  ... and ${projects.length - 5} more`);
    }

    if (items.length === 0 && projects.length === 0) {
      console.log('No results found.');
    }
  }

  private showUsage() {
    console.log('IoT Inventory Oracle CLI\n');
    console.log('Usage: npm run cli <command> [options]\n');
    console.log('Commands:');
    console.log('  inventory list [filter]           List inventory items');
    console.log('  inventory add <name> <qty> <loc> <status> [cat] [desc]');
    console.log('  inventory search <query>          Search inventory');
    console.log('  inventory stats                   Show inventory statistics');
    console.log('');
    console.log('  projects list [status]            List projects');
    console.log('  projects show <id>                Show project details');
    console.log('  projects search <query>           Search projects');
    console.log('  projects stats                    Show project statistics');
    console.log('');
    console.log('  search <query>                    Global search');
    console.log('  stats                             Show all statistics');
    console.log('');
    console.log('Examples:');
    console.log('  npm run cli inventory list "I Have"');
    console.log('  npm run cli inventory add "ESP32" 5 "Box A" "I Have" "Core"');
    console.log('  npm run cli projects list "In Progress"');
    console.log('  npm run cli search "ESP32"');
  }
}

// Run the CLI
const cli = new InventoryCLI();
cli.run().catch(console.error);