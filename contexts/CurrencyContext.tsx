import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENCIES, DEFAULT_CURRENCY, formatCurrency, parseCurrency, convertCurrency, Currency } from '../constants/currencies';
import { getCurrencyAwareServiceManager } from '../services/currencyAwareServices';

interface CurrencyContextType {
  currentCurrency: string;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (amount: number, currencyCode?: string) => string;
  parsePrice: (priceString: string, currencyCode?: string) => number;
  convertPrice: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  getCurrency: (currencyCode?: string) => Currency;
  availableCurrencies: Record<string, Currency>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

const CURRENCY_STORAGE_KEY = 'iot-inventory-currency';

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<string>(DEFAULT_CURRENCY);

  // Load saved currency preference on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrentCurrency(savedCurrency);
    } else {
      // Try to detect user's locale currency
      const userLocale = navigator.language || 'en-US';
      const detectedCurrency = detectCurrencyFromLocale(userLocale);
      if (detectedCurrency && CURRENCIES[detectedCurrency]) {
        setCurrentCurrency(detectedCurrency);
      }
    }
  }, []);

  // Notify service manager when currency changes
  useEffect(() => {
    try {
      const serviceManager = getCurrencyAwareServiceManager();
      serviceManager.setUserCurrency(currentCurrency);
    } catch (error) {
      // Service manager not initialized yet, that's okay
      console.debug('Service manager not initialized yet');
    }
  }, [currentCurrency]);

  const setCurrency = (currencyCode: string) => {
    if (CURRENCIES[currencyCode]) {
      setCurrentCurrency(currencyCode);
      localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      
      // Update service manager with new currency
      try {
        const serviceManager = getCurrencyAwareServiceManager();
        serviceManager.setUserCurrency(currencyCode);
      } catch (error) {
        // Service manager not initialized yet, that's okay
        console.debug('Service manager not initialized yet');
      }
    } else {
      console.warn(`Invalid currency code: ${currencyCode}`);
    }
  };

  const formatPrice = (amount: number, currencyCode?: string): string => {
    return formatCurrency(amount, currencyCode || currentCurrency);
  };

  const parsePrice = (priceString: string, currencyCode?: string): number => {
    return parseCurrency(priceString, currencyCode || currentCurrency);
  };

  const convertPrice = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    return convertCurrency(amount, fromCurrency, toCurrency || currentCurrency);
  };

  const getCurrency = (currencyCode?: string): Currency => {
    const code = currencyCode || currentCurrency;
    return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
  };

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    formatPrice,
    parsePrice,
    convertPrice,
    getCurrency,
    availableCurrencies: CURRENCIES
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

/**
 * Detect currency from user's locale
 */
function detectCurrencyFromLocale(locale: string): string | null {
  const localeMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'en-NZ': 'NZD',
    'de': 'EUR',
    'de-DE': 'EUR',
    'fr': 'EUR',
    'fr-FR': 'EUR',
    'es': 'EUR',
    'es-ES': 'EUR',
    'it': 'EUR',
    'it-IT': 'EUR',
    'nl': 'EUR',
    'nl-NL': 'EUR',
    'pt-BR': 'BRL',
    'ja': 'JPY',
    'ja-JP': 'JPY',
    'ko': 'KRW',
    'ko-KR': 'KRW',
    'zh': 'CNY',
    'zh-CN': 'CNY',
    'zh-HK': 'HKD',
    'sv': 'SEK',
    'sv-SE': 'SEK',
    'no': 'NOK',
    'nb-NO': 'NOK',
    'da': 'DKK',
    'da-DK': 'DKK',
    'pl': 'PLN',
    'pl-PL': 'PLN',
    'cs': 'CZK',
    'cs-CZ': 'CZK',
    'th': 'THB',
    'th-TH': 'THB',
    'hi': 'INR',
    'hi-IN': 'INR',
    'ar-AE': 'AED',
    'ar-SA': 'SAR',
    'af-ZA': 'ZAR',
    'es-MX': 'MXN',
    'es-AR': 'ARS'
  };

  // Try exact match first
  if (localeMap[locale]) {
    return localeMap[locale];
  }

  // Try language code only
  const languageCode = locale.split('-')[0];
  if (localeMap[languageCode]) {
    return localeMap[languageCode];
  }

  return null;
}

export default CurrencyContext;