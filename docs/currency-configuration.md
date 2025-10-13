# Currency Configuration

IoT Inventory Oracle supports multi-currency inventory management with automatic exchange rate conversion for market data and AI-powered component searches.

## Overview

The currency system provides:
- **Global currency preference** set once in Settings
- **Automatic price conversion** for market data
- **AI-aware currency searches** - AI searches for prices in your preferred currency
- **Daily exchange rate updates** with caching for offline use
- **Multiple API providers** for reliability

## Setup

### 1. Choose Your Currency

Set your preferred currency in **Settings → Currency & Localization**:
- Supports 150+ currencies worldwide
- Popular currencies (USD, EUR, GBP, JPY, etc.) are featured
- Search functionality for easy selection

### 2. Configure Exchange Rate API (Optional but Recommended)

For accurate, real-time currency conversion, configure an exchange rate API:

#### Option 1: Fixer.io (Recommended)
```env
VITE_FIXER_API_KEY=your_fixer_api_key_here
```
- **Free tier**: 1000 requests/month
- **Accuracy**: High (European Central Bank data)
- **Reliability**: Excellent uptime
- **Get API key**: [fixer.io](https://fixer.io/)

#### Option 2: CurrencyLayer
```env
VITE_CURRENCYLAYER_API_KEY=your_currencylayer_api_key_here
```
- **Free tier**: 1000 requests/month
- **Accuracy**: High (multiple data sources)
- **Reliability**: Good uptime
- **Get API key**: [currencylayer.com](https://currencylayer.com/)

#### Fallback: ExchangeRate-API.com
If no API key is configured, the system automatically uses ExchangeRate-API.com:
- **No registration required**
- **Limited rate limits**
- **Good for testing and light usage**

## How It Works

### 1. Daily Exchange Rate Updates
- Runs automatically at 2:00 AM daily
- Updates rates for all major currencies
- Caches rates locally for 24 hours
- Graceful fallback to cached rates if APIs are unavailable

### 2. AI Currency Integration
When you search for component information:
1. AI receives your preferred currency setting
2. Searches for prices in your currency
3. Converts any found prices automatically
4. Returns consistent, localized results

### 3. Market Data Conversion
- Component market data is fetched in multiple currencies
- Automatically converted to your preferred currency
- Original prices preserved for reference
- Conversion rates and timestamps displayed

## Supported Currencies

### Popular Currencies
- **USD** - US Dollar
- **EUR** - Euro
- **GBP** - British Pound
- **JPY** - Japanese Yen
- **CAD** - Canadian Dollar
- **AUD** - Australian Dollar
- **CHF** - Swiss Franc
- **CNY** - Chinese Yuan

### Regional Currencies
- **Nordic**: SEK, NOK, DKK
- **European**: PLN, CZK, HUF
- **Asian**: KRW, SGD, HKD, INR
- **Middle East**: AED, SAR, ILS
- **African**: ZAR, NGN, EGP
- **Latin American**: BRL, MXN, ARS

*And 100+ more currencies supported*

## Configuration Examples

### Basic Setup (Gemini AI only)
```env
VITE_API_KEY=your_gemini_api_key_here
```
- Currency conversion uses free fallback API
- Limited to basic exchange rates
- Good for testing and light usage

### Recommended Setup (with Fixer.io)
```env
VITE_API_KEY=your_gemini_api_key_here
VITE_FIXER_API_KEY=your_fixer_api_key_here
```
- Accurate, real-time exchange rates
- 1000 requests/month free tier
- Reliable currency conversion

### Enterprise Setup (multiple APIs)
```env
VITE_API_KEY=your_gemini_api_key_here
VITE_FIXER_API_KEY=your_fixer_api_key_here
VITE_CURRENCYLAYER_API_KEY=your_currencylayer_api_key_here
```
- Maximum reliability with multiple fallbacks
- Higher rate limits
- Best for heavy usage

## Troubleshooting

### Currency Not Converting
1. **Check API key configuration** in `.env` file
2. **Verify API key validity** - test on provider's website
3. **Check rate limits** - free tiers have monthly limits
4. **Review console logs** for API errors

### Outdated Exchange Rates
1. **Check last update time** in component market data
2. **Manually refresh** market data in component details
3. **Verify API connectivity** - check network/firewall
4. **Check API service status** on provider's website

### API Rate Limit Exceeded
1. **Upgrade API plan** for higher limits
2. **Configure multiple APIs** for fallback
3. **Reduce update frequency** (rates cached for 24 hours)
4. **Use free fallback API** temporarily

## Best Practices

### For Personal Use
- Use **Fixer.io free tier** (1000 requests/month)
- Set currency once and leave it
- Let daily updates handle rate refreshes

### For Team/Business Use
- Consider **paid API plans** for higher limits
- Configure **multiple API providers** for redundancy
- Monitor **API usage** and costs
- Set up **monitoring alerts** for API failures

### For Development
- Use **free fallback API** for testing
- Configure **proper API keys** for production
- Test **currency conversion** with different currencies
- Verify **rate limiting** behavior

## Security Notes

- **Never commit API keys** to version control
- **Rotate API keys** regularly
- **Monitor API usage** for unexpected spikes
- **Use environment variables** for configuration
- **Restrict API key permissions** when possible

## API Provider Comparison

| Provider | Free Tier | Accuracy | Reliability | Setup |
|----------|-----------|----------|-------------|-------|
| **Fixer.io** | 1000/month | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Easy |
| **CurrencyLayer** | 1000/month | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Easy |
| **ExchangeRate-API** | Limited | ⭐⭐⭐⭐ | ⭐⭐⭐ | None |

## Related Documentation

- [Installation Guide](./installation.md) - Basic setup instructions
- [Configuration Guide](./configuration.md) - General configuration options
- [User Guide](./user-guide.md) - Using currency features in the UI
- [API Reference](./api-reference.md) - Technical API documentation