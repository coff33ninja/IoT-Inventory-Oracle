import { ItemStatus } from './types';

export const STATUS_CONFIG: { [key in ItemStatus]: { color: string; label: string } } = {
  [ItemStatus.HAVE]: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'In Stock' },
  [ItemStatus.WANT]: { color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', label: 'Wishlist' },
  [ItemStatus.NEED]: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Required' },
  [ItemStatus.SALVAGED]: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Salvaged Parts' },
  [ItemStatus.RETURNED]: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Returned' },
  [ItemStatus.DISCARDED]: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Discarded' },
  [ItemStatus.GIVEN_AWAY]: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Given Away' },
};

export type ProjectStatus = 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold' | 'Dropped';

export const PROJECT_STATUS_CONFIG: { [key in ProjectStatus]: { 
  color: string; 
  label: string; 
  icon: string;
  description: string;
  nextStates: ProjectStatus[];
} } = {
  'Planning': { 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    label: 'Planning', 
    icon: '📋',
    description: 'Project is in planning phase',
    nextStates: ['In Progress', 'On Hold', 'Dropped']
  },
  'In Progress': { 
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
    label: 'In Progress', 
    icon: '🔨',
    description: 'Project is actively being worked on',
    nextStates: ['Testing', 'Completed', 'On Hold', 'Dropped']
  },
  'Testing': { 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
    label: 'Testing', 
    icon: '🧪',
    description: 'Project is in testing phase',
    nextStates: ['Completed', 'In Progress', 'On Hold', 'Dropped']
  },
  'Completed': { 
    color: 'bg-green-500/20 text-green-400 border-green-500/30', 
    label: 'Completed', 
    icon: '✅',
    description: 'Project is finished and working',
    nextStates: ['In Progress', 'Testing'] // Can reopen for modifications
  },
  'On Hold': { 
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', 
    label: 'On Hold', 
    icon: '⏸️',
    description: 'Project is paused temporarily',
    nextStates: ['Planning', 'In Progress', 'Dropped']
  },
  'Dropped': { 
    color: 'bg-red-500/20 text-red-400 border-red-500/30', 
    label: 'Dropped', 
    icon: '🗑️',
    description: 'Project has been abandoned',
    nextStates: ['Planning'] // Can restart from planning
  }
};
