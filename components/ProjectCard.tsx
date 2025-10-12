import React, { useState } from 'react';
import { Project } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { GithubIcon } from './icons/GithubIcon';
import { LinkIcon } from './icons/LinkIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';

interface ProjectCardProps {
    project: Project;
    onAiKickstart: (project: Project) => void;
    onUpdate: (project: Project) => void;
    onDelete: (project: Project) => void;
    onLinkRepo: (project: Project) => void;
    onSyncRepo: (project: Project) => void;
    isSyncing: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onAiKickstart, onUpdate, onDelete, onLinkRepo, onSyncRepo, isSyncing }) => {
    const [notes, setNotes] = useState(project.notes || '');
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(project.name);
    const [editedDescription, setEditedDescription] = useState(project.description);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const handleNotesSave = () => {
        onUpdate({ ...project, notes });
    };

    const toggleStatus = () => {
        const newStatus = project.status === 'In Progress' ? 'Completed' : 'In Progress';
        onUpdate({ ...project, status: newStatus });
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        onUpdate({ 
            ...project, 
            name: editedName.trim() || project.name,
            description: editedDescription.trim() || project.description
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedName(project.name);
        setEditedDescription(project.description);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
            onDelete(project);
        }
    };

    const manualComponents = project.components.filter(c => c.source === 'manual');
    const githubComponents = project.components.filter(c => c.source === 'github');
    const aiComponents = project.components.filter(c => c.source === 'ai-suggested');


    return (
        <div className="bg-secondary border border-border-color rounded-lg shadow-md transition-all hover:shadow-lg hover:border-accent/50 flex flex-col">
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
                                        className="text-xs bg-accent hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="text-xs bg-secondary border border-border-color text-text-primary px-2 py-1 rounded hover:bg-border-color transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="font-bold text-lg text-text-primary">{project.name}</h3>
                                <p className="text-sm text-text-secondary mb-1">{project.description}</p>
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
                                    title="Edit project"
                                >
                                    <EditIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1 text-text-secondary hover:text-red-400 transition-colors"
                                    title="Delete project"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={toggleStatus}
                            className={`text-xs font-semibold py-1 px-3 rounded-full transition-colors ${
                                project.status === 'In Progress' 
                                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/40' 
                                : 'bg-highlight/20 text-highlight hover:bg-highlight/40'
                            }`}
                        >
                            {project.status}
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 space-y-4 flex-grow">
                { project.githubUrl ? (
                     <div className="flex items-center justify-between bg-primary p-2 rounded-md">
                        <div className="flex items-center gap-2 overflow-hidden">
                             <GithubIcon className="h-5 w-5 flex-shrink-0" />
                             <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:underline truncate">
                                 {project.githubUrl.replace('https://github.com/', '')}
                             </a>
                        </div>
                        <button onClick={() => onSyncRepo(project)} disabled={isSyncing} className="flex items-center gap-1 text-xs bg-secondary border border-border-color py-1 px-2 rounded-md text-text-primary hover:bg-border-color transition-colors disabled:opacity-50 disabled:cursor-wait">
                           {isSyncing ? <SpinnerIcon /> : <RefreshIcon />} Sync
                        </button>
                     </div>
                ) : (
                    <button onClick={() => onLinkRepo(project)} className="w-full flex items-center justify-center gap-2 text-sm bg-primary hover:bg-border-color border border-border-color p-2 rounded-md transition-colors">
                        <LinkIcon /> Link GitHub Repo
                    </button>
                )}

                <div>
                    <h4 className="font-semibold text-sm text-text-secondary mb-2">Components</h4>
                    <ul className="space-y-1 max-h-28 overflow-y-auto pr-2">
                        {manualComponents.map(c => (
                            <li key={c.id} className="text-sm flex justify-between">
                                <span className="text-text-primary truncate pr-2">{c.name}</span>
                                <span className="flex-shrink-0 font-mono text-xs bg-primary px-2 py-0.5 rounded">Qty: {c.quantity}</span>
                            </li>
                        ))}
                        {githubComponents.map(c => (
                             <li key={c.id} className="text-sm flex justify-between items-center">
                                <span className="text-text-primary truncate pr-2 flex items-center gap-1.5">
                                    <GithubIcon className="h-3 w-3 text-text-secondary" />
                                    {c.name}
                                </span>
                                <span className="flex-shrink-0 font-mono text-xs bg-primary px-2 py-0.5 rounded">Qty: {c.quantity}</span>
                            </li>
                        ))}
                        {aiComponents.map(c => (
                             <li key={c.id} className="text-sm flex justify-between items-center">
                                <span className="text-text-primary truncate pr-2 flex items-center gap-1.5">
                                    <SparklesIcon />
                                    {c.name}
                                </span>
                                <span className="flex-shrink-0 font-mono text-xs bg-primary px-2 py-0.5 rounded">Qty: {c.quantity}</span>
                            </li>
                        ))}
                         {project.components.length === 0 && <li className="text-xs text-text-secondary">No components added.</li>}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary mb-2">Project Notes</h4>
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
            <div className="p-4 bg-primary/50 rounded-b-lg">
                <button 
                    onClick={() => onAiKickstart(project)}
                    className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                    <SparklesIcon />
                    <span>AI Kickstart</span>
                </button>
            </div>
        </div>
    );
};