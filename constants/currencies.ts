/**
 * Comprehensive currency configuration for the IoT Inventory Oracle
 * Supports multiple currencies with proper formatting and conversion
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  flag?: string; // Unicode flag emoji
}

export const CURRENCIES: Record<string, Currency> = {
  // Major World Currencies
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇬🇧'
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇯🇵'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇨🇦'
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇦🇺'
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
    flag: '🇨🇭'
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇨🇳'
  },
  
  // European Currencies
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    flag: '🇸🇪'
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    flag: '🇳🇴'
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    flag: '🇩🇰'
  },
  PLN: {
    code: 'PLN',
    name: 'Polish Złoty',
    symbol: 'zł',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    flag: '🇵🇱'
  },
  CZK: {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    flag: '🇨🇿'
  },
  
  // Asian Currencies
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇰🇷'
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇸🇬'
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇭🇰'
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇮🇳'
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇹🇭'
  },
  
  // Other Americas
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    flag: '🇧🇷'
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇲🇽'
  },
  ARS: {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    flag: '🇦🇷'
  },
  
  // Middle East & Africa
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇦🇪'
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: '﷼',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇸🇦'
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: '.',
    flag: '🇿🇦'
  },
  
  // Oceania
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇳🇿'
  },
  
  // Cryptocurrencies (for tech-savvy users)
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    symbolPosition: 'before',
    decimalPlaces: 8,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '₿'
  },
  ETH: {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    symbolPosition: 'before',
    decimalPlaces: 6,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: 'Ξ'
  }
};

// Popular currencies for quick selection
export const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

// Default currency
export const DEFAULT_CURRENCY = 'USD';

// Currency groups for organized display
export const CURRENCY_GROUPS = {
  'Major Currencies': ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'],
  'European': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK'],
  'Asian': ['JPY', 'CNY', 'KRW', 'SGD', 'HKD', 'INR', 'THB'],
  'Americas': ['USD', 'CAD', 'BRL', 'MXN', 'ARS'],
  'Middle East & Africa': ['AED', 'SAR', 'ZAR'],
  'Oceania': ['AUD', 'NZD'],
  'Cryptocurrency': ['BTC', 'ETH']
};

/**
 * Format a number as currency using the specified currency configuration
 */
export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    console.warn(`Currency ${currencyCode} not found, using default`);
    return formatCurrency(amount, DEFAULT_CURRENCY);
  }
  
  // Handle special cases for zero or very small amounts
  if (amount === 0) {
    return currency.symbolPosition === 'before' 
      ? `${currency.symbol}0` 
      : `0 ${currency.symbol}`;
  }
  
  // Format the number with proper decimal places
  const formattedNumber = amount.toFixed(currency.decimalPlaces);
  const [integerPart, decimalPart] = formattedNumber.split('.');
  
  // Add thousands separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  
  // Combine integer and decimal parts
  let result = formattedInteger;
  if (currency.decimalPlaces > 0 && decimalPart) {
    result += currency.decimalSeparator + decimalPart;
  }
  
  // Add currency symbol
  return currency.symbolPosition === 'before' 
    ? `${currency.symbol}${result}` 
    : `${result} ${currency.symbol}`;
}

/**
 * Parse a currency string back to a number
 */
export function parseCurrency(currencyString: string, currencyCode: string = DEFAULT_CURRENCY): number {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    return 0;
  }
  
  // Remove currency symbol and clean the string
  let cleanString = currencyString.replace(currency.symbol, '').trim();
  
  // Replace thousands separators and decimal separators
  cleanString = cleanString.replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '');
  cleanString = cleanString.replace(currency.decimalSeparator, '.');
  
  return parseFloat(cleanString) || 0;
}

/**
 * Get currency display name with flag
 */
export function getCurrencyDisplayName(currencyCode: string): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return currencyCode;
  
  return `${currency.flag || ''} ${currency.code} - ${currency.name}`.trim();
}

/**
 * Convert between currencies (simplified - in production, use real exchange rates)
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // This is a simplified conversion for demo purposes
  // In production, you would use real-time exchange rates from an API
  const exchangeRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    CNY: 6.45,
    // Add more rates as needed
  };
  
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export default CURRENCIES;