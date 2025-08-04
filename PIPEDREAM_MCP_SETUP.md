# Pipedream MCP Integration Setup Guide

This guide will help you set up seamless OAuth2 integration between AnythingLLM and Pipedream's MCP server, giving your agents access to 2,700+ APIs and tools.

## Prerequisites

1. **Pipedream Account**: Sign up at [pipedream.com](https://pipedream.com)
2. **AnythingLLM Instance**: Running AnythingLLM server
3. **OAuth Application**: Create a Pipedream OAuth app

## Step 1: Create Pipedream OAuth Application

1. Go to [Pipedream Settings > Account](https://pipedream.com/settings/account)
2. Navigate to the "OAuth Apps" section
3. Click "Create OAuth App"
4. Fill in the details:
   - **Name**: `AnythingLLM Integration`
   - **Description**: `OAuth integration for AnythingLLM agents`
   - **Redirect URI**: `http://localhost:3001/api/oauth/pipedream/callback` (adjust for your domain)
   - **Scopes**: Select all scopes you want agents to access
5. Save and copy your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Add these environment variables to your AnythingLLM `.env` file:

```bash
# Pipedream MCP Integration
PIPEDREAM_CLIENT_ID=your_client_id_here
PIPEDREAM_CLIENT_SECRET=your_client_secret_here
PIPEDREAM_PROJECT_ID=your_project_id_here  # Optional
PIPEDREAM_PROJECT_ENVIRONMENT=production    # Optional, defaults to 'production'
PIPEDREAM_OAUTH_REDIRECT_URI=http://localhost:3001/api/oauth/pipedream/callback  # Adjust for your domain
```

## Step 3: Restart AnythingLLM

Restart your AnythingLLM server to load the new configuration:

```bash
# If using Docker
docker-compose restart

# If running directly
npm run server:dev  # or your start command
```

## Step 4: Configure Agents

1. Go to **Admin Settings → Agents**
2. Create a new agent or edit an existing one
3. In the **Agent Skills** section, you should now see:
   - `@@mcp_pipedream` - Available if configured correctly
   - Or `pipedream-auth-required` - If configuration is missing

4. Enable the Pipedream MCP skill for your agent

## Step 5: Test the Integration

### Method 1: Via Agent Chat

1. Open a chat with your configured agent
2. Try these commands:
   ```
   Check my Pipedream authentication status
   Connect to Slack through Pipedream
   Discover available Gmail tools
   Send a test message to Slack channel #general
   ```

### Method 2: Via API Endpoints

The following API endpoints are available:

```bash
# Check authentication status
POST /api/pipedream-mcp/auth/status
{
  "userId": "your-user-id"
}

# Start OAuth flow
POST /api/pipedream-mcp/auth/start
{
  "userId": "your-user-id",
  "scopes": ["read:apps", "write:apps"]
}

# Discover tools for an app
POST /api/pipedream-mcp/tools/discover
{
  "userId": "your-user-id",
  "app": "slack"
}

# Execute a tool
POST /api/pipedream-mcp/tools/execute
{
  "userId": "your-user-id",
  "app": "slack",
  "toolName": "send_message",
  "args": {
    "channel": "#general",
    "text": "Hello from AnythingLLM!"
  }
}
```

## Authentication Flow

1. **First Use**: When a user first tries to use Pipedream tools, they'll receive an authentication URL
2. **OAuth Flow**: User visits the URL, grants permissions, and is redirected back
3. **Token Storage**: Access and refresh tokens are securely stored
4. **Automatic Refresh**: Tokens are automatically refreshed when needed
5. **Seamless Access**: Future tool calls work transparently

## Available Apps

The integration supports 2,700+ APIs including:

### Communication
- Slack - Send messages, create channels, manage users
- Discord - Post messages, manage servers
- Gmail - Send emails, manage inbox
- Microsoft Teams - Send messages, create meetings

### Productivity
- Notion - Create pages, update databases
- Google Sheets - Create rows, update cells, read data
- Airtable - Manage records and tables
- Trello - Create cards, manage boards

### Development
- GitHub - Create issues, manage repositories, PRs
- GitLab - Manage projects and issues
- Jira - Create and update tickets

### Marketing & CRM
- HubSpot - Manage contacts and deals
- Salesforce - Update records and opportunities
- Mailchimp - Manage campaigns and subscribers
- Twitter/X - Post tweets, manage followers
- LinkedIn - Post updates, manage connections

### And many more...

## Troubleshooting

### Common Issues

1. **"Authentication Required" Message**
   - Check environment variables are set correctly
   - Ensure redirect URI matches in Pipedream OAuth app
   - Restart AnythingLLM after configuration changes

2. **"Invalid State Parameter" Error**
   - Check system clock synchronization
   - Ensure storage directory is writable
   - Clear browser cache and try again

3. **"Tool Not Found" Error**
   - Ensure the app is properly connected in Pipedream
   - Check the tool name spelling
   - Verify user permissions for the app

4. **Token Refresh Issues**
   - Check network connectivity to Pipedream
   - Verify client credentials are correct
   - Re-authenticate if tokens are corrupted

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=pipedream-mcp:*
```

### Support

- **Pipedream Documentation**: [docs.pipedream.com](https://docs.pipedream.com)
- **AnythingLLM Issues**: [GitHub Issues](https://github.com/Mintplex-Labs/anything-llm/issues)

## Security Considerations

1. **Token Storage**: Tokens are stored locally in `storage/pipedream_tokens.json`
2. **Encryption**: Consider encrypting token storage in production
3. **Scopes**: Only grant necessary OAuth scopes
4. **Network**: Use HTTPS in production environments
5. **Access Control**: Limit agent access to trusted users

## Example Usage Scenarios

### Customer Support Agent
```
"Send a message to the #support channel in Slack notifying about a new high-priority ticket"
"Create a new HubSpot contact for this customer with their details"
"Schedule a follow-up meeting in Google Calendar"
```

### Marketing Agent
```
"Post this announcement to our Twitter account"
"Add new leads to our Mailchimp newsletter campaign"
"Create a new Notion page for this campaign planning"
```

### Development Agent
```
"Create a GitHub issue for this bug report"
"Send a message to the #dev-alerts Slack channel about the deployment"
"Update the project status in Jira"
```

## Advanced Configuration

### Custom Scopes
```bash
PIPEDREAM_DEFAULT_SCOPES=read:apps,write:apps,admin:apps
```

### Custom Base URLs
```bash
PIPEDREAM_BASE_URL=https://api.pipedream.com
PIPEDREAM_MCP_URL=https://mcp.pipedream.com
```

### Token Cleanup Schedule
The integration automatically cleans up expired tokens. You can run manual cleanup:

```bash
# Via API
GET /api/pipedream-mcp/health
```

This setup provides seamless access to thousands of APIs through natural language interactions with your AnythingLLM agents!