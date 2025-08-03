# 📅 Calendar Event Manager Plugin

A comprehensive calendar management plugin for AnythingLLM that allows AI agents to create, view, and manage calendar events across multiple calendar providers.

## ✨ Features

- 📅 **Create Events** - Schedule meetings, appointments, and reminders
- 👀 **View Events** - List events for any date (today, tomorrow, specific dates)
- 🔍 **Check Availability** - See when you're free or busy
- 👥 **Attendee Management** - Add multiple attendees to events
- 📍 **Location Support** - Set physical or virtual meeting locations
- 🔄 **Recurring Events** - Create daily, weekly, monthly, or yearly recurring events
- 🌐 **Multi-Provider Support** - Google Calendar, Outlook, CalDAV

## 🚀 Quick Start

### 1. Install the Plugin

The plugin is already installed in your AnythingLLM instance. You can find it in:
```
server/storage/plugins/agent-skills/calendar-event-plugin/
```

### 2. Configure Calendar Provider

1. Go to **Admin Settings** → **Agent Skills**
2. Find **Calendar Event Manager** in the list
3. Configure your calendar provider settings:

#### For Google Calendar:
- **Provider**: `google`
- **API Key**: Your Google Calendar API key
- **Calendar ID**: `primary` (or specific calendar ID)

#### For Microsoft Outlook:
- **Provider**: `outlook`
- **Client ID**: Your Azure app client ID
- **Client Secret**: Your Azure app client secret

### 3. Get API Credentials

#### Google Calendar Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**
4. Create credentials (API Key)
5. (Optional) Set up OAuth for full access

#### Microsoft Outlook Setup:
1. Go to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Create a new app registration
3. Add **Calendar.Read** and **Calendar.ReadWrite** permissions
4. Get Client ID and Client Secret

## 📖 Usage Examples

### Creating Events

```
"Create a meeting tomorrow at 2 PM called 'Project Review'"
"Schedule a 30-minute call with John next Monday at 10 AM"
"Book a dentist appointment on Friday at 3 PM"
"Create a recurring weekly team meeting every Tuesday at 9 AM"
```

### Viewing Events

```
"What are my meetings today?"
"Show me tomorrow's schedule"
"What events do I have on January 15th?"
"List my appointments for next Monday"
```

### Checking Availability

```
"Am I free this afternoon?"
"What's my availability tomorrow?"
"Do I have any conflicts today?"
"Check my schedule for next week"
```

### Managing Events

```
"Cancel my 3 PM meeting today" (coming soon)
"Move my 2 PM meeting to 3 PM" (coming soon)
"Update the location for tomorrow's meeting" (coming soon)
```

## 🔧 Configuration Options

| Setting | Description | Example |
|---------|-------------|---------|
| `CALENDAR_PROVIDER` | Calendar service to use | `google`, `outlook`, `caldav` |
| `CALENDAR_API_KEY` | API key for authentication | `your-google-api-key` |
| `CALENDAR_CLIENT_ID` | OAuth client ID | `your-oauth-client-id` |
| `CALENDAR_CLIENT_SECRET` | OAuth client secret | `your-oauth-client-secret` |
| `DEFAULT_CALENDAR_ID` | Default calendar to use | `primary` |
| `TIMEZONE` | Default timezone | `America/New_York` |

## 🎯 Supported Actions

| Action | Description | Status |
|--------|-------------|--------|
| `create` | Create new events | ✅ Available |
| `list` | View events for a date | ✅ Available |
| `get_availability` | Check free/busy status | ✅ Available |
| `update` | Modify existing events | 🚧 Coming Soon |
| `delete` | Remove events | 🚧 Coming Soon |

## 🌐 Calendar Provider Support

| Provider | Status | Features |
|----------|--------|----------|
| **Google Calendar** | ✅ Fully Supported | Create, List, View |
| **Microsoft Outlook** | 🔧 OAuth Setup Required | Create, List, View |
| **CalDAV** | 🚧 Planned | Generic CalDAV support |

## 🛡️ Security & Privacy

- **No Data Storage**: The plugin doesn't store your calendar data
- **API-Only Access**: Uses official calendar APIs
- **Secure Authentication**: Supports OAuth 2.0
- **Permission Control**: Only requests necessary calendar permissions

## 🔍 Troubleshooting

### Common Issues:

**1. "Google Calendar requires an API key"**
- Solution: Configure `CALENDAR_API_KEY` in plugin settings
- Get API key from Google Cloud Console

**2. "Outlook Calendar requires OAuth credentials"**
- Solution: Set up Azure app registration
- Configure `CALENDAR_CLIENT_ID` and `CALENDAR_CLIENT_SECRET`

**3. "Failed to fetch events"**
- Check your API credentials
- Verify calendar permissions
- Ensure internet connectivity

**4. "Event creation failed"**
- Verify date/time format
- Check calendar write permissions
- Ensure attendee emails are valid

### Debug Mode:

To enable detailed error messages, check the AnythingLLM logs:
```bash
# Docker deployment
docker logs anythingllm

# Local development
yarn dev:server
```

## 📝 Examples in Natural Language

The plugin understands natural language and can handle various phrasings:

### Time References:
- "today", "tomorrow", "next Monday"
- "January 15th", "03/20/2024"
- "this afternoon", "next week"

### Event Types:
- "meeting", "appointment", "call"
- "lunch", "conference", "interview"
- "reminder", "task", "deadline"

### Duration Formats:
- "30 minutes", "2 hours"
- "from 2 PM to 4 PM"
- "all day event"

## 🚀 Future Features

- [ ] Event updating and deletion
- [ ] Recurring event management
- [ ] Calendar sharing
- [ ] Meeting room booking
- [ ] Notification preferences
- [ ] Multiple calendar sync
- [ ] iCal export/import
- [ ] CalDAV support

## 📞 Support

For issues, questions, or feature requests:

1. Check the [AnythingLLM Agent Docs](https://docs.anythingllm.com/agent/custom/developer-guide)
2. Visit the [AnythingLLM Community](https://discord.gg/6UyHPeGZAC)
3. Create an issue on [GitHub](https://github.com/Mintplex-Labs/anything-llm/issues)

## 📄 License

MIT License - feel free to modify and distribute as needed.

---

**Made with ❤️ for the AnythingLLM community**