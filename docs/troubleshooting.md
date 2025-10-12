# Troubleshooting Guide

Comprehensive solutions for common issues and problems you might encounter while using IoT Inventory Oracle.

## Quick Diagnostics

### System Health Check

**Check Application Status:**
1. **API Server**: Visit `http://localhost:3001/health`
2. **React App**: Visit `http://localhost:3000`
3. **Database**: Run `npm run cli stats`
4. **AI Service**: Try a simple chat command

**Expected Results:**
- ✅ API Health: `{"status": "healthy"}`
- ✅ React App: Application loads normally
- ✅ Database: Shows inventory statistics
- ✅ AI Service: Responds to chat messages

## Installation and Setup Issues

### Environment Configuration

**"VITE_API_KEY environment variable not set" Error**

**Symptoms:**
- Error message on startup
- AI features not working
- Chat responses fail

**Solutions:**
1. **Create `.env` file** in root directory:
   ```env
   VITE_API_KEY=your_actual_gemini_api_key_here
   ```
2. **Verify file location**: Must be in project root, not in subdirectory
3. **Check for typos**: Ensure `VITE_API_KEY` is spelled correctly
4. **No quotes needed**: Don't wrap the API key in quotes
5. **Restart both services** after adding the key

**Verification:**
```bash
# Check if .env file exists and has content
cat .env

# Restart services
npm run dev:full
```

### Port Conflicts

**"Port already in use" Errors**

**Symptoms:**
- Cannot start server on port 3001
- Cannot start React app on port 3000
- EADDRINUSE errors

**Solutions:**
1. **Find processes using ports:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # macOS/Linux
   lsof -i :3000
   lsof -i :3001
   ```

2. **Kill conflicting processes:**
   ```bash
   # Windows
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   kill -9 <process_id>
   ```

3. **Use different ports:**
   ```bash
   # Start on different ports
   PORT=3002 npm run dev
   API_PORT=3003 npm run server
   ```

### Node.js and Dependencies

**Module Not Found Errors**

**Symptoms:**
- Import/require errors
- Missing dependency messages
- Build failures

**Solutions:**
1. **Clean install dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be v16 or higher
   npm --version   # Should be compatible
   ```

3. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

4. **Install missing dependencies:**
   ```bash
   npm install --save-dev @types/react @types/react-dom
   ```

## API and Database Issues

### Database Connection Problems

**Database Locked Errors**

**Symptoms:**
- "Database is locked" messages
- CLI commands fail
- Data not saving

**Solutions:**
1. **Stop all processes:**
   ```bash
   # Kill all node processes
   pkill -f node
   pkill -f npm
   ```

2. **Check file permissions:**
   ```bash
   ls -la inventory.db
   chmod 664 inventory.db  # If needed
   ```

3. **Restart services:**
   ```bash
   npm run server
   # In another terminal
   npm run dev
   ```

**Database Corruption**

**Symptoms:**
- Malformed database errors
- Data inconsistencies
- Crashes on database operations

**Solutions:**
1. **Check database integrity:**
   ```bash
   npm run cli validate
   ```

2. **Restore from backup:**
   ```bash
   # If you have a backup
   cp backup-inventory.db inventory.db
   ```

3. **Rebuild database:**
   ```bash
   # Last resort - will lose data
   rm inventory.db
   npm run server  # Will recreate empty database
   ```

### API Connection Issues

**Server Not Responding**

**Symptoms:**
- React app shows connection errors
- API calls timeout
- 500 Internal Server Error

**Solutions:**
1. **Check server status:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Restart API server:**
   ```bash
   npm run server
   ```

3. **Check server logs:**
   - Look for error messages in terminal
   - Check for unhandled exceptions
   - Verify database connectivity

4. **Verify CORS configuration:**
   - Ensure React app URL is allowed
   - Check for CORS-related errors in browser console

## AI and Chat Issues

### Gemini API Problems

**AI Not Responding**

**Symptoms:**
- Chat messages don't get responses
- "Failed to get response from AI" errors
- Long delays or timeouts

**Solutions:**
1. **Verify API key:**
   ```bash
   # Check if key is set
   echo $VITE_API_KEY
   ```

2. **Test API key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Verify key is active and has quota
   - Check for usage limits

3. **Check internet connection:**
   - Ensure stable internet connectivity
   - Test with other online services
   - Check firewall settings

4. **API quota issues:**
   - Check Gemini API usage dashboard
   - Verify you haven't exceeded rate limits
   - Consider upgrading API plan if needed

**Auto-Population Not Working**

**Symptoms:**
- AI responds but doesn't create inventory items
- No JSON blocks in responses
- Manual confirmation required for everything

**Solutions:**
1. **Check auto-population settings:**
   - Ensure auto-population is enabled in chat
   - Verify settings in localStorage
   - Try toggling the setting off and on

2. **Verify AI response format:**
   - Look for JSON blocks in AI responses
   - Check browser console for parsing errors
   - Try rephrasing requests more specifically

3. **Clear chat history:**
   - Start fresh conversation
   - Clear browser cache if needed
   - Restart the application

### Chat Interface Issues

**Messages Not Sending**

**Symptoms:**
- Send button doesn't work
- Messages appear but no AI response
- Chat interface frozen

**Solutions:**
1. **Refresh the page:**
   - Simple browser refresh often fixes UI issues
   - Check if messages reappear after refresh

2. **Clear browser cache:**
   ```bash
   # Chrome: Ctrl+Shift+Delete
   # Firefox: Ctrl+Shift+Delete
   # Safari: Cmd+Option+E
   ```

3. **Check browser console:**
   - Look for JavaScript errors
   - Check network tab for failed requests
   - Verify WebSocket connections if used

## User Interface Issues

### Display and Rendering Problems

