import React, { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { CURRENCY_GROUPS, getCurrencyDisplayName, POPULAR_CURRENCIES } from '../constants/currencies';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface CurrencySelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  className = '', 
  showLabel = true,
  compact = false 
}) => {
  const { currentCurrency, setCurrency, getCurrency, availableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const currentCurrencyInfo = getCurrency();

  const filteredCurrencies = Object.keys(availableCurrencies).filter(code => {
    const currency = availableCurrencies[code];
    const searchLower = searchTerm.toLowerCase();
    return (
      currency.code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower)
    );
  });

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrency(currencyCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <span>{currentCurrencyInfo.flag}</span>
          <span className="font-medium">{currentCurrency}</span>
          <ChevronDownIcon className="h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {/* Popular currencies first */}
              {searchTerm === '' && (
                <div className="p-2 border-b">
                  <div className="text-xs font-medium text-gray-500 mb-1">Popular</div>
                  {POPULAR_CURRENCIES.map(code => (
                    <button
                      key={code}
                      onClick={() => handleCurrencySelect(code)}
                      className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center space-x-2 ${
                        code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <span>{availableCurrencies[code].flag}</span>
                      <span className="font-medium">{code}</span>
                      <span className="text-gray-500">{availableCurrencies[code].name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* All currencies */}
              <div className="p-2">
                {filteredCurrencies.map(code => (
                  <button
                    key={code}
                    onClick={() => handleCurrencySelect(code)}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center space-x-2 ${
                      code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <span>{availableCurrencies[code].flag}</span>
                    <span className="font-medium">{code}</span>
                    <span className="text-gray-500 truncate">{availableCurrencies[code].name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700">
          Currency
        </label>
      )}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentCurrencyInfo.flag}</span>
            <span className="font-medium">{currentCurrency}</span>
            <span className="text-gray-500">- {currentCurrencyInfo.name}</span>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* Search */}
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-80 overflow-y-auto">
              {searchTerm === '' ? (
                // Show grouped currencies when not searching
                Object.entries(CURRENCY_GROUPS).map(([groupName, currencies]) => (
                  <div key={groupName} className="p-3 border-b last:border-b-0">
                    <div className="text-sm font-medium text-gray-500 mb-2">{groupName}</div>
                    <div className="space-y-1">
                      {currencies.map(code => (
                        <button
                          key={code}
                          onClick={() => handleCurrencySelect(code)}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center space-x-3 ${
                            code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          <span className="text-lg">{availableCurrencies[code].flag}</span>
                          <div className="flex-1">
                            <div className="font-medium">{code}</div>
                            <div className="text-sm text-gray-500">{availableCurrencies[code].name}</div>
                          </div>
                          <div className="text-sm text-gray-400">{availableCurrencies[code].symbol}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Show filtered results when searching
                <div className="p-3">
                  {filteredCurrencies.length > 0 ? (
                    <div className="space-y-1">
                      {filteredCurrencies.map(code => (
                        <button
                          key={code}
                          onClick={() => handleCurrencySelect(code)}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center space-x-3 ${
                            code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          <span className="text-lg">{availableCurrencies[code].flag}</span>
                          <div className="flex-1">
                            <div className="font-medium">{code}</div>
                            <div className="text-sm text-gray-500">{availableCurrencies[code].name}</div>
                          </div>
                          <div className="text-sm text-gray-400">{availableCurrencies[code].symbol}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No currencies found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CurrencySelector;