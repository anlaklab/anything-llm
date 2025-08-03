# 📅 Calendar Event Plugin Installation Guide

## 🎯 Quick Installation for Coolify Deployment

### Step 1: Copy Plugin Files

Copy the calendar event plugin to your AnythingLLM storage directory:

```bash
# For Docker/Coolify deployment
cp -r plugins/agent-skills/calendar-event-plugin/ server/storage/plugins/agent-skills/

# For local development
mkdir -p server/storage/plugins/agent-skills/
cp -r plugins/agent-skills/calendar-event-plugin/ server/storage/plugins/agent-skills/
```

### Step 2: Restart AnythingLLM

The plugin supports hot-reloading, but for first installation, restart the service:

```bash
# In Coolify: Go to your service and click "Redeploy"
# Or restart the container

# For Docker Compose:
docker-compose restart anythingllm

# For local development:
# Restart yarn dev:server
```

### Step 3: Configure in Admin Settings

1. **Access Admin Panel**: Go to your AnythingLLM instance → **Admin Settings**
2. **Navigate to Agent Skills**: Click on **"Agents"** → **"Agent Skills"**
3. **Find Calendar Plugin**: Look for **"Calendar Event Manager"** in the imported skills list
4. **Configure Settings**: Click the gear icon to configure:

#### For Google Calendar:
```
CALENDAR_PROVIDER: google
CALENDAR_API_KEY: your-google-api-key-here
DEFAULT_CALENDAR_ID: primary
TIMEZONE: America/New_York
```

#### For Microsoft Outlook:
```
CALENDAR_PROVIDER: outlook
CALENDAR_CLIENT_ID: your-azure-client-id
CALENDAR_CLIENT_SECRET: your-azure-client-secret
TIMEZONE: America/New_York
```

### Step 4: Test the Plugin

1. **Create a Workspace** with agents enabled
2. **Use the @agent directive** in chat
3. **Try calendar commands**:
   - "What are my meetings today?"
   - "Create a test meeting tomorrow at 2 PM"
   - "Am I free this afternoon?"

## 🔧 Getting API Credentials

### Google Calendar API Setup:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create new or select existing project
3. **Enable Calendar API**: 
   - Go to **APIs & Services** → **Library**
   - Search for "Google Calendar API"
   - Click **Enable**
4. **Create API Key**:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ Create Credentials** → **API Key**
   - Copy the generated API key
5. **Configure in AnythingLLM**: Use the API key in plugin settings

### Microsoft Outlook Setup:

1. **Go to Azure Portal**: https://portal.azure.com/
2. **App Registrations**: Navigate to **Azure Active Directory** → **App registrations**
3. **New Registration**: Click **+ New registration**
4. **Configure App**:
   - Name: "AnythingLLM Calendar"
   - Supported account types: Single tenant
   - Redirect URI: Not needed for this setup
5. **API Permissions**:
   - Click **API permissions** → **+ Add a permission**
   - **Microsoft Graph** → **Application permissions**
   - Add: `Calendar.Read`, `Calendar.ReadWrite`
   - **Grant admin consent**
6. **Client Secret**:
   - Go to **Certificates & secrets** → **+ New client secret**
   - Copy the **Value** (not the ID)
7. **Get Client ID**: Copy from **Overview** page

## 🚀 Usage Examples

Once configured, you can use natural language with your agent:

### Creating Events:
- "Schedule a meeting with the team tomorrow at 10 AM"
- "Create a dentist appointment on Friday at 3 PM"
- "Book a 30-minute call with John next Monday"
- "Set up a recurring weekly standup every Tuesday at 9 AM"

### Viewing Schedule:
- "What's on my calendar today?"
- "Show me tomorrow's meetings"
- "What events do I have next week?"
- "List my appointments for January 15th"

### Checking Availability:
- "Am I free this afternoon?"
- "What's my availability tomorrow?"
- "Do I have any conflicts on Monday?"
- "Check if I'm available at 2 PM today"

## 🔍 Troubleshooting

### Plugin Not Appearing:
1. Check file permissions in storage directory
2. Restart AnythingLLM service
3. Verify `plugin.json` format is valid

### API Authentication Errors:
1. **Google Calendar**: Verify API key is correct and Calendar API is enabled
2. **Outlook**: Check Client ID/Secret and API permissions
3. Test API credentials outside AnythingLLM first

### Plugin Not Responding:
1. Check AnythingLLM logs for errors
2. Verify plugin is marked as "Active" in settings
3. Ensure agent skills are enabled in workspace settings

### Date/Time Issues:
1. Set correct timezone in plugin settings
2. Use ISO format for specific dates
3. Test with simple relative dates first ("today", "tomorrow")

## 📁 File Structure

```
plugins/agent-skills/calendar-event-plugin/
├── plugin.json          # Plugin configuration
├── handler.js           # Main plugin logic
├── package.json         # Node.js dependencies
└── README.md           # Documentation
```

## 🔄 Updates

To update the plugin:
1. Replace files in `server/storage/plugins/agent-skills/calendar-event-plugin/`
2. Restart AnythingLLM or wait for hot-reload
3. Check Admin → Agent Skills for any new configuration options

## 📞 Support

- **AnythingLLM Docs**: https://docs.anythingllm.com/agent/custom/developer-guide
- **Community Discord**: https://discord.gg/6UyHPeGZAC
- **GitHub Issues**: https://github.com/anlaklab/anything-llm/issues

---

**🎉 Enjoy your new calendar management capabilities with AnythingLLM!**