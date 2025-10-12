import React, { useState, useEffect } from "react";
import { Project } from "../types";
import { useInventory } from "../contexts/InventoryContext";
import { useToast } from "../contexts/ToastContext";
import { SparklesIcon } from "./icons/SparklesIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import { EditIcon } from "./icons/EditIcon";
import { PlusIcon } from "./icons/PlusIcon";
// CheckIcon component inline since it doesn't exist yet
const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    />
  </svg>
);
import {
  generateProjectInstructions,
  enhanceProjectDescription,
  suggestProjectImprovements,
  analyzeProjectComplexity,
} from "../services/geminiService";

interface ProjectDetailViewProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onClose: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onUpdate,
  onClose,
}) => {
  const { addProject, projects } = useInventory();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "overview" | "instructions" | "components" | "insights" | "subprojects"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>(project);
  const [isGeneratingInstructions, setIsGeneratingInstructions] =
    useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [isGettingInsights, setIsGettingInsights] = useState(false);
  const [isAnalyzingComplexity, setIsAnalyzingComplexity] = useState(false);
  const [showSubProjectForm, setShowSubProjectForm] = useState(false);
  const [newSubProjectName, setNewSubProjectName] = useState("");
  const [newSubProjectDescription, setNewSubProjectDescription] = useState("");

  useEffect(() => {
    setEditedProject(project);
  }, [project]);

  const handleSave = async () => {
    try {
      await onUpdate(editedProject);
      setIsEditing(false);
      addToast("Project updated successfully!", "success");
    } catch (error) {
      console.error('Failed to save project:', error);
      addToast("Failed to save project changes", "error");
    }
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleGenerateInstructions = async () => {
    setIsGeneratingInstructions(true);
    try {
      const instructions = await generateProjectInstructions(
        project.name,
        project.longDescription || project.description,
        project.components
      );

      const updatedProject = {
        ...editedProject,
        instructions: instructions.map((inst, index) => ({
          id: `step-${index + 1}`,
          step: index + 1,
          title: inst.title,
          description: inst.description,
          code: inst.code,
          tips: inst.tips || [],
        })),
      };

      setEditedProject(updatedProject);
      addToast("Instructions generated successfully!", "success");
    } catch (error) {
      console.error("Failed to generate instructions:", error);
      addToast("Failed to generate instructions", "error");
    } finally {
      setIsGeneratingInstructions(false);
    }
  };

  const handleEnhanceDescription = async () => {
    setIsEnhancingDescription(true);
    try {
      const enhanced = await enhanceProjectDescription(
        project.name,
        project.longDescription || project.description
      );

      setEditedProject({
        ...editedProject,
        longDescription: enhanced,
      });

      addToast("Description enhanced successfully!", "success");
    } catch (error) {
      console.error("Failed to enhance description:", error);
      addToast("Failed to enhance description", "error");
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  const handleGetInsights = async () => {
    setIsGettingInsights(true);
    try {
      const improvements = await suggestProjectImprovements(
        project.name,
        project.longDescription || project.description,
        project.components
      );

      const insights = {
        suggestions: improvements.suggestions,
        improvements: improvements.additionalComponents.map(
          (c) => `Add ${c.name}: ${c.reason}`
        ),
        troubleshooting: improvements.optimizations,
        relatedProjects: [], // Could be enhanced later
      };

      setEditedProject({
        ...editedProject,
        aiInsights: insights,
      });

      addToast("AI insights generated successfully!", "success");
    } catch (error) {
      console.error("Failed to get insights:", error);
      addToast("Failed to get AI insights", "error");
    } finally {
      setIsGettingInsights(false);
    }
  };

  const updateProgress = (newProgress: number) => {
    const updatedProject = { ...editedProject, progress: newProgress };
    setEditedProject(updatedProject);
    onUpdate(updatedProject);
  };

  const toggleInstructionComplete = (stepId: string) => {
    // This could be enhanced to track completed steps
    addToast("Step marked as complete!", "success");
  };

  const addInstruction = () => {
    const newStep = {
      id: `step-${(editedProject.instructions?.length || 0) + 1}`,
      step: (editedProject.instructions?.length || 0) + 1,
      title: "New Step",
      description: "Add your step description here...",
      tips: [],
    };

    setEditedProject({
      ...editedProject,
      instructions: [...(editedProject.instructions || []), newStep],
    });
  };

  const handleAnalyzeForSubProjects = async () => {
    setIsAnalyzingComplexity(true);
    try {
      const analysis = await analyzeProjectComplexity(
        project.name,
        project.longDescription || project.description
      );

      if (analysis.isComplex && analysis.suggestedSubProjects.length > 0) {
        // Auto-create suggested sub-projects
        const subProjectIds = [];

        for (const subProjectSuggestion of analysis.suggestedSubProjects) {
          const subProjectComponents = subProjectSuggestion.components.map(
            (compName, index) => ({
              id: `sub-${Date.now()}-${index}`,
              name: compName,
              quantity: 1,
              source: "ai-suggested" as const,
            })
          );

          const subProject: Omit<Project, "id" | "createdAt"> = {
            name: `${project.name} - ${subProjectSuggestion.name}`,
            description: subProjectSuggestion.description,
            longDescription: `Sub-project of "${project.name}". ${subProjectSuggestion.description}`,
            category: project.category,
            difficulty: project.difficulty,
            estimatedTime: subProjectSuggestion.estimatedTime,
            components: subProjectComponents,
            instructions: undefined,
            updatedAt: new Date().toISOString(),
            status: "Planning",
            progress: 0,
            notes: `Sub-project created by AI analysis. Phase ${subProjectSuggestion.phase} of main project.`,
            tags: [
              "AI-Generated",
              "Sub-Project",
              `Phase-${subProjectSuggestion.phase}`,
            ],
            parentProjectId: project.id,
            isSubProject: true,
            phase: subProjectSuggestion.phase,
            dependencies: subProjectSuggestion.dependencies,
          };

          const createdSubProject = await addProject(subProject);
          subProjectIds.push(createdSubProject.id);
        }

        // Update main project with sub-project references
        const updatedProject = {
          ...editedProject,
          subProjects: [...(editedProject.subProjects || []), ...subProjectIds],
          notes: `${
            editedProject.notes || ""
          }\n\n🔗 AI-generated sub-projects:\n${analysis.suggestedSubProjects
            .map((sp, i) => `Phase ${sp.phase}: ${sp.name}`)
            .join("\n")}\n\nReasoning: ${analysis.reasoning}`,
        };

        setEditedProject(updatedProject);
        onUpdate(updatedProject);

        addToast(
          `Created ${subProjectIds.length} sub-projects based on AI analysis!`,
          "success"
        );
      } else {
        addToast(
          "Project doesn't require sub-projects or is already well-structured",
          "info"
        );
      }
    } catch (error) {
      console.error("Failed to analyze project complexity:", error);
      addToast("Failed to analyze project complexity", "error");
    } finally {
      setIsAnalyzingComplexity(false);
    }
  };

  const handleCreateManualSubProject = async () => {
    if (!newSubProjectName.trim()) {
      addToast("Sub-project name is required", "error");
      return;
    }

    try {
      const subProject: Omit<Project, "id" | "createdAt"> = {
        name: `${project.name} - ${newSubProjectName}`,
        description:
          newSubProjectDescription || `Sub-project of ${project.name}`,
        longDescription: newSubProjectDescription,
        category: project.category,
        difficulty: project.difficulty,
        estimatedTime: undefined,
        components: [],
        instructions: undefined,
        updatedAt: new Date().toISOString(),
        status: "Planning",
        progress: 0,
        notes: `Manually created sub-project of "${project.name}".`,
        tags: ["Manual", "Sub-Project"],
        parentProjectId: project.id,
        isSubProject: true,
        phase: (editedProject.subProjects?.length || 0) + 1,
        dependencies: [],
      };

      const createdSubProject = await addProject(subProject);

      // Update main project with new sub-project reference
      const updatedProject = {
        ...editedProject,
        subProjects: [
          ...(editedProject.subProjects || []),
          createdSubProject.id,
        ],
      };

      setEditedProject(updatedProject);
      onUpdate(updatedProject);

      // Reset form
      setNewSubProjectName("");
      setNewSubProjectDescription("");
      setShowSubProjectForm(false);

      addToast(`Sub-project "${newSubProjectName}" created!`, "success");
    } catch (error) {
      console.error("Failed to create sub-project:", error);
      addToast("Failed to create sub-project", "error");
    }
  };

  // Get sub-projects for this project
  const subProjects = projects.filter((p) => p.parentProjectId === project.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-6xl h-5/6 border border-border-color flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-color flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-text-primary">
              {project.name}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.status === "Completed"
                  ? "bg-green-500/20 text-green-400"
                  : project.status === "In Progress"
                  ? "bg-blue-500/20 text-blue-400"
                  : project.status === "Testing"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : project.status === "On Hold"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}>
              {project.status}
            </span>
            {project.difficulty && (
              <span className="px-2 py-1 rounded text-xs bg-primary text-text-secondary">
                {project.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Edit project">
              <EditIcon />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Close">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {project.progress !== undefined && (
          <div className="px-6 py-2 border-b border-border-color">
            <div className="flex items-center justify-between text-sm text-text-secondary mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-primary rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
                role="progressbar"
                aria-valuenow={project.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Project progress: ${project.progress}%`}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 border-b border-border-color">
          <nav className="flex space-x-8">
            {[
              "overview",
              "instructions",
              "components",
              "insights",
              "subprojects",
            ].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-color"
                }`}>
                {tab === "subprojects"
                  ? `Sub-Projects (${subProjects.length})`
                  : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Description
                  </h3>
                  {!isEnhancingDescription && (
                    <button
                      type="button"
                      onClick={handleEnhanceDescription}
                      className="text-xs text-accent hover:text-blue-400 flex items-center">
                      <SparklesIcon className="w-4 h-4 mr-1" />
                      Enhance with AI
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={
                      editedProject.longDescription || editedProject.description
                    }
                    onChange={(e) =>
                      setEditedProject({
                        ...editedProject,
                        longDescription: e.target.value,
                      })
                    }
                    rows={6}
                    className="w-full bg-primary border border-border-color rounded-md p-3 text-text-primary"
                    placeholder="Detailed project description..."
                  />
                ) : (
                  <div className="bg-primary p-4 rounded-lg border border-border-color">
                    {isEnhancingDescription ? (
                      <div className="flex items-center text-text-secondary">
                        <SpinnerIcon className="mr-2" />
                        Enhancing description...
                      </div>
                    ) : (
                      <p className="text-text-primary whitespace-pre-wrap">
                        {editedProject.longDescription ||
                          editedProject.description ||
                          "No detailed description available."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-2">
                    Project Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Category:</span>
                      <span className="text-text-primary">
                        {project.category || "Uncategorized"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Difficulty:</span>
                      <span className="text-text-primary">
                        {project.difficulty || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        Estimated Time:
                      </span>
                      <span className="text-text-primary">
                        {project.estimatedTime || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Components:</span>
                      <span className="text-text-primary">
                        {project.components.length} items
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-text-primary mb-2">
                    Progress Control
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">
                        Progress: {editedProject.progress || 0}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editedProject.progress || 0}
                        onChange={(e) =>
                          updateProgress(parseInt(e.target.value))
                        }
                        className="w-full"
                        title="Project progress percentage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">
                        Status
                      </label>
                      <select
                        value={editedProject.status}
                        onChange={(e) =>
                          setEditedProject({
                            ...editedProject,
                            status: e.target.value as Project["status"],
                          })
                        }
                        className="w-full bg-primary border border-border-color rounded-md p-2 text-text-primary"
                        title="Project status">
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Testing">Testing</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-medium text-text-primary mb-2">Notes</h4>
                <textarea
                  value={editedProject.notes || ""}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      notes: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full bg-primary border border-border-color rounded-md p-3 text-text-primary"
                  placeholder="Add your project notes, observations, or reminders..."
                />
              </div>
            </div>
          )}

          {activeTab === "instructions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">
                  Step-by-Step Instructions
                </h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleGenerateInstructions}
                    disabled={isGeneratingInstructions}
                    className="text-sm bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50">
                    {isGeneratingInstructions ? (
                      <SpinnerIcon className="mr-2" />
                    ) : (
                      <SparklesIcon className="mr-2" />
                    )}
                    {isGeneratingInstructions
                      ? "Generating..."
                      : "Generate with AI"}
                  </button>
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="text-sm bg-highlight hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center">
                    <PlusIcon className="mr-2" />
                    Add Step
                  </button>
                </div>
              </div>

              {editedProject.instructions &&
              editedProject.instructions.length > 0 ? (
                <div className="space-y-4">
                  {editedProject.instructions.map((instruction, index) => (
                    <div
                      key={instruction.id}
                      className="bg-primary border border-border-color rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-text-primary flex items-center">
                          <span className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                            {instruction.step}
                          </span>
                          {instruction.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            toggleInstructionComplete(instruction.id)
                          }
                          className="text-highlight hover:text-green-400 transition-colors"
                          title="Mark as complete">
                          <CheckIcon />
                        </button>
                      </div>
                      <p className="text-text-primary mb-3 ml-9">
                        {instruction.description}
                      </p>

                      {instruction.code && (
                        <div className="ml-9 mb-3">
                          <h5 className="text-sm font-medium text-text-secondary mb-2">
                            Code:
                          </h5>
                          <pre className="bg-secondary p-3 rounded border border-border-color overflow-x-auto text-sm">
                            <code>{instruction.code}</code>
                          </pre>
                        </div>
                      )}

                      {instruction.tips && instruction.tips.length > 0 && (
                        <div className="ml-9">
                          <h5 className="text-sm font-medium text-text-secondary mb-2">
                            Tips:
                          </h5>
                          <ul className="text-sm text-text-primary space-y-1">
                            {instruction.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="flex items-start">
                                <span className="text-yellow-400 mr-2">💡</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <p className="mb-4">No instructions available yet.</p>
                  <p className="text-sm">
                    Use the "Generate with AI" button to create step-by-step
                    instructions automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "components" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Components List
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.components.map((component) => (
                  <div
                    key={component.id}
                    className="bg-primary border border-border-color rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-text-primary">
                        {component.name}
                      </h4>
                      <span className="text-sm text-text-secondary">
                        ×{component.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          component.source === "ai-suggested"
                            ? "bg-accent/20 text-accent"
                            : component.source === "github"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                        {component.source || "manual"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">
                  AI Insights
                </h3>
                <button
                  type="button"
                  onClick={handleGetInsights}
                  disabled={isGettingInsights}
                  className="text-sm bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50">
                  {isGettingInsights ? (
                    <SpinnerIcon className="mr-2" />
                  ) : (
                    <SparklesIcon className="mr-2" />
                  )}
                  {isGettingInsights ? "Analyzing..." : "Get AI Insights"}
                </button>
              </div>

              {editedProject.aiInsights ? (
                <div className="space-y-6">
                  {editedProject.aiInsights.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-3">
                        💡 Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {editedProject.aiInsights.suggestions.map(
                          (suggestion, index) => (
                            <li
                              key={index}
                              className="bg-primary border border-border-color rounded-lg p-3 text-text-primary">
                              {suggestion}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {editedProject.aiInsights.improvements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-3">
                        🚀 Improvements
                      </h4>
                      <ul className="space-y-2">
                        {editedProject.aiInsights.improvements.map(
                          (improvement, index) => (
                            <li
                              key={index}
                              className="bg-primary border border-border-color rounded-lg p-3 text-text-primary">
                              {improvement}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {editedProject.aiInsights.troubleshooting.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-3">
                        🔧 Troubleshooting
                      </h4>
                      <ul className="space-y-2">
                        {editedProject.aiInsights.troubleshooting.map(
                          (tip, index) => (
                            <li
                              key={index}
                              className="bg-primary border border-border-color rounded-lg p-3 text-text-primary">
                              {tip}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <p className="mb-4">No AI insights available yet.</p>
                  <p className="text-sm">
                    Click "Get AI Insights" to analyze your project and get
                    personalized suggestions.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "subprojects" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">
                  Sub-Projects Management
                </h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAnalyzeForSubProjects}
                    disabled={isAnalyzingComplexity}
                    className="text-sm bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50">
                    {isAnalyzingComplexity ? (
                      <SpinnerIcon className="mr-2" />
                    ) : (
                      <SparklesIcon className="mr-2" />
                    )}
                    {isAnalyzingComplexity
                      ? "Analyzing..."
                      : "AI Analyze & Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubProjectForm(!showSubProjectForm)}
                    className="text-sm bg-highlight hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center">
                    <PlusIcon className="mr-2" />
                    Manual Create
                  </button>
                </div>
              </div>

              {/* Manual Sub-Project Creation Form */}
              {showSubProjectForm && (
                <div className="bg-primary border border-border-color rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-text-primary">
                    Create New Sub-Project
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Sub-Project Name
                      </label>
                      <input
                        type="text"
                        value={newSubProjectName}
                        onChange={(e) => setNewSubProjectName(e.target.value)}
                        placeholder="e.g., Bedroom Hub Setup"
                        className="w-full bg-secondary border border-border-color rounded-md p-2 text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Description
                      </label>
                      <textarea
                        value={newSubProjectDescription}
                        onChange={(e) =>
                          setNewSubProjectDescription(e.target.value)
                        }
                        rows={3}
                        placeholder="Describe what this sub-project will accomplish..."
                        className="w-full bg-secondary border border-border-color rounded-md p-2 text-text-primary"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowSubProjectForm(false)}
                        className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateManualSubProject}
                        className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-md transition-colors">
                        Create Sub-Project
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Projects List */}
              {subProjects.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-text-primary">
                    Current Sub-Projects
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {subProjects.map((subProject) => (
                      <div
                        key={subProject.id}
                        className="bg-primary border border-border-color rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-text-primary">
                              {subProject.name.replace(
                                `${project.name} - `,
                                ""
                              )}
                            </h5>
                            <p className="text-sm text-text-secondary mt-1">
                              {subProject.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {subProject.phase && (
                              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                Phase {subProject.phase}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                subProject.status === "Completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : subProject.status === "In Progress"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : subProject.status === "Testing"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}>
                              {subProject.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-text-secondary">
                              Progress: {subProject.progress || 0}%
                            </div>
                            <div className="text-sm text-text-secondary">
                              Components: {subProject.components.length}
                            </div>
                            {subProject.estimatedTime && (
                              <div className="text-sm text-text-secondary">
                                Time: {subProject.estimatedTime}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // This would open the sub-project in detail view
                              // For now, just show a toast
                              addToast(`Opening ${subProject.name}...`, "info");
                            }}
                            className="text-sm bg-secondary hover:bg-primary text-text-primary px-3 py-1 rounded border border-border-color transition-colors">
                            Open Details
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full transition-all duration-300"
                              style={{ width: `${subProject.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Dependencies */}
                        {subProject.dependencies &&
                          subProject.dependencies.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border-color">
                              <p className="text-xs text-text-secondary mb-1">
                                Dependencies:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {subProject.dependencies.map((dep, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                    {dep}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <div className="text-4xl mb-4">🏗️</div>
                  <p className="mb-4">No sub-projects created yet.</p>
                  <p className="text-sm">
                    Use "AI Analyze & Create" to automatically break down
                    complex projects, or "Manual Create" to add your own
                    sub-projects.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="p-6 border-t border-border-color flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-md transition-colors">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailView;
