# Installation & Setup

Get IoT Inventory Oracle up and running on your system in just a few minutes.

## Prerequisites

- **Node.js** (v16 or higher) and **npm** or **yarn**
- **Modern web browser** with ES Modules support
- **Google Gemini API Key** - Get yours at [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Exchange Rate API Key** (Optional) - For currency conversion in market data:
  - **Fixer.io** (Recommended) - [Get free API key](https://fixer.io/) (1000 requests/month free)
  - **CurrencyLayer** (Alternative) - [Get free API key](https://currencylayer.com/) (1000 requests/month free)

## Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/IdeaGazm/IoT-Inventory-Oracle.git
cd IoT-Inventory-Oracle
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# Replace 'your_gemini_api_key_here' with your actual API key
```

### 4. Start the Application

```bash
# Start both API server and React app
npm run dev:full

# Or start them separately:
npm run server  # API server on http://localhost:3001
npm run dev     # React app on http://localhost:3000
```

### 5. Open Your Browser

Navigate to `http://localhost:3000` and start managing your inventory!

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Required: Google Gemini API Key
VITE_API_KEY=your_actual_gemini_api_key_here

# Optional: Exchange Rate API Keys (for currency conversion)
# Choose one of the following:
VITE_FIXER_API_KEY=your_fixer_api_key_here
# VITE_CURRENCYLAYER_API_KEY=your_currencylayer_api_key_here

# Optional: Home Assistant integration (can also be set via Settings UI)
VITE_HOME_ASSISTANT_URL=http://your-home-assistant-ip:8123
VITE_HOME_ASSISTANT_TOKEN=your_long_lived_access_token_here

# Optional: Enable debug logging
VITE_DEBUG=true
```

## Getting Your API Keys

### Gemini API Key (Required)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env` file

### Exchange Rate API Key (Optional)

For currency conversion in market data, choose one of these free services:

#### Option 1: Fixer.io (Recommended)
1. Visit [Fixer.io](https://fixer.io/)
2. Click "Get Free API Key"
3. Sign up for a free account
4. Copy your API key to `VITE_FIXER_API_KEY` in your `.env` file
5. **Free tier**: 1000 requests/month

#### Option 2: CurrencyLayer
1. Visit [CurrencyLayer](https://currencylayer.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy your API key to `VITE_CURRENCYLAYER_API_KEY` in your `.env` file
5. **Free tier**: 1000 requests/month

#### Fallback Option
If no API key is configured, the system will use ExchangeRate-API.com as a fallback (no registration required, but limited functionality).

## Architecture Overview

The application uses a client-server architecture:

- **API Server**: `http://localhost:3001` - Handles database operations
- **React App**: `http://localhost:3000` - User interface
- **CLI Tools**: Direct database access for advanced operations

## Verification

After installation, verify everything is working:

1. **Check the API server**: Visit `http://localhost:3001/health`
2. **Test the React app**: Visit `http://localhost:3000`
3. **Try the CLI**: Run `npm run cli stats`
4. **Test AI features**: Add a component and ask the AI for help

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore` for protection
- Keep your API keys secure and rotate them regularly
- Use environment-specific configurations for different deployments

## Next Steps

- [**Quick Start Guide**](./quick-start.md) - Your first 10 minutes with the app
- [**Configuration**](./configuration.md) - Advanced configuration options
- [**User Guide**](./user-guide.md) - Complete feature overview

## Troubleshooting Installation

### Common Issues

**"VITE_API_KEY environment variable not set" Error**
- Ensure you've created a `.env` file in the root directory
- Verify your API key is correctly set as `VITE_API_KEY=your_key_here`
- Restart both server and client after adding environment variables

**Port Already in Use**
- Check if ports 3000 or 3001 are already in use
- Kill existing processes or change ports in the configuration

**Node.js Version Issues**
- Ensure you're using Node.js v16 or higher
- Use `node --version` to check your current version

**Permission Errors**
- On Linux/Mac, you might need to use `sudo` for global npm installs
- Consider using a Node version manager like `nvm`

For more troubleshooting help, see our [Troubleshooting Guide](./troubleshooting.md).

---

**[← Back to Documentation](./README.md)** | **[Next: Quick Start →](./quick-start.md)**