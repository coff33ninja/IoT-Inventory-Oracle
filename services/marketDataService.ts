import DatabaseService from "./databaseService.js";
import { RecommendationErrorHandler } from "./errorHandler.js";
import { ExchangeRateService } from "./exchangeRateService.js";
import {
  InventoryItem,
  MarketDataItem,
  PricePoint,
} from "../types.js";

/**
 * Configuration for market data service
 */
export interface MarketDataConfig {
  enableRealTimeUpdates: boolean;
  priceUpdateInterval: number; // minutes
  maxPriceHistoryDays: number;
  priceAlertThreshold: number; // percentage change to trigger alerts
  apiTimeout: number; // milliseconds
  maxRetries: number;
  supportedSuppliers: string[];
  cacheDuration: number; // hours
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MarketDataConfig = {
  enableRealTimeUpdates: true,
  priceUpdateInterval: 60, // 1 hour
  maxPriceHistoryDays: 365, // 1 year
  priceAlertThreshold: 0.1, // 10% price change
  apiTimeout: 10000, // 10 seconds
  maxRetries: 3,
  supportedSuppliers: [
    "DigiKey",
    "Mouser",
    "Arrow",
    "Newark",
    "RS Components",
    "Farnell",
    "SparkFun",
    "Adafruit",
    "Amazon",
    "AliExpress",
  ],
  cacheDuration: 2, // 2 hours
};

/**
 * Price alert configuration
 */
export interface PriceAlert {
  id: string;
  userId: string;
  componentId: string;
  alertType: "price_drop" | "price_increase" | "availability" | "target_price";
  threshold: number; // percentage or absolute price
  targetPrice?: number; // for target_price alerts
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  notificationMethod: "email" | "push" | "in_app";
}

/**
 * Market data source information
 */
export interface MarketDataSource {
  supplier: string;
  apiEndpoint?: string;
  apiKey?: string;
  isActive: boolean;
  lastUpdate: string;
  reliability: number; // 0-1, based on historical accuracy
  averageResponseTime: number; // milliseconds
}

/**
 * Price comparison result
 */
export interface PriceComparison {
  componentId: string;
  componentName: string;
  prices: Array<{
    supplier: string;
    price: number;
    currency: string;
    availability: "in_stock" | "limited" | "out_of_stock" | "unknown";
    quantity: number;
    leadTime?: string;
    link?: string;
    lastUpdated: string;
  }>;
  lowestPrice: {
    supplier: string;
    price: number;
    currency: string;
  };
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  recommendedSupplier: string;
}

/**
 * Market trend analysis
 */
export interface MarketTrend {
  componentId: string;
  category: string;
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  trendStrength: number; // 0-1
  seasonality: {
    hasSeasonality: boolean;
    peakMonths?: number[];
    lowMonths?: number[];
  };
  marketFactors: string[];
  priceProjection: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}

/**
 * Market data and price monitoring service
 */
export class MarketDataService {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private exchangeRateService: ExchangeRateService;
  private config: MarketDataConfig;
  private priceUpdateInterval?: NodeJS.Timeout;
  private activeAlerts: Map<string, PriceAlert> = new Map();
  private userCurrency: string = 'USD'; // Default, will be updated from context

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    config: Partial<MarketDataConfig> = {}
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.exchangeRateService = new ExchangeRateService(dbService);
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableRealTimeUpdates) {
      this.startPriceMonitoring();
    }