**Components Not Loading**

**Symptoms:**
- Blank screens or missing components
- Layout issues or broken styling
- Images not displaying

**Solutions:**
1. **Hard refresh:**
   ```bash
   # Force refresh without cache
   Ctrl+F5 (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Check browser compatibility:**
   - Use modern browser (Chrome, Firefox, Safari, Edge)
   - Ensure JavaScript is enabled
   - Disable browser extensions temporarily

3. **Clear application data:**
   - Clear localStorage and sessionStorage
   - Reset application settings
   - Re-import data if needed

**Search Not Working**

**Symptoms:**
- Search returns no results
- Search is very slow
- Filters not applying correctly

**Solutions:**
1. **Clear search filters:**
   - Reset all active filters
   - Clear search input completely
   - Try broader search terms

2. **Check data integrity:**
   ```bash
   npm run cli inventory list | head -10
   ```

3. **Rebuild search index:**
   - Restart the application
   - Clear browser cache
   - Re-sync data if needed

### Performance Issues

**Slow Loading Times**

**Symptoms:**
- Application takes long to load
- Slow response to user interactions
- High memory usage

**Solutions:**
1. **Check system resources:**
   - Monitor CPU and memory usage
   - Close unnecessary applications
   - Restart computer if needed

2. **Optimize database:**
   ```bash
   npm run cli optimize
   ```

3. **Reduce data load:**
   - Archive old projects
   - Clean up unused inventory items
   - Limit search results

## Integration Issues

### Home Assistant Problems

**Cannot Connect to Home Assistant**

**Symptoms:**
- Connection test fails
- "Network unreachable" errors
- Authentication failures

**Solutions:**
1. **Verify Home Assistant accessibility:**
   ```bash
   # Test basic connectivity
   curl http://your-ha-ip:8123
   ```

2. **Check access token:**
   - Regenerate Long-Lived Access Token in HA
   - Verify token has correct permissions
   - Update token in IoT Inventory Oracle settings

3. **Network configuration:**
   - Ensure both systems are on same network
   - Check firewall rules
   - Verify port 8123 is accessible

**Entities Not Syncing**

**Symptoms:**
- No entities discovered
- Outdated entity information
- Missing entity states

**Solutions:**
1. **Refresh entity discovery:**
   - Use refresh button in HA integration settings
   - Restart Home Assistant if needed
   - Check entity availability in HA

2. **Check entity permissions:**
   - Verify entities are not hidden or disabled
   - Check access token permissions
   - Review entity configuration in HA

### GitHub Integration Issues

**Repository Analysis Fails**

**Symptoms:**
- Cannot import components from GitHub
- "Repository not found" errors
- Analysis returns empty results

**Solutions:**
1. **Verify repository accessibility:**
   - Ensure repository is public
   - Check repository URL format
   - Test access in web browser

2. **Check supported file types:**
   - Verify repository contains supported files
   - Look for platformio.ini, *.ino, package.json, etc.
   - Check file formats and syntax

3. **API rate limits:**
   - GitHub API has rate limits
   - Wait and try again later
   - Consider using authenticated requests

## Data and Backup Issues

### Data Loss Prevention

**Regular Backups**

**Automated Backup:**
```bash
# Create daily backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
npm run cli backup "backups/inventory-$DATE.db"
```

**Manual Backup:**
```bash
# Create immediate backup
npm run cli backup backup-$(date +%Y-%m-%d).db

# Verify backup
npm run cli validate backup-$(date +%Y-%m-%d).db
```

**Data Recovery**

**Restore from Backup:**
```bash
# Stop services first
pkill -f npm

# Restore database
cp backup-2024-01-15.db inventory.db

# Restart services
npm run dev:full
```

**Partial Data Recovery:**
```bash
# Export specific data
npm run cli inventory export components.csv
npm run cli projects export projects.json

# Import to new installation
npm run cli inventory import components.csv
npm run cli projects import projects.json
```

## Performance Optimization

### System Performance

**Memory Usage Optimization**

**Monitor Usage:**
```bash
# Check Node.js memory usage
node --max-old-space-size=4096 server/api.js

# Monitor system resources
top -p $(pgrep node)
```

**Optimize Database:**
```bash
# Clean up database
npm run cli cleanup

# Optimize database file
npm run cli optimize

# Vacuum database
sqlite3 inventory.db "VACUUM;"
```

**Network Performance**

**Reduce API Calls:**
- Enable caching where appropriate
- Batch multiple operations
- Use pagination for large datasets
- Implement request debouncing

**Optimize Assets:**
- Clear browser cache regularly
- Use browser dev tools to identify slow requests
- Monitor network tab for failed requests

## Getting Additional Help

### Diagnostic Information

**System Information to Collect:**
```bash
# System info
node --version
npm --version
uname -a  # Linux/Mac
systeminfo  # Windows

# Application info
npm run cli stats
ls -la inventory.db
cat .env | grep -v API_KEY  # Don't share API key
```

**Log Collection:**
- Browser console errors (F12 → Console)
- Server terminal output
- Network requests (F12 → Network)
- Application errors and stack traces

### Community Support

**Before Asking for Help:**
1. Search existing documentation
2. Check troubleshooting guide (this document)
3. Try basic solutions (restart, refresh, clear cache)
4. Collect diagnostic information

**When Reporting Issues:**
1. Describe the problem clearly
2. Include steps to reproduce
3. Share relevant error messages
4. Provide system information
5. Mention what you've already tried

**Support Channels:**
- GitHub Issues for bugs and feature requests
- Community forums for usage questions
- Documentation for comprehensive guides
- AI assistant for quick help within the app

---

**[← Back: Home Assistant](./home-assistant.md)** | **[Documentation Home](./README.md)** | **[Next: API Reference →](./api-reference.md)**