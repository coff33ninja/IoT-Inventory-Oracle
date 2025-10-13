
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { InventoryProvider } from './contexts/InventoryContext';
import { ToastProvider } from './contexts/ToastContext';
import { HomeAssistantProvider } from './contexts/HomeAssistantContext';
import { RecommendationPreferencesProvider } from './contexts/RecommendationPreferencesContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <CurrencyProvider>
      <ToastProvider>
        <RecommendationPreferencesProvider>
          <InventoryProvider>
            <HomeAssistantProvider>
              <App />
            </HomeAssistantProvider>
          </InventoryProvider>
        </RecommendationPreferencesProvider>
      </ToastProvider>
    </CurrencyProvider>
  </React.StrictMode>
);