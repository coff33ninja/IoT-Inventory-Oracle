
import React from 'react';
import { InventoryIcon } from './icons/InventoryIcon';
import { ChatIcon } from './icons/ChatIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ProjectsIcon } from './icons/ProjectsIcon';
import { HomeAssistantIcon } from './icons/HomeAssistantIcon';

type View = 'inventory' | 'chat' | 'settings' | 'projects' | 'home-assistant';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-accent/20 text-accent'
        : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
    }`}
  >
    <span className="w-6 h-6 mr-4">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen }) => {

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  }

  return (
    <>
        <div
            className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
        ></div>
        <aside
            className={`fixed top-0 left-0 z-40 w-64 h-full bg-secondary border-r border-border-color flex flex-col p-4 transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}
        >
            <div className="flex items-center mb-8 px-2">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-text-primary">IoT Oracle</h1>
            </div>
            <nav className="flex flex-col space-y-2">
                <NavItem
                    label="Inventory"
                    icon={<InventoryIcon />}
                    isActive={currentView === 'inventory'}
                    onClick={() => handleNavigation('inventory')}
                />
                 <NavItem
                    label="Projects"
                    icon={<ProjectsIcon />}
                    isActive={currentView === 'projects'}
                    onClick={() => handleNavigation('projects')}
                />
                <NavItem
                    label="Home Assistant"
                    icon={<HomeAssistantIcon />}
                    isActive={currentView === 'home-assistant'}
                    onClick={() => handleNavigation('home-assistant')}
                />
                <NavItem
                    label="Chat Assistant"
                    icon={<ChatIcon />}
                    isActive={currentView === 'chat'}
                    onClick={() => handleNavigation('chat')}
                />
                <NavItem
                    label="Settings"
                    icon={<SettingsIcon />}
                    isActive={currentView === 'settings'}
                    onClick={() => handleNavigation('settings')}
                />
            </nav>
            <div className="mt-auto text-center text-text-secondary text-xs">
                <p>&copy; 2024 Plus Ultra Apps</p>
            </div>
        </aside>
    </>
  );
};

export default Sidebar;