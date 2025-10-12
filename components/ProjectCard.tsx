import React, { useState } from "react";
import { Project } from "../types";
import { SparklesIcon } from "./icons/SparklesIcon";
import { GithubIcon } from "./icons/GithubIcon";
import { LinkIcon } from "./icons/LinkIcon";
import { RefreshIcon } from "./icons/RefreshIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { EditIcon } from "./icons/EditIcon";
import { suggestProjectImprovements } from "../services/geminiService";

interface ProjectCardProps {
  project: Project;
  onAiKickstart: (project: Project) => void;
  onUpdate: (project: Project) => void;
  onDelete: (project: Project) => void;
  onLinkRepo: (project: Project) => void;
  onSyncRepo: (project: Project) => void;
  onClick?: (project: Project) => void;
  isSyncing: boolean;
  subProjects?: Project[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onAiKickstart,
  onUpdate,
  onDelete,
  onLinkRepo,
  onSyncRepo,
  onClick,
  isSyncing,
  subProjects = [],
}) => {
  const [notes, setNotes] = useState(project.notes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(
    project.description
  );
  const [showImprovements, setShowImprovements] = useState(false);
  const [improvements, setImprovements] = useState<any>(null);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleNotesSave = () => {
    onUpdate({ ...project, notes });
  };

  const toggleStatus = () => {
    let newStatus: Project['status'];
    if (project.status === "Planning") {
      newStatus = "In Progress";
    } else if (project.status === "In Progress") {
      newStatus = "Completed";
    } else {
      newStatus = "Planning"; // Reset completed projects back to planning
    }
    onUpdate({ ...project, status: newStatus });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...project,
      name: editedName.trim() || project.name,
      description: editedDescription.trim() || project.description,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(project.name);
    setEditedDescription(project.description);
    setIsEditing(false);
  };

  const handleGetImprovements = async () => {
    setIsLoadingImprovements(true);
    try {
      const improvementData = await suggestProjectImprovements(
        project.name,
        project.description,
        project.components
      );
      setImprovements(improvementData);
      setShowImprovements(true);
    } catch (error) {
      console.error("Failed to get project improvements:", error);
      alert("Failed to get improvement suggestions. Please try again.");
    } finally {
      setIsLoadingImprovements(false);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`
      )
    ) {
      onDelete(project);
    }
  };

  const manualComponents = project.components.filter(
    (c) => c.source === "manual"
  );
  const githubComponents = project.components.filter(
    (c) => c.source === "github"
  );
  const aiComponents = project.components.filter(
    (c) => c.source === "ai-suggested"
  );

  return (
    <div 
      className="bg-secondary border border-border-color rounded-lg shadow-md transition-all hover:shadow-lg hover:border-accent/50 flex flex-col cursor-pointer"
      onClick={() => onClick?.(project)}
    >
      <div className="p-4 border-b border-border-color">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-primary border border-border-color rounded px-2 py-1 text-lg font-bold text-text-primary focus:ring-accent focus:border-accent"
                  placeholder="Project name"
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full bg-primary border border-border-color rounded px-2 py-1 text-sm text-text-secondary focus:ring-accent focus:border-accent"
                  placeholder="Project description"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs bg-accent hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors">
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs bg-secondary border border-border-color text-text-primary px-2 py-1 rounded hover:bg-border-color transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-lg text-text-primary">
                  {project.name}
                </h3>
                <p className="text-sm text-text-secondary mb-1">
                  {project.description}
                </p>
                <p className="text-xs text-text-secondary">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleEdit}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                  title="Edit project">
                  <EditIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-text-secondary hover:text-red-400 transition-colors"
                  title="Delete project">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={toggleStatus}
              className={`text-xs font-semibold py-1 px-3 rounded-full transition-colors ${
                project.status === "Planning"
                  ? "bg-gray-500/20 text-gray-400 hover:bg-gray-500/40"
                  : project.status === "In Progress"
                  ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/40"
                  : "bg-highlight/20 text-highlight hover:bg-highlight/40"
              }`}>
              {project.status}
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4 flex-grow">
        {project.githubUrl ? (
          <div className="flex items-center justify-between bg-primary p-2 rounded-md">
            <div className="flex items-center gap-2 overflow-hidden">
              <GithubIcon className="h-5 w-5 flex-shrink-0" />
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-400 hover:underline truncate">
                {project.githubUrl.replace("https://github.com/", "")}
              </a>
            </div>
            <button
              onClick={() => onSyncRepo(project)}
              disabled={isSyncing}
              className="flex items-center gap-1 text-xs bg-secondary border border-border-color py-1 px-2 rounded-md text-text-primary hover:bg-border-color transition-colors disabled:opacity-50 disabled:cursor-wait">
              {isSyncing ? <SpinnerIcon /> : <RefreshIcon />} Sync
            </button>
          </div>
        ) : (
          <button
            onClick={() => onLinkRepo(project)}
            className="w-full flex items-center justify-center gap-2 text-sm bg-primary hover:bg-border-color border border-border-color p-2 rounded-md transition-colors">
            <LinkIcon /> Link GitHub Repo
          </button>
        )}

        <div>
          <h4 className="font-semibold text-sm text-text-secondary mb-2">
            Components
          </h4>
          <ul className="space-y-1 max-h-28 overflow-y-auto pr-2">
            {manualComponents.map((c) => (
              <li key={c.id} className="text-sm flex justify-between">
                <span className="text-text-primary truncate pr-2">
                  {c.name}
                </span>
                <span className="flex-shrink-0 font-mono text-xs bg-primary px-2 py-0.5 rounded">
                  Qty: {c.quantity}
                </span>
              </li>
            ))}
            {githubComponents.map((c) => (
              <li
                key={c.id}
                className="text-sm flex justify-between items-center">
                <span className="text-text-primary truncate pr-2 flex items-center gap-1.5">
                  <GithubIcon className="h-3 w-3 text-text-secondary" />
                  {c.name}
                </span>
                <span className="flex-shrink-0 font-mono text-xs bg-primary px-2 py-0.5 rounded">
                  Qty: {c.quantity}
                </span>
              </li>
            ))}
            {aiComponents.map((c) => (
              <li
                key={c.id}
                className="text-sm flex justify-between items-center">
                <span className="text-text-primary truncate pr-2 flex items-center gap-1.5">
                  <SparklesIcon />
                  {c.name}
                </span>
                <span className="flex-shrink-0 font-mono text-xs bg-primary px-2 py-0.5 rounded">
                  Qty: {c.quantity}
                </span>
              </li>
            ))}
            {project.components.length === 0 && (
              <li className="text-xs text-text-secondary">
                No components added.
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-text-secondary mb-2">
            Project Notes
          </h4>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesSave}
            placeholder="Add your notes, links, or to-do items here..."
            rows={3}
            className="w-full bg-primary border border-border-color rounded-md text-sm p-2 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>
      
      {/* Sub-projects section */}
      {subProjects.length > 0 && (
        <div className="px-4 py-3 border-t border-border-color">
          <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Sub-Projects ({subProjects.length})
          </h4>
          <div className="space-y-2">
            {subProjects.map((subProject) => (
              <div key={subProject.id} className="bg-secondary p-2 rounded border border-border-color">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {subProject.name.replace(`${project.name} - `, '')}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        subProject.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                        subProject.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                        subProject.status === 'Testing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {subProject.status}
                      </span>
                      {subProject.phase && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                          Phase {subProject.phase}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {subProject.progress || 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-4 bg-primary/50 rounded-b-lg space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={() => onAiKickstart(project)}
            className="flex-1 bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2">
            <SparklesIcon />
            <span>AI Kickstart</span>
          </button>
          <button
            onClick={handleGetImprovements}
            disabled={isLoadingImprovements}
            className="flex-1 bg-highlight hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
            {isLoadingImprovements ? <SpinnerIcon /> : <SparklesIcon />}
            <span>{isLoadingImprovements ? "Analyzing..." : "Improve"}</span>
          </button>
        </div>

        {showImprovements && improvements && (
          <div className="mt-4 p-3 bg-secondary rounded-lg border border-border-color">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-text-primary">
                AI Improvement Suggestions
              </h4>
              <button
                onClick={() => setShowImprovements(false)}
                className="text-text-secondary hover:text-text-primary">
                ×
              </button>
            </div>

            {improvements.suggestions.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-text-secondary mb-1">
                  General Improvements:
                </h5>
                <ul className="text-xs text-text-primary space-y-1">
                  {improvements.suggestions.map(
                    (suggestion: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-highlight mr-1">•</span>
                        {suggestion}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {improvements.additionalComponents.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-text-secondary mb-1">
                  Suggested Components:
                </h5>
                <ul className="text-xs text-text-primary space-y-1">
                  {improvements.additionalComponents.map(
                    (comp: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-accent mr-1">+</span>
                        <span>
                          <strong>{comp.name}</strong> - {comp.reason}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {improvements.optimizations.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-text-secondary mb-1">
                  Optimizations:
                </h5>
                <ul className="text-xs text-text-primary space-y-1">
                  {improvements.optimizations.map(
                    (opt: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-400 mr-1">⚡</span>
                        {opt}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
