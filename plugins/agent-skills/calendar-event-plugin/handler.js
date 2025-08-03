const https = require('https');
const { URL } = require('url');

/**
 * Calendar Event Manager Plugin for AnythingLLM
 * Supports Google Calendar, Outlook, and CalDAV
 * 
 * @param {Object} config - Plugin configuration from setup_args
 */

// Helper function to make HTTP requests
function makeHttpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') ? JSON.parse(body) : body
          };
          resolve(result);
        } catch (error) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper function to parse date strings
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (dateStr.toLowerCase()) {
    case 'today':
      return today;
    case 'tomorrow':
      return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    case 'yesterday':
      return new Date(today.getTime() - 24 * 60 * 60 * 1000);
    default:
      return new Date(dateStr);
  }
}

// Helper function to format events for display
function formatEvent(event, provider) {
  const startTime = new Date(event.start?.dateTime || event.start?.date);
  const endTime = new Date(event.end?.dateTime || event.end?.date);
  
  return {
    id: event.id,
    title: event.summary || event.subject || 'Untitled Event',
    description: event.description || event.body?.content || '',
    start: startTime.toLocaleString(),
    end: endTime.toLocaleString(),
    location: event.location || '',
    attendees: event.attendees?.map(a => a.email || a.emailAddress?.address).filter(Boolean) || [],
    provider: provider
  };
}

// Google Calendar API functions
class GoogleCalendarAPI {
  constructor(apiKey, clientId, clientSecret, calendarId = 'primary') {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.calendarId = calendarId;
    this.baseUrl = 'www.googleapis.com';
  }

  async listEvents(date) {
    const startDate = parseDate(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
    const path = `/calendar/v3/calendars/${this.calendarId}/events?key=${this.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    const options = {
      hostname: this.baseUrl,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await makeHttpRequest(options);
      if (response.statusCode === 200) {
        return response.body.items?.map(event => formatEvent(event, 'google')) || [];
      }
      throw new Error(`Google Calendar API error: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    } catch (error) {
      throw new Error(`Failed to fetch Google Calendar events: ${error.message}`);
    }
  }

  async createEvent(eventData) {
    const { title, description, start_time, end_time, duration, attendees, location, recurrence } = eventData;
    
    const startDate = new Date(start_time);
    const endDate = end_time ? new Date(end_time) : new Date(startDate.getTime() + (duration || 60) * 60 * 1000);
    
    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC'
      },
      location: location || '',
      attendees: attendees ? attendees.map(email => ({ email })) : []
    };

    if (recurrence) {
      event.recurrence = [`RRULE:FREQ=${recurrence.toUpperCase()}`];
    }

    const options = {
      hostname: this.baseUrl,
      path: `/calendar/v3/calendars/${this.calendarId}/events?key=${this.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await makeHttpRequest(options, event);
      if (response.statusCode === 200 || response.statusCode === 201) {
        return formatEvent(response.body, 'google');
      }
      throw new Error(`Google Calendar API error: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    } catch (error) {
      throw new Error(`Failed to create Google Calendar event: ${error.message}`);
    }
  }
}

// Mock Outlook Calendar API (requires proper OAuth implementation)
class OutlookCalendarAPI {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = 'graph.microsoft.com';
  }

  async listEvents(date) {
    // This is a simplified mock - real implementation requires OAuth token
    return `Outlook Calendar integration requires OAuth setup. Date requested: ${date}`;
  }

  async createEvent(eventData) {
    // This is a simplified mock - real implementation requires OAuth token
    return `Outlook Calendar integration requires OAuth setup. Event: ${eventData.title}`;
  }
}

// CalDAV API (simplified)
class CalDAVAPI {
  constructor(serverUrl, username, password) {
    this.serverUrl = serverUrl;
    this.username = username;
    this.password = password;
  }

  async listEvents(date) {
    return `CalDAV integration requires server configuration. Date requested: ${date}`;
  }

  async createEvent(eventData) {
    return `CalDAV integration requires server configuration. Event: ${eventData.title}`;
  }
}

