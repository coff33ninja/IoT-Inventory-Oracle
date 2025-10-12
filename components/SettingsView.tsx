
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { useToast } from '../contexts/ToastContext';
import { useHomeAssistant } from '../contexts/HomeAssistantContext';
import { testConnection } from '../services/homeAssistantService';

const SettingsView: React.FC = () => {
  const { inventory, setInventory } = useInventory();
  const { config, setConfig } = useHomeAssistant();
  const { addToast } = useToast();
  
  const [haUrl, setHaUrl] = useState(config?.url || '');
  const [haToken, setHaToken] = useState(config?.token || '');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'success' | 'error'>('unknown');
  const [autoPopulateEnabled, setAutoPopulateEnabled] = useState(() => {
    const saved = localStorage.getItem('iot-auto-populate');
    return saved !== null ? JSON.parse(saved) : true; // Default to enabled
  });
  
  useEffect(() => {
    if (config?.url && config?.token) {
        handleTestConnection();
    }
  }, [config]);

  const handleSaveHaConfig = () => {
    if (!haUrl.trim() || !haToken.trim()) {
        addToast('URL and Token cannot be empty.', 'error');
        return;
    }
    setConfig({ url: haUrl.trim(), token: haToken.trim() });
    addToast('Home Assistant config saved!', 'success');
  };

  const handleAutoPopulateToggle = (enabled: boolean) => {
    setAutoPopulateEnabled(enabled);
    localStorage.setItem('iot-auto-populate', JSON.stringify(enabled));
    addToast(`Auto-population ${enabled ? 'enabled' : 'disabled'}!`, 'success');
  };
  
  const handleTestConnection = async () => {
    if (!config?.url || !config?.token) return;
    setConnectionStatus('testing');
    const success = await testConnection(config);
    if (success) {
        setConnectionStatus('success');
    } else {
        setConnectionStatus('error');
    }
  };

  const apiKeyStatus = process.env.API_KEY ? 'Loaded from environment' : 'Not found';
  const [syncStatus, setSyncStatus] = useState('Idle');

  const handleExport = () => {
    try {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(inventory, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "iot-inventory.json";
        link.click();
        addToast('Inventory exported successfully!', 'success');
    } catch (error) {
        console.error('Failed to export inventory:', error);
        addToast('Error exporting inventory.', 'error');
    }
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const importedInventory = JSON.parse(text) as InventoryItem[];
            if (Array.isArray(importedInventory) && importedInventory.every(item => 'id' in item && 'name' in item)) {
              setInventory(importedInventory);
              addToast('Inventory imported successfully!', 'success');
            } else {
              throw new Error('Invalid inventory file format.');
            }
          }
        } catch (error) {
          console.error('Failed to import inventory:', error);
          addToast('Error: Could not import inventory. Check file format.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleMockSync = () => {
    setSyncStatus('Syncing...');
    addToast('Simulating sync with Google Drive...', 'info');
    setTimeout(() => {
        console.log("Simulating sync with Google Drive...");
        setSyncStatus('Last synced: ' + new Date().toLocaleString());
    }, 2000);
  };
  
  const ConnectionStatusIndicator: React.FC = () => {
    switch (connectionStatus) {
        case 'testing':
            return <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Testing...</span>;
        case 'success':
            return <span className="text-xs px-2 py-1 rounded-full bg-highlight/20 text-highlight">Connected</span>;
        case 'error':
            return <span className="text-xs px-2 py-1 rounded-full bg-danger/20 text-danger">Connection Failed</span>;
        default:
            return <span className="text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-400">Unknown</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Settings</h1>

      <div className="bg-secondary p-6 rounded-lg border border-border-color">
        <h2 className="text-xl font-semibold mb-4">AI Assistant Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">Gemini API Key</label>
            <div className="mt-1 flex items-center justify-between bg-primary p-3 rounded-md border border-border-color">
              <span className="font-mono text-sm truncate">{apiKeyStatus === 'Loaded from environment' ? `••••••••${process.env.API_KEY?.slice(-4)}` : 'N/A'}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${apiKeyStatus === 'Loaded from environment' ? 'bg-highlight/20 text-highlight' : 'bg-danger/20 text-danger'}`}>
                {apiKeyStatus}
              </span>
            </div>
            <p className="mt-2 text-xs text-text-secondary">The API key is securely loaded from environment variables and is not stored in the browser.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Auto-Population Settings</label>
            <div className="flex items-center justify-between bg-primary p-3 rounded-md border border-border-color">
              <div>
                <p className="text-sm font-medium">Auto-populate inventory and projects</p>
                <p className="text-xs text-text-secondary">Automatically add AI suggestions to your inventory and create projects during conversations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPopulateEnabled}
                  onChange={(e) => handleAutoPopulateToggle(e.target.checked)}
                  className="sr-only peer"
                  aria-label="Toggle auto-populate inventory and projects"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
       <div className="bg-secondary p-6 rounded-lg border border-border-color">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Home Assistant Integration</h2>
            <ConnectionStatusIndicator />
        </div>
        <div className="space-y-4">
            <div>
                <label htmlFor="ha-url" className="block text-sm font-medium text-text-secondary">Home Assistant URL</label>
                <input type="url" id="ha-url" value={haUrl} onChange={e => setHaUrl(e.target.value)} placeholder="http://homeassistant.local:8123" className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
             <div>
                <label htmlFor="ha-token" className="block text-sm font-medium text-text-secondary">Long-Lived Access Token</label>
                <input type="password" id="ha-token" value={haToken} onChange={e => setHaToken(e.target.value)} placeholder="Paste your token here" className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
                <p className="mt-2 text-xs text-text-secondary">You can generate a token in your Home Assistant profile page.</p>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSaveHaConfig} className="bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Save and Test Connection
                </button>
            </div>
        </div>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg border border-border-color">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <h3 className="font-medium">Export Inventory</h3>
            <p className="text-sm text-text-secondary mb-2">Save your current inventory as a JSON file.</p>
            <button onClick={handleExport} className="mt-auto w-full bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Export to JSON
            </button>
          </div>
          <div className="flex flex-col">
            <h3 className="font-medium">Import Inventory</h3>
            <p className="text-sm text-text-secondary mb-2">Load inventory from a previously exported JSON file.</p>
            <label className="mt-auto w-full cursor-pointer bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-center transition-colors">
              Import from JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

       <div className="bg-secondary p-6 rounded-lg border border-border-color">
        <h2 className="text-xl font-semibold mb-4">Cloud Sync (Placeholder)</h2>
        <p className="text-sm text-text-secondary mb-4">In a full version, you could connect your Google Drive to sync your inventory across devices. This is a demonstration.</p>
        <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{syncStatus}</span>
            <button onClick={handleMockSync} className="bg-highlight hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500" disabled={syncStatus === 'Syncing...'}>
              {syncStatus === 'Syncing...' ? 'Syncing...' : 'Sync to Google Drive'}
            </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;