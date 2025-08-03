# 🚀 Pipedream Workflow Integration Plugin

A powerful integration plugin for AnythingLLM that connects your AI agents to [Pipedream's](https://pipedream.com) automation platform. Execute workflows, trigger external APIs, and connect to 1000+ services directly from your AI conversations.

## ✨ What is Pipedream?

Pipedream is a serverless integration and automation platform that connects APIs, databases, and services. With this plugin, your AnythingLLM agents can:

- 🔗 **Connect to 1000+ APIs** - Slack, Twitter, Google Services, Databases, CRMs, etc.
- 🤖 **Automate workflows** - Trigger complex multi-step processes
- 📊 **Process data** - Transform, filter, and manipulate data in real-time
- 🔄 **Create integrations** - Build custom API connections without coding
- ⚡ **Execute instantly** - Run workflows synchronously or asynchronously

## 🎯 Key Features

- **Execute Workflows**: Run any Pipedream workflow from natural language
- **List & Monitor**: View all your workflows and check their status
- **Multiple Triggers**: Support for HTTP endpoints, webhooks, and scheduled workflows
- **Async Support**: Handle long-running workflows asynchronously
- **Pre-configured Endpoints**: Save frequently used workflows for quick access
- **Error Handling**: Comprehensive error reporting and troubleshooting
- **Secure Authentication**: API key-based authentication with Pipedream

## 🚀 Quick Start

### 1. Get Your Pipedream API Key

1. **Sign up** at [Pipedream.com](https://pipedream.com) (free tier available)
2. **Go to Settings**: https://pipedream.com/settings/account
3. **Copy API Key**: Look for your API key (starts with `pd_`)

### 2. Configure the Plugin

1. **Access Admin Panel**: AnythingLLM → Admin Settings → Agent Skills
2. **Find Plugin**: Look for "Pipedream Workflow Integration"
3. **Configure Settings**:
   ```
   PIPEDREAM_API_KEY: pd_your_api_key_here
   DEFAULT_WORKSPACE_ID: (optional) ws_your_workspace_id
   WORKFLOW_ENDPOINTS: (optional) Pre-configured workflows
   ```

### 3. Create Your First Workflow

1. **Go to Pipedream**: https://pipedream.com/workflows
2. **New Workflow**: Click "New Workflow"
3. **Add Trigger**: Choose "HTTP / Webhook Requests"
4. **Add Steps**: Add any actions (Slack, Email, Database, etc.)
5. **Deploy**: Save and deploy your workflow
6. **Copy URL**: Copy the endpoint URL for use with the plugin

### 4. Test with AnythingLLM

```
"Execute my workflow at https://eo123abc.m.pipedream.net with data message: Hello World"
```

## 📖 Usage Examples

### Slack Notifications
```
"Send a Slack message to #general channel saying 'Project completed!'"
```
*Requires a Pipedream workflow that connects to Slack*

### Email Automation
```
"Send welcome email to john@example.com with name John Doe"
```
*Requires a Pipedream workflow with email service (SendGrid, Mailgun, etc.)*

### Database Operations
```
"Add new customer data: name 'Alice Smith', email 'alice@example.com' to our CRM"
```
*Requires a Pipedream workflow connected to your database/CRM*

### Social Media Posting
```
"Post to Twitter: 'Just launched our new AI feature! #AI #Innovation'"
```
*Requires a Pipedream workflow connected to Twitter API*

### File Processing
```
"Process the uploaded CSV file and generate a report"
```
*Requires a Pipedream workflow for file processing*

### API Integrations
```
"Get weather data for New York and save it to our database"
```
*Requires a Pipedream workflow connecting Weather API to database*

## ⚙️ Configuration Options

| Setting | Description | Example |
|---------|-------------|---------|
| `PIPEDREAM_API_KEY` | Your Pipedream API key | `pd_abc123...` |
| `DEFAULT_WORKSPACE_ID` | Default workspace ID | `ws_abc123` |
| `WORKFLOW_ENDPOINTS` | Pre-configured workflow URLs | `slack:https://eo123.m.pipedream.net` |
| `DEFAULT_TIMEOUT` | Workflow timeout in seconds | `30` |
| `ENABLE_ASYNC_EXECUTION` | Allow async workflow execution | `true` or `false` |

### Pre-configured Workflow Endpoints

You can save frequently used workflows by adding them to `WORKFLOW_ENDPOINTS`:

```
slack-notification:https://eo123abc.m.pipedream.net
email-automation:https://eo456def.m.pipedream.net
crm-update:https://eo789ghi.m.pipedream.net
twitter-post:https://eo012jkl.m.pipedream.net
```

Then use them by name:
```
"Execute my slack-notification workflow with message 'Hello team!'"
```

## 🛠️ Creating Pipedream Workflows

### Basic HTTP Workflow

1. **Create New Workflow** in Pipedream
2. **Add HTTP Trigger**:
   ```javascript
   // Trigger: HTTP / Webhook Requests
   // This will create an endpoint URL
   ```

3. **Add Action Steps**:
   ```javascript
   // Example: Send to Slack
   export default defineComponent({
     async run({ steps, $ }) {
       // Access data sent from AnythingLLM
       const { message, channel } = steps.trigger.event.body;
       
       // Send to Slack
       await $.send.slack({
         text: message,
         channel: channel || "#general"
       });
     }
   })
   ```

### Advanced Data Processing

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    // Get data from AnythingLLM
    const customerData = steps.trigger.event.body;
    
    // Process the data
    const processedData = {
      ...customerData,
      created_at: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    // Save to database
    await $.send.http({
      method: "POST",
      url: "https://api.yourdatabase.com/customers",
      headers: { 
        "Authorization": "Bearer YOUR_TOKEN" 
      },
      data: processedData
    });
    
    // Return result to AnythingLLM
    return { 
      success: true, 
      customer_id: processedData.id 
    };
  }
})
```

## 🎯 Common Use Cases

### 1. **Team Communication**
- Send Slack/Teams notifications
- Create tickets in Jira/Linear
- Update project status

### 2. **Customer Management**
- Add leads to CRM
- Send automated emails
- Update customer records

### 3. **Content & Social Media**
- Post to Twitter/LinkedIn
- Schedule social media content
- Generate and share reports

### 4. **Data Processing**
- Process uploaded files
- Generate reports
- Sync data between systems

### 5. **Monitoring & Alerts**
- Send error notifications
- Monitor system health
- Create incident reports

### 6. **E-commerce & Sales**
- Process orders
- Update inventory
- Send shipping notifications

## 🔐 Security & Best Practices

### API Key Security
- Store API keys securely in AnythingLLM settings
- Use environment-specific API keys
- Regularly rotate API keys

### Workflow Design
- Validate input data in workflows
- Add error handling and logging
- Use secrets for sensitive data
- Implement rate limiting for public endpoints

### Access Control
- Use workspace-specific configurations
- Limit workflow execution permissions
- Monitor workflow usage and costs

## 🔍 Troubleshooting

### Common Issues

**1. "Pipedream API Key Required"**
- Solution: Add your API key in plugin settings
- Get it from: https://pipedream.com/settings/account

**2. "Invalid Pipedream URL"**
- Solution: Ensure URL is a valid Pipedream endpoint
- Format: `https://eo123abc.m.pipedream.net`

