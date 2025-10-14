import { useEffect } from 'react';

let servicesInitialized = false;

export const useServiceInitialization = () => {
  useEffect(() => {
    if (!servicesInitialized) {
      try {
        // Services will be initialized on the server side
        // The browser doesn't need to initialize database services
        // Currency services will be initialized when needed via API calls
        servicesInitialized = true;
        
        console.debug('Service initialization completed (browser mode)');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    }
  }, []);
};