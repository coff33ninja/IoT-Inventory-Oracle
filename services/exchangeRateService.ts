import DatabaseService from "./databaseService";

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: string;
}

export interface CurrencyRates {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

export class ExchangeRateService {
  private dbService: DatabaseService;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly FIXER_API_KEY = import.meta.env.VITE_FIXER_API_KEY;
  private readonly CURRENCYLAYER_API_KEY = import.meta.env.VITE_CURRENCYLAYER_API_KEY;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initializeDatabase();
    this.validateApiKeys();
  }

  private validateApiKeys(): void {
    if (!this.FIXER_API_KEY && !this.CURRENCYLAYER_API_KEY) {
      console.warn(
        'No exchange rate API keys configured. Currency conversion will use free APIs with limited functionality. ' +
        'For better reliability, configure VITE_FIXER_API_KEY or VITE_CURRENCYLAYER_API_KEY in your .env file.'
      );
    }
  }

  private initializeDatabase() {
    try {
      // Create exchange rates table if it doesn't exist
      this.dbService.executeQuery(`
        CREATE TABLE IF NOT EXISTS exchange_rates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          base_currency TEXT NOT NULL,
          target_currency TEXT NOT NULL,
          rate REAL NOT NULL,
          last_updated TEXT NOT NULL,
          UNIQUE(base_currency, target_currency)
        )
      `);

      // Create daily rates cache table
      this.dbService.executeQuery(`
        CREATE TABLE IF NOT EXISTS daily_rates_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          base_currency TEXT NOT NULL,
          rates_json TEXT NOT NULL,
          last_updated TEXT NOT NULL,
          UNIQUE(base_currency)
        )
      `);
    } catch (error) {
      console.error("Failed to initialize exchange rate database:", error);
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return 1;

    try {
      // Check cache first
      const cachedRate = this.getCachedRate(fromCurrency, toCurrency);
      if (cachedRate && this.isCacheValid(cachedRate.lastUpdated)) {
        return cachedRate.rate;
      }

      // Fetch fresh rate
      const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);

      // Cache the rate
      this.cacheExchangeRate(fromCurrency, toCurrency, rate);

      return rate;
    } catch (error) {
      console.error(
        `Failed to get exchange rate ${fromCurrency} -> ${toCurrency}:`,
        error
      );

      // Fallback to cached rate even if expired
      const cachedRate = this.getCachedRate(fromCurrency, toCurrency);
      if (cachedRate) {
        console.warn(
          `Using expired exchange rate for ${fromCurrency} -> ${toCurrency}`
        );
        return cachedRate.rate;
      }

      // Ultimate fallback
      return 1;
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Get all current rates for a base currency
   */
  async getAllRatesForCurrency(
    baseCurrency: string
  ): Promise<CurrencyRates | null> {
    try {
      // Check cache first
      const cached = this.getCachedDailyRates(baseCurrency);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        return cached;
      }

      // Fetch fresh rates
      const rates = await this.fetchAllRates(baseCurrency);

      // Cache the rates
      this.cacheDailyRates(baseCurrency, rates);

      return rates;
    } catch (error) {
      console.error(`Failed to get rates for ${baseCurrency}:`, error);

      // Return cached rates even if expired
      const cached = this.getCachedDailyRates(baseCurrency);
      if (cached) {
        console.warn(`Using expired rates for ${baseCurrency}`);
        return cached;
      }

      return null;
    }
  }

  /**
   * Update all exchange rates (called daily)
   */
  async updateAllRates(): Promise<void> {
    const commonCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
    ];

    for (const baseCurrency of commonCurrencies) {
      try {
        await this.getAllRatesForCurrency(baseCurrency);
        console.log(`Updated rates for ${baseCurrency}`);
      } catch (error) {
        console.error(`Failed to update rates for ${baseCurrency}:`, error);
      }
    }
  }

  private async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // Try multiple APIs for reliability
    const apis = [
      () => this.fetchFromExchangeRateAPI(fromCurrency, toCurrency),
      () => this.fetchFromFixer(fromCurrency, toCurrency),
      () => this.fetchFromCurrencyLayer(fromCurrency, toCurrency),
    ];