**3. "Workflow execution failed"**
- Check workflow is deployed and active
- Verify data format matches workflow expectations
- Check Pipedream logs for detailed errors

**4. "Request timeout"**
- Increase timeout in plugin settings
- Consider using async execution for long workflows
- Optimize workflow for better performance

### Debug Tips

1. **Test workflows directly** in Pipedream before using with AnythingLLM
2. **Check Pipedream logs** for detailed error information
3. **Use simple data first** to verify connectivity
4. **Enable async execution** for complex workflows

## 📊 Monitoring & Analytics

### Workflow Monitoring
```
"List all my Pipedream workflows"
"Get status of workflow wf_abc123"
```

### Usage Analytics
- Monitor workflow execution counts
- Track error rates and performance
- Review Pipedream dashboard for insights

## 💰 Pricing & Limits

### Pipedream Limits
- **Free Tier**: 100 workflow executions/day
- **Paid Plans**: Higher limits and more features
- **Enterprise**: Custom limits and SLA

### Plugin Considerations
- No additional cost for the plugin
- Uses your existing Pipedream quota
- Async execution helps with rate limits

## 🚀 Advanced Features

### Async Workflow Execution
```javascript
// Enable async in plugin settings
"Run my data-processing workflow asynchronously"
```

### Custom Headers
```javascript
"Execute workflow with custom headers: {\"X-Priority\": \"high\"}"
```

### Multiple Data Formats
```javascript
// JSON data
"Send customer data: {\"name\": \"John\", \"email\": \"john@example.com\"}"

// Simple key-value
"Execute workflow with message: Hello and priority: high"
```

### Webhook Creation
```javascript
"Create webhook named 'anythingllm-trigger'"
```

## 🔄 Integration Examples

### Google Sheets
```javascript
// Pipedream workflow to add row to Google Sheets
export default defineComponent({
  async run({ steps, $ }) {
    await $.send.sheets({
      spreadsheetId: "your-sheet-id",
      range: "A:C",
      values: [[
        steps.trigger.event.body.name,
        steps.trigger.event.body.email,
        new Date().toISOString()
      ]]
    });
  }
})
```

### Notion Database
```javascript
// Add page to Notion database
export default defineComponent({
  async run({ steps, $ }) {
    await $.send.notion({
      database_id: "your-database-id",
      properties: {
        "Name": { title: [{ text: { content: steps.trigger.event.body.name }}]},
        "Email": { email: steps.trigger.event.body.email }
      }
    });
  }
})
```

## 📚 Resources

### Documentation
- **Pipedream Docs**: https://pipedream.com/docs
- **API Reference**: https://pipedream.com/docs/api/rest/
- **Component Library**: https://pipedream.com/apps

### Community
- **Pipedream Community**: https://pipedream.com/community
- **AnythingLLM Discord**: https://discord.gg/6UyHPeGZAC
- **GitHub Issues**: https://github.com/anlaklab/anything-llm/issues

### Examples & Templates
- **Workflow Templates**: https://pipedream.com/explore
- **Component Examples**: https://github.com/PipedreamHQ/pipedream

## 📝 License

MIT License - feel free to modify and distribute as needed.

---

**🌟 Transform your AnythingLLM with the power of 1000+ integrations through Pipedream!**