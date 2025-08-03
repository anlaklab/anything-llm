# 🚀 Pipedream Integration Plugin - Complete Setup Guide

## 🎯 What You'll Get

This plugin transforms your AnythingLLM agents into powerful automation machines by connecting to **Pipedream's platform**, giving you access to:

- 🔗 **1000+ Pre-built Integrations** (Slack, Google, Twitter, Notion, Databases, etc.)
- 🤖 **Custom Workflow Automation** 
- 📊 **Real-time Data Processing**
- ⚡ **Instant API Connections**
- 🔄 **Multi-step Workflows**

## 🚀 Quick Installation for Coolify

### Step 1: Install Plugin Files

```bash
# Copy plugin to your AnythingLLM storage
mkdir -p server/storage/plugins/agent-skills/
cp -r plugins/agent-skills/pipedream-integration/ server/storage/plugins/agent-skills/

# Or for Docker/Coolify (if accessing container)
docker exec anythingllm mkdir -p /app/server/storage/plugins/agent-skills/
docker cp plugins/agent-skills/pipedream-integration/ anythingllm:/app/server/storage/plugins/agent-skills/
```

### Step 2: Get Pipedream API Key

1. **Sign up**: Go to [Pipedream.com](https://pipedream.com) (Free tier available!)
2. **Get API Key**: 
   - Visit https://pipedream.com/settings/account
   - Copy your API key (starts with `pd_`)

### Step 3: Configure in AnythingLLM

1. **Access Admin**: AnythingLLM → Admin Settings → Agent Skills
2. **Find Plugin**: "Pipedream Workflow Integration"
3. **Configure**:
   ```
   PIPEDREAM_API_KEY: pd_your_actual_api_key_here
   DEFAULT_TIMEOUT: 30
   ENABLE_ASYNC_EXECUTION: true
   ```

### Step 4: Create Your First Workflow

1. **Go to Pipedream**: https://pipedream.com/workflows
2. **New Workflow**: Click "New Workflow"
3. **Add HTTP Trigger**: Choose "HTTP / Webhook Requests"
4. **Add Action**: Choose any service (Slack, Email, etc.)
5. **Deploy**: Save your workflow
6. **Copy URL**: Note the endpoint URL (e.g., `https://eo123abc.m.pipedream.net`)

### Step 5: Test Integration

In AnythingLLM chat with agent enabled:
```
"Execute workflow https://eo123abc.m.pipedream.net with message Hello from AnythingLLM"
```

## 🎯 Real-World Examples

### 📢 Slack Notifications
**Workflow**: HTTP Trigger → Slack Action
**Usage**: 
```
"Send Slack message to #general: Project milestone completed!"
```

### 📧 Email Automation
**Workflow**: HTTP Trigger → SendGrid/Mailgun Action
**Usage**:
```
"Send welcome email to john@example.com with name John Doe"
```

### 🗂️ CRM Integration
**Workflow**: HTTP Trigger → Salesforce/HubSpot Action
**Usage**:
```
"Add new lead: Alice Smith, email alice@example.com, company TechCorp"
```

### 📊 Google Sheets
**Workflow**: HTTP Trigger → Google Sheets Action
**Usage**:
```
"Add row to spreadsheet: customer John, email john@test.com, date today"
```

### 🐦 Social Media
**Workflow**: HTTP Trigger → Twitter API Action
**Usage**:
```
"Post to Twitter: Just launched our new AI feature! #AI #Innovation"
```

### 📋 Notion Database
**Workflow**: HTTP Trigger → Notion Action
**Usage**:
```
"Create Notion page: Task Review code, priority High, due tomorrow"
```

## 🛠️ Creating Powerful Workflows

### Basic Slack Notification Workflow

1. **Trigger**: HTTP / Webhook
2. **Code Step** (optional processing):
```javascript
export default defineComponent({
  async run({ steps, $ }) {
    // Get data from AnythingLLM
    const { message, channel = "#general", priority = "normal" } = steps.trigger.event.body;
    
    // Add emoji based on priority
    const emoji = priority === "high" ? "🚨" : priority === "low" ? "ℹ️" : "📢";
    
    return {
      formatted_message: `${emoji} ${message}`,
      target_channel: channel
    };
  }
})
```

3. **Slack Action**:
```javascript
await $.send.slack({
  text: steps.code.return_value.formatted_message,
  channel: steps.code.return_value.target_channel
});
```

### Advanced CRM + Email Workflow

1. **HTTP Trigger** receives customer data
2. **Code Step** validates and enriches data
3. **CRM Action** adds customer to Salesforce
4. **Email Action** sends welcome email
5. **Slack Action** notifies sales team

```javascript
// Step 2: Data processing
export default defineComponent({
  async run({ steps, $ }) {
    const customer = steps.trigger.event.body;
    
    // Validate required fields
    if (!customer.email || !customer.name) {
      throw new Error("Missing required fields: email and name");
    }
    
    // Enrich data
    return {
      ...customer,
      created_at: new Date().toISOString(),
      source: "AnythingLLM",
      lead_score: customer.company ? 85 : 60
    };
  }
})
```

## ⚙️ Advanced Configuration

### Pre-configured Workflow Endpoints

Save frequently used workflows in `WORKFLOW_ENDPOINTS`:

```
slack-urgent:https://eo123abc.m.pipedream.net
email-welcome:https://eo456def.m.pipedream.net
crm-lead:https://eo789ghi.m.pipedream.net
twitter-post:https://eo012jkl.m.pipedream.net
sheets-log:https://eo345mno.m.pipedream.net
notion-task:https://eo678pqr.m.pipedream.net
```

Then use by name:
```
"Execute my slack-urgent workflow with message: Server is down!"
"Run my email-welcome workflow for customer Alice Smith, email alice@example.com"
```

### Async Execution for Long Workflows

Enable for time-consuming workflows:
```
ENABLE_ASYNC_EXECUTION: true
```

Usage:
```
"Run my data-processing workflow asynchronously with large dataset"
```

## 🔗 Popular Pipedream Integrations

### Communication
- **Slack** - Team notifications and bot interactions
- **Discord** - Community engagement
- **Microsoft Teams** - Enterprise communication
- **Telegram** - Bot automation

### Email & Marketing
- **SendGrid** - Transactional emails
- **Mailchimp** - Email marketing
- **ConvertKit** - Creator email marketing
- **Postmark** - Email delivery

### CRM & Sales
- **Salesforce** - Enterprise CRM
- **HubSpot** - Inbound marketing and sales
- **Pipedrive** - Sales pipeline management
- **Airtable** - Database and CRM hybrid

### Productivity
- **Google Sheets** - Spreadsheet automation
- **Notion** - Knowledge management
- **Trello** - Project management
- **Asana** - Team collaboration

### Development
- **GitHub** - Code repository management
- **Jira** - Issue tracking
- **Linear** - Modern issue tracking
- **Vercel** - Deployment automation

### Social Media
- **Twitter** - Social media posting
- **LinkedIn** - Professional networking
- **Instagram** - Visual content
- **YouTube** - Video platform

### E-commerce
- **Shopify** - E-commerce platform
- **Stripe** - Payment processing
- **WooCommerce** - WordPress e-commerce
- **Square** - Point of sale

## 🔐 Security Best Practices

### API Key Management
- Store API keys securely in AnythingLLM settings only
- Use different API keys for development/production
- Regularly rotate API keys
- Never hardcode keys in workflows

### Workflow Security
- Validate all input data in workflows
- Use Pipedream's built-in secret management
- Implement rate limiting for public endpoints
- Add authentication to sensitive workflows

### Access Control
- Use workspace-specific configurations when possible
- Monitor workflow execution logs
- Set up alerts for unusual activity
- Review permissions regularly

## 🔍 Troubleshooting Guide

### Plugin Not Loading
1. **Check file location**: Ensure files are in `server/storage/plugins/agent-skills/pipedream-integration/`
2. **Restart AnythingLLM**: Some changes require a restart
3. **Check logs**: Look for plugin loading errors

### API Authentication Issues
1. **Verify API key**: Check it starts with `pd_` and is from https://pipedream.com/settings/account
2. **Check permissions**: Ensure API key has necessary permissions
3. **Test separately**: Try API key directly with Pipedream API

### Workflow Execution Failures
1. **Test workflow directly**: Run workflow in Pipedream dashboard first
2. **Check data format**: Ensure data sent matches what workflow expects
3. **Review Pipedream logs**: Check execution logs in Pipedream dashboard
4. **Validate JSON**: Ensure data is valid JSON format

### Timeout Issues
1. **Increase timeout**: Adjust `DEFAULT_TIMEOUT` setting
2. **Use async execution**: Enable for long-running workflows
3. **Optimize workflow**: Reduce processing time in Pipedream
4. **Split workflows**: Break complex workflows into smaller parts

## 📊 Monitoring & Analytics

### Plugin Monitoring
```
"List all my Pipedream workflows"
"Get status of workflow wf_abc123"
```

### Pipedream Dashboard
- View execution history and logs
- Monitor performance and errors
- Track usage and billing
- Set up alerts for failures

### Performance Optimization
- Use async execution for heavy workflows
- Cache frequently used data
- Optimize data transfer size
- Use Pipedream's built-in caching

## 🌟 Pro Tips

### 1. **Start Simple**
Begin with basic workflows (HTTP → Slack) before building complex automations.

### 2. **Use Templates**
Pipedream has hundreds of pre-built workflow templates.

### 3. **Error Handling**
Always add error handling and fallbacks in your workflows.

### 4. **Test Thoroughly**
Test workflows with different data formats and edge cases.

### 5. **Monitor Usage**
Keep track of your Pipedream execution quota and costs.

### 6. **Document Workflows**
Add clear descriptions to your workflows for team collaboration.

## 💰 Cost Considerations

### Pipedream Pricing
- **Free**: 100 workflow executions/day
- **Basic**: $19/month for 1,000 executions/day
- **Advanced**: $49/month for 10,000 executions/day
- **Business**: Custom pricing for enterprise needs

### Plugin Costs
- The plugin itself is completely free
- You only pay for Pipedream usage
- No additional fees or subscriptions

## 🚀 Next Steps

1. **Install the plugin** following this guide
2. **Create your first workflow** in Pipedream
3. **Test with simple data** to verify connectivity
4. **Build useful automations** for your team
5. **Share workflows** with your organization
6. **Monitor and optimize** performance

## 📞 Support & Resources

### Documentation
- **Pipedream Docs**: https://pipedream.com/docs
- **API Reference**: https://pipedream.com/docs/api/rest/
- **Component Library**: https://pipedream.com/apps

### Community
- **AnythingLLM Discord**: https://discord.gg/6UyHPeGZAC
- **Pipedream Community**: https://pipedream.com/community
- **GitHub Issues**: https://github.com/anlaklab/anything-llm/issues

---

**🎉 Ready to supercharge your AnythingLLM with 1000+ integrations? Start building your first Pipedream workflow today!**