    for (const api of apis) {
      try {
        const rate = await api();
        if (rate && rate > 0) return rate;
      } catch (error) {
        console.warn("Exchange rate API failed, trying next:", error);
      }
    }

    throw new Error(
      `Failed to fetch exchange rate ${fromCurrency} -> ${toCurrency}`
    );
  }

  private async fetchAllRates(baseCurrency: string): Promise<CurrencyRates> {
    // Try exchangerate-api.com first (free tier available)
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return {
        baseCurrency,
        rates: data.rates,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.warn("Primary exchange rate API failed:", error);
    }

    // Fallback to fixer.io (if API key is configured)
    if (this.FIXER_API_KEY) {
      try {
        const response = await fetch(
          `https://api.fixer.io/latest?base=${baseCurrency}&access_key=${this.FIXER_API_KEY}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.success) {
          return {
            baseCurrency,
            rates: data.rates,
            lastUpdated: new Date().toISOString(),
        };
      }
      } catch (error) {
        console.warn("Fixer.io API failed:", error);
      }
    }

    throw new Error(`Failed to fetch rates for ${baseCurrency}`);
  }

  private async fetchFromExchangeRateAPI(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return data.rates[toCurrency];
  }

  private async fetchFromFixer(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (!this.FIXER_API_KEY) {
      throw new Error('Fixer API key not configured');
    }

    const response = await fetch(
      `https://api.fixer.io/latest?base=${fromCurrency}&symbols=${toCurrency}&access_key=${this.FIXER_API_KEY}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.success) {
      return data.rates[toCurrency];
    }
    throw new Error(data.error?.info || "Fixer API error");
  }

  private async fetchFromCurrencyLayer(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (!this.CURRENCYLAYER_API_KEY) {
      throw new Error('CurrencyLayer API key not configured');
    }

    const response = await fetch(
      `http://api.currencylayer.com/live?access_key=${this.CURRENCYLAYER_API_KEY}&currencies=${toCurrency}&source=${fromCurrency}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.success) {
      const key = `${fromCurrency}${toCurrency}`;
      return data.quotes[key];
    }
    throw new Error(data.error?.info || "CurrencyLayer API error");
  }

  private getCachedRate(
    fromCurrency: string,
    toCurrency: string
  ): ExchangeRate | null {
    try {
      const row = this.dbService.getExchangeRate(fromCurrency, toCurrency);

      if (row) {
        return {
          fromCurrency: row.base_currency,
          toCurrency: row.target_currency,
          rate: row.rate,
          lastUpdated: row.last_updated,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get cached rate:", error);
      return null;
    }
  }

  private getCachedDailyRates(baseCurrency: string): CurrencyRates | null {
    try {
      const row = this.dbService.getDailyRatesCache(baseCurrency);

      if (row) {
        return {
          baseCurrency: row.base_currency,
          rates: JSON.parse(row.rates_json),
          lastUpdated: row.last_updated,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get cached daily rates:", error);
      return null;
    }
  }

  private cacheExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number
  ): void {
    try {
      this.dbService.setExchangeRate(fromCurrency, toCurrency, rate);
    } catch (error) {
      console.error("Failed to cache exchange rate:", error);
    }
  }

  private cacheDailyRates(baseCurrency: string, rates: CurrencyRates): void {
    try {
      this.dbService.setDailyRatesCache(
        baseCurrency,
        JSON.stringify(rates.rates),
        rates.lastUpdated
      );
    } catch (error) {
      console.error("Failed to cache daily rates:", error);
    }
  }

  private isCacheValid(lastUpdated: string): boolean {
    const updateTime = new Date(lastUpdated).getTime();
    const now = new Date().getTime();
    return now - updateTime < this.CACHE_DURATION;
  }

  /**
   * Schedule daily updates
   */
  startDailyUpdates(): void {
    // Update immediately
    this.updateAllRates();

    // Schedule daily updates at 2 AM
    const scheduleNextUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0); // 2 AM

      const msUntilUpdate = tomorrow.getTime() - now.getTime();

      setTimeout(() => {
        this.updateAllRates();
        scheduleNextUpdate(); // Schedule next day
      }, msUntilUpdate);
    };

    scheduleNextUpdate();
  }
}
