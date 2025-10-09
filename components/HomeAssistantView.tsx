import React, { useEffect, useState, useMemo } from 'react';
import { useHomeAssistant } from '../contexts/HomeAssistantContext';
import { SpinnerIcon } from './icons/SpinnerIcon';
import EntityCard from './EntityCard';
import LinkInventoryModal from './LinkInventoryModal';
import { HomeAssistantEntity } from '../types';

const HomeAssistantView: React.FC = () => {
  const { config, entities, loading, error, fetchEntities } = useHomeAssistant();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [entityToLink, setEntityToLink] = useState<HomeAssistantEntity | null>(null);

  useEffect(() => {
    if (config) {
      fetchEntities();
    }
  }, [config, fetchEntities]);
  
  const handleOpenLinkModal = (entity: HomeAssistantEntity) => {
    setEntityToLink(entity);
    setIsLinkModalOpen(true);
  };

  const filteredEntities = useMemo(() => {
    return entities
      .filter(entity => {
        const name = entity.attributes.friendly_name || entity.entity_id;
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || entity.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => (a.attributes.friendly_name || a.entity_id).localeCompare(b.attributes.friendly_name || b.entity_id));
  }, [entities, searchTerm]);

  if (!config) {
    return (
      <div className="text-center py-16 bg-secondary rounded-lg">
        <h3 className="text-xl font-semibold text-text-primary">Home Assistant Not Configured</h3>
        <p className="text-text-secondary mt-2">
          Please go to the Settings page to connect your Home Assistant instance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary">Home Assistant Dashboard</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-secondary border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-10">
          <SpinnerIcon />
          <span className="ml-3 text-text-secondary">Fetching entities from Home Assistant...</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-10 text-red-400 bg-danger/10 rounded-lg">
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntities.map(entity => (
            <EntityCard key={entity.entity_id} entity={entity} onLink={handleOpenLinkModal} />
          ))}
        </div>
      )}
      
      <LinkInventoryModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        entity={entityToLink}
      />
    </div>
  );
};

export default HomeAssistantView;
