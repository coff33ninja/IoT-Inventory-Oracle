import React, { useState, useEffect, useCallback } from 'react';
import { InventoryItem, AiInsights, MarketDataItem } from '../types';
import { getComponentIntelligence } from '../services/geminiService';
import { useInventory } from '../contexts/InventoryContext';
import { CameraIcon } from './icons/CameraIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { InfoIcon } from './icons/InfoIcon';
import { PriceTagIcon } from './icons/PriceTagIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { STATUS_CONFIG } from '../constants';

interface ComponentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

type ActiveTab = 'insights' | 'market';

const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({ isOpen, onClose, item }) => {
  const { updateItemIntelligence } = useInventory();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('insights');
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [marketData, setMarketData] = useState<MarketDataItem[] | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!item) return;

    setIsLoading(true);
    setError(null);

    const now = new Date();
    const lastRefreshed = item.lastRefreshed ? new Date(item.lastRefreshed) : null;
    const oneDay = 24 * 60 * 60 * 1000;
    const isDataFresh = lastRefreshed && (now.getTime() - lastRefreshed.getTime() < oneDay);

    if (item.aiInsights && item.marketData && isDataFresh && !forceRefresh) {
      setAiInsights(item.aiInsights);
      setMarketData(item.marketData);
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await getComponentIntelligence(item.name);
      setAiInsights(data.aiInsights);
      setMarketData(data.marketData);
      updateItemIntelligence(item.id, data.aiInsights, data.marketData);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch component intelligence. The AI may be busy or the component is too obscure.");
    } finally {
      setIsLoading(false);
    }
  }, [item, updateItemIntelligence]);

  useEffect(() => {
    if (isOpen && item) {
      fetchData();
    }
  }, [isOpen, item, fetchData]);

  if (!isOpen || !item) return null;

  const lastRefreshedDate = item.lastRefreshed ? new Date(item.lastRefreshed) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-2xl border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start pb-4 border-b border-border-color">
            <div className="flex items-center space-x-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover border border-border-color" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary border border-border-color flex items-center justify-center">
                    <CameraIcon className="h-8 w-8 text-text-secondary" />
                </div>
              )}
              <div>
                  <h3 className="text-xl font-bold leading-6 text-text-primary">{item.name}</h3>
                   <div className="text-sm text-text-secondary mt-1">
                        In Stock: <span className="font-semibold text-text-primary">{item.quantity}</span>
                        {' | '} Location: <span className="font-semibold text-text-primary">{item.location}</span>
                        {item.category && <> {' | '} Category: <span className="font-semibold text-text-primary">{item.category}</span></>}
                        {item.source && <> {' | '} Source: <span className="font-semibold text-text-primary">{item.source}</span></>}
                   </div>
                   <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_CONFIG[item.status].color}`}>
                      {item.status}
                  </span>
              </div>
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="mt-4">
             <div className="border-b border-border-color">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('insights')} className={`${activeTab === 'insights' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                       <InfoIcon /> AI Insights
                    </button>
                    <button onClick={() => setActiveTab('market')} className={`${activeTab === 'market' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                        <PriceTagIcon /> Market Price
                    </button>
                </nav>
            </div>
          </div>

          <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2 space-y-4">
            {isLoading && (
              <div className="flex justify-center items-center py-10">
                <SpinnerIcon />
                <span className="ml-3 text-text-secondary">Fetching latest intelligence...</span>
              </div>
            )}
            {error && !isLoading && (
                 <div className="text-center py-10 text-red-400 bg-danger/10 rounded-lg">
                    <p className="font-semibold">An Error Occurred</p>
                    <p className="text-sm">{error}</p>
                 </div>
            )}
            {!isLoading && !error && (
                <>
                {activeTab === 'insights' && aiInsights && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <h4 className="font-semibold text-text-primary mb-2">Detailed Description</h4>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">{aiInsights.detailedDescription}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary mb-2">Project Ideas</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                                {aiInsights.projectIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
                {activeTab === 'market' && (
                     <div className="space-y-4 animate-fade-in">
                         <div className="flex justify-between items-center">
                             <div>
                                <h4 className="font-semibold text-text-primary">Online Pricing</h4>
                                {lastRefreshedDate && <p className="text-xs text-text-secondary">Last updated: {lastRefreshedDate.toLocaleString()}</p>}
                             </div>
                             <button onClick={() => fetchData(true)} className="flex items-center gap-2 text-xs bg-secondary border border-border-color py-1 px-3 rounded-md text-text-primary hover:bg-primary transition-colors">
                                 <RefreshIcon /> Refresh
                             </button>
                         </div>
                         {marketData && marketData.length > 0 ? (
                            <div className="divide-y divide-border-color border border-border-color rounded-lg">
                                {marketData.map((data, i) => (
                                    <div key={i} className="p-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-sm text-text-primary">{data.supplier}</p>
                                            <p className="text-sm text-highlight font-bold">{data.price}</p>
                                        </div>
                                        <a href={data.link} target="_blank" rel="noopener noreferrer" className="text-sm bg-accent hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md transition-colors">
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-sm text-text-secondary text-center py-4">No market data found for this component.</p>}
                     </div>
                )}
                </>
            )}
          </div>
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
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ComponentDetailModal;