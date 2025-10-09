
import React, { useState } from 'react';
import { InventoryItem, Project } from './types';
import Sidebar from './components/Sidebar';
import InventoryView from './components/InventoryView';
import ChatView from './components/ChatView';
import SettingsView from './components/SettingsView';
import ProjectsView from './components/ProjectsView';
import HomeAssistantView from './components/HomeAssistantView';
import AddItemModal from './components/AddItemModal';
import { PlusIcon } from './components/icons/PlusIcon';
import { useInventory } from './contexts/InventoryContext';

type View = 'inventory' | 'chat' | 'settings' | 'projects' | 'home-assistant';

const App: React.FC = () => {
  const { inventory, addItem, updateItem, addProject } = useInventory();
  const [currentView, setCurrentView] = useState<View>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);

  const handleEditItem = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const openModalForNewItem = () => {
    setItemToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleCheckoutComplete = (projectName: string, components: { id: string; name: string; quantity: number }[]) => {
    const newProject: Omit<Project, 'id' | 'createdAt'> = {
      name: projectName,
      description: projectName, // Or could be a separate field in checkout
      components,
      status: 'In Progress',
      notes: ''
    };
    addProject(newProject);
    setCurrentView('projects');
  };
  
  const handleAiKickstart = (project: Project) => {
    const componentList = project.components.map(c => `${c.quantity} x ${c.name}`).join(', ');
    const message = `I'm starting a new project called "${project.name}". I'm using the following components: ${componentList}. Can you help me get started by creating a step-by-step plan, suggesting a circuit diagram, and providing some starter code?`;
    setChatInitialMessage(message);
    setCurrentView('chat');
  };

  // Reset chat message after navigating away from chat
  React.useEffect(() => {
    if (currentView !== 'chat' && chatInitialMessage) {
      setChatInitialMessage(null);
    }
  }, [currentView, chatInitialMessage]);

  return (
    <div className="flex h-screen bg-primary text-text-primary font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 lg:ml-64">
         <div className="p-4 lg:hidden border-b border-border-color flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>
            <h1 className="text-xl font-bold ml-4">IoT Inventory Oracle</h1>
        </div>
        <div className={`flex-1 ${currentView === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'} p-4 sm:p-6 lg:p-8`}>
            {currentView === 'inventory' && (
                <InventoryView 
                    onEdit={handleEditItem}
                    onCheckoutComplete={handleCheckoutComplete}
                />
            )}
            {currentView === 'projects' && <ProjectsView onAiKickstart={handleAiKickstart} />}
            {currentView === 'chat' && <ChatView initialMessage={chatInitialMessage} />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'home-assistant' && <HomeAssistantView />}
        </div>
      </main>

      {currentView === 'inventory' && (
        <button
            onClick={openModalForNewItem}
            className="fixed bottom-6 right-6 bg-accent hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent z-20"
            aria-label="Add new inventory item"
        >
            <PlusIcon />
        </button>
      )}

      {isModalOpen && (
        <AddItemModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={itemToEdit ? updateItem : addItem}
            itemToEdit={itemToEdit}
            inventory={inventory}
        />
      )}
    </div>
  );
};

export default App;