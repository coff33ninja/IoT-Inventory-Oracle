import { HomeAssistantConfig, HomeAssistantEntity } from "../types";

const callApi = async <T>(config: HomeAssistantConfig, endpoint: string): Promise<T | null> => {
    if (!config.url || !config.token) {
        return null;
    }
    
    // Simple proxy to bypass CORS issues in development/testing environments
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const apiUrl = `${proxyUrl}${config.url}/api/${endpoint}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Header for cors-anywhere proxy
            }
        });

        if (!response.ok) {
            console.error(`Home Assistant API error: ${response.status} ${response.statusText}`);
            return null;
        }
        
        return await response.json() as T;

    } catch (error) {
        console.error("Failed to fetch from Home Assistant API:", error);
        return null;
    }
}

export const testConnection = async (config: HomeAssistantConfig): Promise<boolean> => {
    const response = await callApi<{ message: string }>(config, '');
    return response?.message === "API running.";
}

export const getEntities = async (config: HomeAssistantConfig): Promise<HomeAssistantEntity[]> => {
    const response = await callApi<HomeAssistantEntity[]>(config, 'states');
    return response || [];
}