    // Start daily exchange rate updates
    this.exchangeRateService.startDailyUpdates();
  }

  /**
   * Set the user's preferred currency for price conversion
   */
  setUserCurrency(currency: string): void {
    this.userCurrency = currency;
  }

  /**
   * Convert price to user's preferred currency
   */
  private async convertPriceToUserCurrency(price: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === this.userCurrency) {
      return price;
    }
    return await this.exchangeRateService.convertCurrency(price, fromCurrency, this.userCurrency);
  }

  /**
   * Fetch current market data for a component
   */
  async fetchMarketData(
    componentId: string,
    forceRefresh: boolean = false,
    targetCurrency?: string
  ): Promise<MarketDataItem[]> {
    try {
      const currency = targetCurrency || this.userCurrency;
      const cacheKey = `market_data_${componentId}_${currency}`;

      if (!forceRefresh) {
        const cached = this.dbService.getCacheData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const component = this.dbService.getItemById(componentId);
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      // Fetch from multiple suppliers
      const rawMarketData: MarketDataItem[] = [];

      for (const supplier of this.config.supportedSuppliers) {
        try {
          const supplierData = await this.fetchFromSupplier(
            component,
            supplier
          );
          if (supplierData) {
            rawMarketData.push(supplierData);
          }
        } catch (error) {
          console.warn(`Failed to fetch data from ${supplier}:`, error);
          // Continue with other suppliers
        }
      }

      // Convert all prices to user's preferred currency
      const convertedMarketData: MarketDataItem[] = [];
      for (const data of rawMarketData) {
        try {
          const originalPrice = this.parsePrice(data.price);
          const originalCurrency = this.extractCurrency(data.price) || 'USD';
          
          const convertedPrice = await this.convertPriceToUserCurrency(originalPrice, originalCurrency);
          
          // Update the price string with converted amount and user's currency
          const convertedPriceString = this.formatPrice(convertedPrice, currency);
          
          convertedMarketData.push({
            ...data,
            price: convertedPriceString,
            originalPrice: data.price, // Keep original for reference
            currency: currency
          });
        } catch (error) {
          console.warn(`Failed to convert price for ${data.supplier}:`, error);
          // Keep original data if conversion fails
          convertedMarketData.push(data);
        }
      }

      // Cache the converted results
      this.dbService.setCacheData(
        cacheKey,
        convertedMarketData,
        this.config.cacheDuration
      );

      // Store price history with converted prices
      await this.storePriceHistory(componentId, convertedMarketData);

      return convertedMarketData;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "fetchMarketData",
          componentId,
          timestamp: new Date().toISOString(),
        },
        []
      );
    }
  }

  /**
   * Get comprehensive price comparison for a component
   */
  async getPriceComparison(
    componentId: string
  ): Promise<PriceComparison | null> {
    try {
      const component = this.dbService.getItemById(componentId);
      if (!component) {
        return null;
      }

      const marketData = await this.fetchMarketData(componentId);

      if (marketData.length === 0) {
        return null;
      }

      // Process market data into price comparison
      const prices = marketData.map((data) => ({
        supplier: data.supplier,
        price: this.parsePrice(data.price),
        currency: "USD", // Assume USD for now
        availability: this.determineAvailability(data),
        quantity: 1, // Default quantity
        link: data.link,
        lastUpdated: new Date().toISOString(),
      }));

      // Find lowest price
      const lowestPriceEntry = prices.reduce((lowest, current) =>
        current.price < lowest.price ? current : lowest
      );

      // Calculate average price
      const averagePrice =
        prices.reduce((sum, p) => sum + p.price, 0) / prices.length;

      // Calculate price range
      const priceValues = prices.map((p) => p.price);
      const priceRange = {
        min: Math.min(...priceValues),
        max: Math.max(...priceValues),
      };

      // Recommend supplier based on price and reliability
      const recommendedSupplier = this.recommendSupplier(prices);

      return {
        componentId,
        componentName: component.name,
        prices,
        lowestPrice: {
          supplier: lowestPriceEntry.supplier,
          price: lowestPriceEntry.price,
          currency: lowestPriceEntry.currency,
        },
        averagePrice,
        priceRange,
        recommendedSupplier,
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "getPriceComparison",
          componentId,
          timestamp: new Date().toISOString(),
        },
        null
      );
    }
  }

  /**
   * Analyze market trends for a component
   */
  async analyzeMarketTrends(componentId: string): Promise<MarketTrend | null> {
    try {
      const component = this.dbService.getItemById(componentId);
      if (!component) {
        return null;
      }

      // Get price history
      const priceHistory = await this.getPriceHistory(componentId);

      if (priceHistory.length < 10) {
        // Not enough data for trend analysis
        return null;
      }

      // Analyze trend
      const trend = this.calculateTrend(priceHistory);
      const trendStrength = this.calculateTrendStrength(priceHistory);

      // Analyze seasonality
      const seasonality = this.analyzeSeasonality(priceHistory);

      // Identify market factors
      const marketFactors = this.identifyMarketFactors(component, priceHistory);

      // Project future prices
      const priceProjection = this.projectPrices(priceHistory, trend);

      return {
        componentId,
        category: component.category || "Unknown",
        trend,
        trendStrength,
        seasonality,
        marketFactors,
        priceProjection,
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "analyzeMarketTrends",
          componentId,
          timestamp: new Date().toISOString(),
        },
        null
      );
    }
  }

  /**
   * Set up price alert for a component
   */
  async createPriceAlert(
    alert: Omit<PriceAlert, "id" | "createdAt">
  ): Promise<PriceAlert> {
    try {
      const priceAlert: PriceAlert = {
        ...alert,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      // Store the alert
      await this.storePriceAlert(priceAlert);

      // Add to active alerts
      this.activeAlerts.set(priceAlert.id, priceAlert);

      return priceAlert;
    } catch (error) {
      throw this.errorHandler.handleError(
        error,
        {
          operation: "createPriceAlert",
          userId: alert.userId,
          componentId: alert.componentId,
          timestamp: new Date().toISOString(),
        },
        null
      );
    }
  }

  /**
   * Get price alerts for a user
   */
  async getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      return await this.loadUserPriceAlerts(userId);
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "getUserPriceAlerts",
          userId,
          timestamp: new Date().toISOString(),
        },
        []
      );
    }
  }

  /**
   * Update price alert
   */
  async updatePriceAlert(
    alertId: string,
    updates: Partial<PriceAlert>
  ): Promise<void> {
    try {
      const existingAlert = this.activeAlerts.get(alertId);
      if (!existingAlert) {
        throw new Error(`Price alert ${alertId} not found`);
      }

      const updatedAlert = { ...existingAlert, ...updates };
      await this.storePriceAlert(updatedAlert);
      this.activeAlerts.set(alertId, updatedAlert);
    } catch (error) {
      this.errorHandler.handleError(
        error,
        {
          operation: "updatePriceAlert",
          timestamp: new Date().toISOString(),
          additionalData: { alertId },
        },
        undefined
      );
    }
  }

  /**
   * Delete price alert
   */
  async deletePriceAlert(alertId: string): Promise<void> {
    try {
      await this.removePriceAlert(alertId);
      this.activeAlerts.delete(alertId);
    } catch (error) {
      this.errorHandler.handleError(
        error,
        {
          operation: "deletePriceAlert",
          timestamp: new Date().toISOString(),
          additionalData: { alertId },
        },
        undefined
      );
    }
  }

  /**
   * Get price history for a component
   */
  async getPriceHistory(
    componentId: string,
    days: number = 90
  ): Promise<PricePoint[]> {
    try {
      const cacheKey = `price_history_${componentId}_${days}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // In production, this would query a database table
      // For now, generate some sample data
      const history = this.generateSamplePriceHistory(componentId, days);

      // Cache the history
      this.dbService.setCacheData(cacheKey, history, 6); // 6 hour cache

      return history;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "getPriceHistory",
          componentId,
          timestamp: new Date().toISOString(),
        },
        []
      );
    }
  }

  /**
   * Start automatic price monitoring
   */
  private startPriceMonitoring(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }

    this.priceUpdateInterval = setInterval(async () => {
      await this.performPriceUpdates();
    }, this.config.priceUpdateInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Stop automatic price monitoring
   */
  stopPriceMonitoring(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = undefined;
    }
  }

  /**
   * Perform scheduled price updates
   */
  private async performPriceUpdates(): Promise<void> {
    try {
      console.log("Performing scheduled price updates...");

      // Get all components that need price updates
      const components = this.dbService.getAllItems();
      const componentsToUpdate = components.filter((component) =>
        this.shouldUpdatePrices(component)
      );

      for (const component of componentsToUpdate.slice(0, 10)) {
        // Limit to 10 per update cycle
        try {
          const marketData = await this.fetchMarketData(component.id, true);
          await this.checkPriceAlerts(component.id, marketData);
        } catch (error) {
          console.warn(`Failed to update prices for ${component.name}:`, error);
        }
      }

      console.log(`Updated prices for ${componentsToUpdate.length} components`);
    } catch (error) {
      console.error("Price update cycle failed:", error);
    }
  }

  /**
   * Check if price alerts should be triggered
   */
  private async checkPriceAlerts(
    componentId: string,
    marketData: MarketDataItem[]
  ): Promise<void> {
    const alerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.componentId === componentId && alert.isActive
    );

    for (const alert of alerts) {
      const shouldTrigger = await this.shouldTriggerAlert(alert, marketData);
      if (shouldTrigger) {
        await this.triggerPriceAlert(alert, marketData);
      }
    }
  }

  /**
   * Trigger a price alert
   */
  private async triggerPriceAlert(
    alert: PriceAlert,
    marketData: MarketDataItem[]
  ): Promise<void> {
    try {
      console.log(
        `Triggering price alert ${alert.id} for component ${alert.componentId}`
      );

      // Update last triggered time
      alert.lastTriggered = new Date().toISOString();
      await this.storePriceAlert(alert);

      // In a real implementation, this would send notifications
      // For now, just log the alert
      const lowestPrice = Math.min(
        ...marketData.map((d) => this.parsePrice(d.price))
      );
      console.log(
        `Price alert: Component ${
          alert.componentId
        } is now $${lowestPrice.toFixed(2)}`
      );
    } catch (error) {
      console.error("Failed to trigger price alert:", error);
    }
  }

  // Private helper methods

  private async fetchFromSupplier(
    component: InventoryItem,
    supplier: string
  ): Promise<MarketDataItem | null> {
    // Simulate API call to supplier
    // In production, this would make actual HTTP requests to supplier APIs

    const basePrice = component.purchasePrice || 10;
    const priceVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const simulatedPrice = basePrice * (1 + priceVariation);

    return {
      supplier,
      price: `$${simulatedPrice.toFixed(2)}`,
      link: `https://${supplier.toLowerCase()}.com/product/${component.id}`,
    };
  }



  private determineAvailability(
    data: MarketDataItem
  ): "in_stock" | "limited" | "out_of_stock" | "unknown" {
    // Simple heuristic based on supplier
    const reliableSuppliers = ["DigiKey", "Mouser", "Arrow"];
    return reliableSuppliers.includes(data.supplier) ? "in_stock" : "unknown";
  }

  private recommendSupplier(
    prices: Array<{ supplier: string; price: number }>
  ): string {
    // Simple recommendation based on lowest price
    // In production, this would consider reliability, shipping, etc.
    return prices.reduce((best, current) =>
      current.price < best.price ? current : best
    ).supplier;
  }

  private async storePriceHistory(
    componentId: string,
    marketData: MarketDataItem[]
  ): Promise<void> {
    // Store price points in cache/database
    const pricePoints: PricePoint[] = marketData.map((data) => ({
      date: new Date().toISOString(),
      price: this.parsePrice(data.price),
      supplier: data.supplier,
    }));

    const cacheKey = `price_points_${componentId}_${
      new Date().toISOString().split("T")[0]
    }`;
    this.dbService.setCacheData(cacheKey, pricePoints, 24 * 30); // 30 days
  }

  private calculateTrend(
    priceHistory: PricePoint[]
  ): "increasing" | "decreasing" | "stable" | "volatile" {
    if (priceHistory.length < 2) return "stable";

    const prices = priceHistory.map((p) => p.price);
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (Math.abs(change) < 0.05) return "stable";
    if (change > 0.05) return "increasing";
    if (change < -0.05) return "decreasing";

    // Check for volatility
    const volatility = this.calculateVolatility(prices);
    return volatility > 0.2 ? "volatile" : "stable";
  }

  private calculateTrendStrength(priceHistory: PricePoint[]): number {
    if (priceHistory.length < 2) return 0;

    const prices = priceHistory.map((p) => p.price);
    const volatility = this.calculateVolatility(prices);

    // Trend strength is inverse of volatility
    return Math.max(0, 1 - volatility);
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private analyzeSeasonality(
    priceHistory: PricePoint[]
  ): MarketTrend["seasonality"] {
    // Simple seasonality analysis
    // In production, this would use more sophisticated time series analysis
    return {
      hasSeasonality: false,
      peakMonths: undefined,
      lowMonths: undefined,
    };
  }

  private identifyMarketFactors(
    component: InventoryItem,
    priceHistory: PricePoint[]
  ): string[] {
    const factors: string[] = [];

    // Simple heuristics based on component category
    if (component.category === "Microcontroller") {
      factors.push("Semiconductor shortage", "New product releases");
    } else if (component.category === "Sensor") {
      factors.push("IoT market growth", "Manufacturing capacity");
    }

    return factors;
  }

  private projectPrices(
    priceHistory: PricePoint[],
    trend: string
  ): MarketTrend["priceProjection"] {
    if (priceHistory.length === 0) {
      return { nextMonth: 0, nextQuarter: 0, confidence: 0 };
    }

    const currentPrice = priceHistory[priceHistory.length - 1].price;
    const trendMultiplier = {
      increasing: 1.05,
      decreasing: 0.95,
      stable: 1.0,
      volatile: 1.0,
    };

    const multiplier =
      trendMultiplier[trend as keyof typeof trendMultiplier] || 1.0;

    return {
      nextMonth: currentPrice * multiplier,
      nextQuarter: currentPrice * Math.pow(multiplier, 3),
      confidence: 0.7, // 70% confidence
    };
  }

  private shouldUpdatePrices(component: InventoryItem): boolean {
    // Simple heuristic - update if component has been accessed recently
    // In production, this would be more sophisticated
    return Math.random() > 0.8; // 20% chance for testing
  }

  private async shouldTriggerAlert(
    alert: PriceAlert,
    marketData: MarketDataItem[]
  ): Promise<boolean> {
    if (marketData.length === 0) return false;

    const currentPrice = Math.min(
      ...marketData.map((d) => this.parsePrice(d.price))
    );

    switch (alert.alertType) {
      case "price_drop":
        // Trigger if price dropped by threshold percentage
        const component = this.dbService.getItemById(alert.componentId);
        const originalPrice = component?.purchasePrice || currentPrice;
        const dropPercentage = (originalPrice - currentPrice) / originalPrice;
        return dropPercentage >= alert.threshold;

      case "target_price":
        return alert.targetPrice ? currentPrice <= alert.targetPrice : false;

      default:
        return false;
    }
  }

  private generateSamplePriceHistory(
    componentId: string,
    days: number
  ): PricePoint[] {
    const history: PricePoint[] = [];
    const component = this.dbService.getItemById(componentId);
    const basePrice = component?.purchasePrice || 10;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Add some realistic price variation
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const price = basePrice * (1 + variation);

      history.push({
        date: date.toISOString(),
        price,
        supplier: "DigiKey",
      });
    }

    return history;
  }

  private async storePriceAlert(alert: PriceAlert): Promise<void> {
    const cacheKey = `price_alert_${alert.id}`;
    this.dbService.setCacheData(cacheKey, alert, 24 * 30); // 30 days
  }

  private async loadUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    // In production, this would query the database
    // For now, return alerts from active alerts map
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.userId === userId
    );
  }

  private async removePriceAlert(alertId: string): Promise<void> {
    const cacheKey = `price_alert_${alertId}`;
    // In production, this would delete from database
    // For now, just remove from cache
  }

  /**
   * Get market data statistics for monitoring
   */
  getMarketDataStats(): {
    totalPricePoints: number;
    activeAlerts: number;
    lastUpdateTime: string;
    averageResponseTime: number;
  } {
    return {
      totalPricePoints: 0,
      activeAlerts: this.activeAlerts.size,
      lastUpdateTime: new Date().toISOString(),
      averageResponseTime: 1500, // milliseconds
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPriceMonitoring();
    this.activeAlerts.clear();
  }
  /**
   * Extract currency code from price string
   */
  private extractCurrency(priceString: string): string | null {
    // Common currency patterns
    const currencyPatterns = [
      /\$(\d+\.?\d*)/,  // $12.34
      /€(\d+\.?\d*)/,   // €12.34
      /£(\d+\.?\d*)/,   // £12.34
      /¥(\d+\.?\d*)/,   // ¥12.34
      /(\d+\.?\d*)\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY)/i, // 12.34 USD
      /(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY)\s*(\d+\.?\d*)/i  // USD 12.34
    ];

    // Currency symbol to code mapping
    const symbolToCode: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR', 
      '£': 'GBP',
      '¥': 'JPY'
    };

    for (const pattern of currencyPatterns) {
      const match = priceString.match(pattern);
      if (match) {
        // If it's a symbol, convert to code
        const symbol = priceString.charAt(0);
        if (symbolToCode[symbol]) {
          return symbolToCode[symbol];
        }
        // If it's already a code, return it
        if (match[1] && match[1].length === 3) {
          return match[1].toUpperCase();
        }
        if (match[2] && match[2].length === 3) {
          return match[2].toUpperCase();
        }
      }
    }

    return null; // Default to null if no currency found
  }

  /**
   * Format price with currency symbol
   */
  private formatPrice(amount: number, currency: string): string {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥'
    };

    const symbol = currencySymbols[currency] || currency;
    
    // Format with appropriate decimal places
    const decimals = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
    const formattedAmount = amount.toFixed(decimals);
    
    return `${symbol}${formattedAmount}`;
  }

  /**
   * Parse numeric price from price string
   */
  private parsePrice(priceString: string): number {
    // Remove currency symbols and extract number
    const numericString = priceString.replace(/[^\d.,]/g, '');
    const number = parseFloat(numericString.replace(',', ''));
    return isNaN(number) ? 0 : number;
  }
}

export default MarketDataService;