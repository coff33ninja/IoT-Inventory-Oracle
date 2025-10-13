import { MarketDataService } from './marketDataService';
import { ExchangeRateService } from './exchangeRateService';
import DatabaseService from './databaseService';
import { RecommendationErrorHandler } from './errorHandler';

/**
 * Service manager that coordinates currency-aware services
 */
export class CurrencyAwareServiceManager {
  private marketDataService: MarketDataService;
  private exchangeRateService: ExchangeRateService;
  private currentUserCurrency: string = 'USD';

  constructor(dbService: DatabaseService, errorHandler: RecommendationErrorHandler) {
    this.exchangeRateService = new ExchangeRateService(dbService);
    this.marketDataService = new MarketDataService(dbService, errorHandler);
    
    // Start daily exchange rate updates
    this.exchangeRateService.startDailyUpdates();
  }

  /**
   * Update the user's preferred currency across all services
   */
  setUserCurrency(currency: string): void {
    this.currentUserCurrency = currency;
    this.marketDataService.setUserCurrency(currency);
  }

  /**
   * Get the market data service instance
   */
  getMarketDataService(): MarketDataService {
    return this.marketDataService;
  }

  /**
   * Get the exchange rate service instance
   */
  getExchangeRateService(): ExchangeRateService {
    return this.exchangeRateService;
  }

  /**
   * Get current user currency
   */
  getCurrentUserCurrency(): string {
    return this.currentUserCurrency;
  }

  /**
   * Convert price between currencies
   */
  async convertPrice(amount: number, fromCurrency: string, toCurrency?: string): Promise<number> {
    const targetCurrency = toCurrency || this.currentUserCurrency;
    return await this.exchangeRateService.convertCurrency(amount, fromCurrency, targetCurrency);
  }

  /**
   * Get exchange rate between currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency?: string): Promise<number> {
    const targetCurrency = toCurrency || this.currentUserCurrency;
    return await this.exchangeRateService.getExchangeRate(fromCurrency, targetCurrency);
  }

  /**
   * Fetch market data in user's preferred currency
   */
  async fetchMarketDataInUserCurrency(componentId: string, forceRefresh: boolean = false) {
    return await this.marketDataService.fetchMarketData(componentId, forceRefresh, this.currentUserCurrency);
  }
}

// Singleton instance
let serviceManager: CurrencyAwareServiceManager | null = null;

/**
 * Get or create the currency-aware service manager
 */
export function getCurrencyAwareServiceManager(
  dbService?: DatabaseService, 
  errorHandler?: RecommendationErrorHandler
): CurrencyAwareServiceManager {
  if (!serviceManager && dbService && errorHandler) {
    serviceManager = new CurrencyAwareServiceManager(dbService, errorHandler);
  }
  
  if (!serviceManager) {
    throw new Error('CurrencyAwareServiceManager not initialized. Call with dbService and errorHandler first.');
  }
  
  return serviceManager;
}

/**
 * Initialize the service manager with required dependencies
 */
export function initializeCurrencyServices(
  dbService: DatabaseService, 
  errorHandler: RecommendationErrorHandler
): CurrencyAwareServiceManager {
  serviceManager = new CurrencyAwareServiceManager(dbService, errorHandler);
  return serviceManager;
}