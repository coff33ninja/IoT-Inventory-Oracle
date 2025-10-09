import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface LinkGithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (url: string) => void;
  project: Project | null;
}

const LinkGithubModal: React.FC<LinkGithubModalProps> = ({ isOpen, onClose, onLink, project }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (project?.githubUrl) {
      setUrl(project.githubUrl);
    } else {
      setUrl('');
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim().match(/^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+$/)) {
      onLink(url.trim());
      onClose();
    } else {
        alert("Please enter a valid GitHub repository URL. e.g. https://github.com/user/repo");
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-lg border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <h3 className="text-lg font-medium leading-6 text-text-primary">
              Link GitHub Repository
            </h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="github-url" className="block text-sm font-medium text-text-secondary">Repository URL</label>
              <input 
                type="url" 
                id="github-url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://github.com/user/repository"
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" 
              />
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-secondary border border-border-color py-2 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-primary transition-colors">Cancel</button>
              <button type="submit" className="bg-accent hover:bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors">Link Repository</button>
            </div>
          </form>
        </div>
      </div>
       <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default LinkGithubModal;