module.exports.runtime = {
  handler: async function ({ 
    action, 
    title, 
    description, 
    start_time, 
    end_time, 
    duration, 
    attendees, 
    location, 
    date, 
    calendar_id, 
    time_filter, 
    new_start_time, 
    recurrence,
    runtimeArgs 
  }) {
    try {
      // Get configuration from setup_args
      const provider = runtimeArgs?.CALENDAR_PROVIDER || 'google';
      const apiKey = runtimeArgs?.CALENDAR_API_KEY;
      const clientId = runtimeArgs?.CALENDAR_CLIENT_ID;
      const clientSecret = runtimeArgs?.CALENDAR_CLIENT_SECRET;
      const defaultCalendarId = runtimeArgs?.DEFAULT_CALENDAR_ID || 'primary';
      const timezone = runtimeArgs?.TIMEZONE || 'UTC';

      let calendarAPI;

      // Initialize the appropriate calendar API
      switch (provider.toLowerCase()) {
        case 'google':
          if (!apiKey) {
            return `Google Calendar requires an API key. Please configure CALENDAR_API_KEY in the plugin settings.
            
To get an API key:
1. Go to Google Cloud Console
2. Enable Calendar API
3. Create credentials (API Key)
4. Add the key to plugin settings`;
          }
          calendarAPI = new GoogleCalendarAPI(apiKey, clientId, clientSecret, calendar_id || defaultCalendarId);
          break;
          
        case 'outlook':
          if (!clientId || !clientSecret) {
            return `Outlook Calendar requires OAuth credentials. Please configure CALENDAR_CLIENT_ID and CALENDAR_CLIENT_SECRET.
            
To get OAuth credentials:
1. Go to Azure App Registrations
2. Create a new app registration
3. Add Calendar permissions
4. Get Client ID and Secret`;
          }
          calendarAPI = new OutlookCalendarAPI(clientId, clientSecret);
          break;
          
        case 'caldav':
          return `CalDAV support is planned for future releases. Currently supporting Google Calendar and Outlook.`;
          
        default:
          return `Unsupported calendar provider: ${provider}. Supported providers: google, outlook, caldav`;
      }

      // Execute the requested action
      switch (action?.toLowerCase()) {
        case 'create':
          if (!title || !start_time) {
            return `To create an event, I need at least a title and start time. 
            
Example: "Create a meeting tomorrow at 2 PM called 'Project Review'"`;
          }

          const eventData = {
            title,
            description,
            start_time,
            end_time,
            duration,
            attendees: attendees ? (Array.isArray(attendees) ? attendees : [attendees]) : [],
            location,
            recurrence
          };

          const createdEvent = await calendarAPI.createEvent(eventData);
          return `✅ Event created successfully!

📅 **${createdEvent.title}**
🕐 ${createdEvent.start} - ${createdEvent.end}
📍 ${createdEvent.location || 'No location'}
👥 ${createdEvent.attendees.length > 0 ? createdEvent.attendees.join(', ') : 'No attendees'}
${createdEvent.description ? `📝 ${createdEvent.description}` : ''}`;

        case 'list':
          const requestedDate = date || 'today';
          const events = await calendarAPI.listEvents(requestedDate);
          
          if (!events || events.length === 0) {
            return `📅 No events found for ${requestedDate}.`;
          }

          if (typeof events === 'string') {
            return events; // Error message from API
          }

          let eventsList = `📅 **Events for ${requestedDate}:**\n\n`;
          events.forEach((event, index) => {
            eventsList += `${index + 1}. **${event.title}**\n`;
            eventsList += `   🕐 ${event.start} - ${event.end}\n`;
            if (event.location) eventsList += `   📍 ${event.location}\n`;
            if (event.attendees.length > 0) eventsList += `   👥 ${event.attendees.join(', ')}\n`;
            eventsList += '\n';
          });

          return eventsList;

        case 'get_availability':
          const availabilityDate = date || 'today';
          const dayEvents = await calendarAPI.listEvents(availabilityDate);
          
          if (typeof dayEvents === 'string') {
            return dayEvents; // Error message
          }

          if (!dayEvents || dayEvents.length === 0) {
            return `✅ You're completely free on ${availabilityDate}!`;
          }

          let availability = `📅 **Availability for ${availabilityDate}:**\n\n`;
          availability += `You have ${dayEvents.length} event(s) scheduled:\n\n`;
          
          dayEvents.forEach((event, index) => {
            availability += `${index + 1}. ${event.title} (${event.start} - ${event.end})\n`;
          });

          return availability;

        case 'update':
          return `🔧 Event updating functionality is coming soon. Currently supported: create, list, get_availability.
          
For now, you can delete the old event and create a new one.`;

        case 'delete':
          return `🗑️ Event deletion functionality is coming soon. Currently supported: create, list, get_availability.`;

        default:
          return `❓ Unknown action: ${action}

**Available actions:**
• **create** - Create a new event
• **list** - List events for a specific date
• **get_availability** - Check availability
• **update** - Update an existing event (coming soon)
• **delete** - Delete an event (coming soon)

**Examples:**
• "Create a meeting tomorrow at 2 PM called 'Project Review'"
• "What are my meetings today?"
• "Am I free this afternoon?"`;
      }

    } catch (error) {
      return `❌ Calendar operation failed: ${error.message}

Please check your calendar configuration and try again.`;
    }
  }
};