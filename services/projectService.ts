import fs from 'fs/promises';
import { join, basename } from 'path';
import matter from 'gray-matter';
import { Project } from '../types.js';

class ProjectService {
  private projectsDir: string;

  constructor() {
    this.projectsDir = join(process.cwd(), 'projects');
    this.ensureProjectsDirectory();
  }

  private async ensureProjectsDirectory(): Promise<void> {
    try {
      await fs.access(this.projectsDir);
    } catch {
      await fs.mkdir(this.projectsDir, { recursive: true });
    }
  }

  // Convert project to markdown with frontmatter
  private projectToMarkdown(project: Project): string {
    const frontmatter = {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      status: project.status,
      githubUrl: project.githubUrl || null,
      components: project.components
    };

    const content = `# ${project.name}

${project.description}

## Status
${project.status}

## Components Required

${project.components.map(comp => 
  `- **${comp.name}** (Qty: ${comp.quantity})${comp.source ? ` - Source: ${comp.source}` : ''}`
).join('\n')}

${project.githubUrl ? `## GitHub Repository\n[${project.githubUrl}](${project.githubUrl})` : ''}

## Notes

${project.notes || 'No additional notes.'}

---

*Project created: ${new Date(project.createdAt).toLocaleDateString()}*
*Last updated: ${new Date().toLocaleDateString()}*
`;

    return matter.stringify(content, frontmatter);
  }

  // Convert markdown back to project object
  private markdownToProject(markdownContent: string, filename: string): Project {
    const { data, content } = matter(markdownContent);
    
    // Extract notes from content (everything after "## Notes")
    const notesMatch = content.match(/## Notes\s*\n([\s\S]*?)(?:\n---|\n*$)/);
    const notes = notesMatch ? notesMatch[1].trim() : '';

    return {
      id: data.id || basename(filename, '.md'),
      name: data.name || 'Untitled Project',
      description: data.description || '',
      createdAt: data.createdAt || new Date().toISOString(),
      status: data.status || 'In Progress',
      githubUrl: data.githubUrl || undefined,
      components: data.components || [],
      notes: notes || undefined
    };
  }

  // Get filename for project
  private getProjectFilename(project: Project): string {
    const safeName = project.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    return `${safeName}-${project.id.substring(0, 8)}.md`;
  }

  // CRUD operations
  async getAllProjects(): Promise<Project[]> {
    await this.ensureProjectsDirectory();
    
    try {
      const files = await fs.readdir(this.projectsDir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      const projects: Project[] = [];
      
      for (const file of markdownFiles) {
        try {
          const filePath = join(this.projectsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const project = this.markdownToProject(content, file);
          projects.push(project);
        } catch (error) {
          console.error(`Error reading project file ${file}:`, error);
        }
      }
      
      // Sort by creation date, newest first
      return projects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error reading projects directory:', error);
      return [];
    }
  }

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  async addProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    await this.ensureProjectsDirectory();
    
    const project: Project = {
      ...projectData,
      id: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      components: projectData.components.map(c => ({ 
        ...c, 
        source: c.source || 'manual' 
      }))
    };

    const filename = this.getProjectFilename(project);
    const filePath = join(this.projectsDir, filename);
    const markdownContent = this.projectToMarkdown(project);

    await fs.writeFile(filePath, markdownContent, 'utf-8');
    
    return project;
  }

  async updateProject(updatedProject: Project): Promise<void> {
    await this.ensureProjectsDirectory();
    
    // Find existing file
    const projects = await this.getAllProjects();
    const existingProject = projects.find(p => p.id === updatedProject.id);
    
    if (!existingProject) {
      throw new Error(`Project with id ${updatedProject.id} not found`);
    }

    // Get current filename
    const files = await fs.readdir(this.projectsDir);
    const currentFile = files.find(file => {
      const content = fs.readFile(join(this.projectsDir, file), 'utf-8');
      return content.then(c => {
        const { data } = matter(c);
        return data.id === updatedProject.id;
      }).catch(() => false);
    });

    if (currentFile) {
      const currentPath = join(this.projectsDir, currentFile);
      const newFilename = this.getProjectFilename(updatedProject);
      const newPath = join(this.projectsDir, newFilename);
      
      const markdownContent = this.projectToMarkdown(updatedProject);
      await fs.writeFile(newPath, markdownContent, 'utf-8');
      
      // Remove old file if filename changed
      if (currentFile !== newFilename) {
        await fs.unlink(currentPath);
      }
    }
  }

  async deleteProject(id: string): Promise<void> {
    await this.ensureProjectsDirectory();
    
    const files = await fs.readdir(this.projectsDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        try {
          const filePath = join(this.projectsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const { data } = matter(content);
          
          if (data.id === id) {
            await fs.unlink(filePath);
            return;
          }
        } catch (error) {
          console.error(`Error checking file ${file}:`, error);
        }
      }
    }
    
    throw new Error(`Project with id ${id} not found`);
  }

  // Search and filter operations
  async searchProjects(query: string): Promise<Project[]> {
    const projects = await this.getAllProjects();
    const lowercaseQuery = query.toLowerCase();
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery) ||
      (project.notes && project.notes.toLowerCase().includes(lowercaseQuery)) ||
      project.components.some(comp => 
        comp.name.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    const projects = await this.getAllProjects();
    return projects.filter(project => project.status === status);
  }

  // GitHub integration
  async updateProjectComponents(
    projectId: string, 
    githubComponents: { name: string; quantity: number }[]
  ): Promise<void> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    // Filter out old github components and add new ones
    const manualComponents = project.components.filter(c => c.source !== 'github');
    const newGithubComponents = githubComponents.map(gc => ({
      id: `${projectId}-gh-${gc.name.replace(/\s+/g, '-')}`,
      name: gc.name,
      quantity: gc.quantity,
      source: 'github' as const
    }));

    const updatedProject: Project = {
      ...project,
      components: [...manualComponents, ...newGithubComponents]
    };

    await this.updateProject(updatedProject);
  }

  // Export/Import utilities
  async exportProjectsToJson(): Promise<Project[]> {
    return await this.getAllProjects();
  }

  async importProjectsFromJson(projects: Project[]): Promise<void> {
    for (const project of projects) {
      await this.addProject(project);
    }
  }

  // Analytics
  async getProjectStats() {
    const projects = await this.getAllProjects();
    
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const componentCounts = projects.reduce((acc, project) => {
      project.components.forEach(comp => {
        acc[comp.name] = (acc[comp.name] || 0) + comp.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProjects: projects.length,
      statusBreakdown: statusCounts,
      mostUsedComponents: Object.entries(componentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))
    };
  }
}

export default ProjectService;