import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { HomeAssistantConfig, HomeAssistantEntity, EntityInventoryLink } from '../types';
import { getEntities } from '../services/homeAssistantService';

interface HomeAssistantContextType {
  config: HomeAssistantConfig | null;
  setConfig: (config: HomeAssistantConfig) => void;
  entities: HomeAssistantEntity[];
  loading: boolean;
  error: string | null;
  fetchEntities: () => void;
  links: EntityInventoryLink[];
  addLink: (link: EntityInventoryLink) => void;
  removeLink: (entityId: string) => void;
}

const HomeAssistantContext = createContext<HomeAssistantContextType | undefined>(undefined);

export const HomeAssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<HomeAssistantConfig | null>(null);
  const [entities, setEntities] = useState<HomeAssistantEntity[]>([]);
  const [links, setLinks] = useState<EntityInventoryLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('ha-config');
      if (savedConfig) {
        setConfigState(JSON.parse(savedConfig));
      }
      const savedLinks = localStorage.getItem('ha-links');
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
      }
    } catch (err) {
      console.error("Failed to parse Home Assistant data from localStorage", err);
    }
  }, []);

  const setConfig = (newConfig: HomeAssistantConfig) => {
    setConfigState(newConfig);
    localStorage.setItem('ha-config', JSON.stringify(newConfig));
  };
  
  const addLink = (link: EntityInventoryLink) => {
    setLinks(prev => {
        const otherLinks = prev.filter(l => l.entityId !== link.entityId);
        const newLinks = [...otherLinks, link];
        localStorage.setItem('ha-links', JSON.stringify(newLinks));
        return newLinks;
    });
  }
  
  const removeLink = (entityId: string) => {
      setLinks(prev => {
          const newLinks = prev.filter(l => l.entityId !== entityId);
          localStorage.setItem('ha-links', JSON.stringify(newLinks));
          return newLinks;
      });
  }

  const fetchEntities = useCallback(async () => {
    if (!config) {
      setError("Home Assistant is not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedEntities = await getEntities(config);
      if (fetchedEntities) {
        setEntities(fetchedEntities);
      } else {
        setError("Failed to fetch entities. Check your connection settings and Home Assistant logs.");
      }
    } catch (err) {
      setError("An unexpected error occurred while fetching entities.");
    } finally {
      setLoading(false);
    }
  }, [config]);

  return (
    <HomeAssistantContext.Provider value={{
      config,
      setConfig,
      entities,
      loading,
      error,
      fetchEntities,
      links,
      addLink,
      removeLink
    }}>
      {children}
    </HomeAssistantContext.Provider>
  );
};

export const useHomeAssistant = (): HomeAssistantContextType => {
  const context = useContext(HomeAssistantContext);
  if (context === undefined) {
    throw new Error('useHomeAssistant must be used within a HomeAssistantProvider');
  }
  return context;
};