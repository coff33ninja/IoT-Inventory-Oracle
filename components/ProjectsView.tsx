import React, { useState } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { useToast } from "../contexts/ToastContext";
import { Project } from "../types";
import { ProjectCard } from "./ProjectCard";
import LinkGithubModal from "./LinkGithubModal";
import { analyzeGithubRepo } from "../services/geminiService";
import AddProjectModal from "./AddProjectModal";
import ProjectDetailView from "./ProjectDetailView";
import { PlusIcon } from "./icons/PlusIcon";

interface ProjectsViewProps {
  onAiKickstart: (project: Project) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onAiKickstart }) => {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    updateProjectComponents,
    allocateInventoryItems,
    deallocateInventoryItems,
  } = useInventory();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"In Progress" | "Completed">(
    "In Progress"
  );
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [projectToLink, setProjectToLink] = useState<Project | null>(null);
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleOpenLinkModal = (project: Project) => {
    setProjectToLink(project);
    setIsLinkModalOpen(true);
  };

  const handleCloseLinkModal = () => {
    setProjectToLink(null);
    setIsLinkModalOpen(false);
  };

  const handleLinkRepo = (url: string) => {
    if (projectToLink) {
      const updatedProject = { ...projectToLink, githubUrl: url };
      updateProject(updatedProject);
      addToast("Repository linked successfully!", "success");
      handleSyncRepo(updatedProject); // Auto-sync after linking
    }
  };

  const handleSyncRepo = async (project: Project) => {
    if (!project.githubUrl) return;
    setSyncingProjectId(project.id);
    addToast("Analyzing repository...", "info");
    try {
      const components = await analyzeGithubRepo(project.githubUrl);
      updateProjectComponents(project.id, components);
      addToast("GitHub components synced!", "success");
    } catch (error) {
      console.error(error);
      addToast(
        error instanceof Error ? error.message : "Failed to sync repository.",
        "error"
      );
    } finally {
      setSyncingProjectId(null);
    }
  };

  const handleAddProject = async (
    newProjectData: Omit<Project, "id" | "createdAt">
  ) => {
    try {
      // Create the project first
      const createdProject = await addProject(newProjectData);
      
      // Handle inventory allocations for components sourced from inventory
      const inventoryAllocations = newProjectData.components
        .filter(c => c.source === 'inventory' && c.inventoryItemId)
        .map(c => ({
          inventoryItemId: c.inventoryItemId!,
          quantity: c.quantity,
          projectId: createdProject.id,
          projectName: createdProject.name
        }));

      if (inventoryAllocations.length > 0) {
        await allocateInventoryItems(inventoryAllocations);
      }

      addToast(`Project "${newProjectData.name}" created!`, "success");
    } catch (error) {
      console.error('Failed to create project:', error);
      addToast('Failed to create project', 'error');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      // Deallocate inventory items first
      await deallocateInventoryItems(project.id);
      
      // Then delete the project
      await deleteProject(project.id);
      addToast(`Project "${project.name}" deleted successfully!`, "success");
    } catch (error) {
      addToast(`Failed to delete project "${project.name}"`, "error");
    }
  };

  const filteredProjects = projects
    .filter((p) => p.status === activeTab && !p.isSubProject) // Only show main projects
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Get sub-projects for each main project
  const getSubProjects = (parentId: string) => {
    return projects.filter(p => p.parentProjectId === parentId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary">My Projects</h1>
        <button
          onClick={() => setIsAddProjectModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
          <PlusIcon />
          <span>Create New Project</span>
        </button>
      </div>

      <div className="border-b border-border-color">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {(["In Progress", "Completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`${
                activeTab === status
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500"
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
              {status}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onAiKickstart={onAiKickstart}
                onUpdate={updateProject}
                onDelete={handleDeleteProject}
                onLinkRepo={handleOpenLinkModal}
                onSyncRepo={handleSyncRepo}
                onClick={setSelectedProject}
                isSyncing={syncingProjectId === project.id}
                subProjects={getSubProjects(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-secondary rounded-lg">
            <h3 className="text-xl font-semibold text-text-primary">
              No {activeTab.toLowerCase()} projects yet.
            </h3>
            <p className="text-text-secondary mt-2">
              Go to the Inventory tab, select some items, and click 'Checkout'
              to start a new project!
            </p>
          </div>
        )}
      </div>

      <LinkGithubModal
        isOpen={isLinkModalOpen}
        onClose={handleCloseLinkModal}
        onLink={handleLinkRepo}
        project={projectToLink}
      />

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onSave={handleAddProject}
      />

      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          onUpdate={updateProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default ProjectsView;
