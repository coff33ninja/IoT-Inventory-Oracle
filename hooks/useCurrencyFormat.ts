import { useCurrency } from '../contexts/CurrencyContext';

/**
 * Custom hook for currency formatting utilities
 * Provides convenient methods for formatting prices throughout the app
 */
export const useCurrencyFormat = () => {
  const { formatPrice, parsePrice, convertPrice, currentCurrency, getCurrency } = useCurrency();

  /**
   * Format a price with the current currency
   */
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return formatPrice(0);
    }
    return formatPrice(amount);
  };

  /**
   * Format a price range
   */
  const formatPriceRange = (min: number, max: number): string => {
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  /**
   * Format price with fallback text
   */
  const formatPriceWithFallback = (amount: number | undefined | null, fallback: string = 'Price not available'): string => {
    if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
      return fallback;
    }
    return formatPrice(amount);
  };

  /**
   * Get currency symbol for display
   */
  const getCurrencySymbol = (): string => {
    return getCurrency().symbol;
  };

  /**
   * Get currency code for display
   */
  const getCurrencyCode = (): string => {
    return currentCurrency;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  };

  /**
   * Format large numbers with appropriate suffixes
   */
  const formatLargeNumber = (amount: number): string => {
    if (amount >= 1000000) {
      return formatPrice(amount / 1000000) + 'M';
    } else if (amount >= 1000) {
      return formatPrice(amount / 1000) + 'K';
    }
    return formatPrice(amount);
  };

  return {
    formatCurrency,
    formatPrice,
    formatPriceRange,
    formatPriceWithFallback,
    formatPercentage,
    formatLargeNumber,
    parsePrice,
    convertPrice,
    getCurrencySymbol,
    getCurrencyCode,
    currentCurrency
  };
};

export default useCurrencyFormat;