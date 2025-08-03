const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Pipedream Workflow Integration Plugin for AnythingLLM
 * Connects to Pipedream's automation platform to execute workflows
 * and integrate with 1000+ APIs and services
 * 
 * @param {Object} config - Plugin configuration from setup_args
 */

// Helper function to make HTTP/HTTPS requests
function makeHttpRequest(options, data = null, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const isHttps = options.protocol === 'https:' || options.port === 443;
    const lib = isHttps ? https : http;
    
    const req = lib.request(options, (res) => {
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

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper function to parse workflow endpoints from configuration
function parseWorkflowEndpoints(endpointsString) {
  if (!endpointsString) return {};
  
  const endpoints = {};
  const lines = endpointsString.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const [name, url] = line.split(':').map(part => part.trim());
    if (name && url) {
      endpoints[name] = url.startsWith('http') ? url : `https://${url}`;
    }
  }
  
  return endpoints;
}

// Helper function to validate Pipedream URL
function isValidPipedreamUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('pipedream.net') || 
           parsedUrl.hostname.includes('pipedream.com') ||
           parsedUrl.hostname.includes('m.pipedream.net');
  } catch {
    return false;
  }
}

// Pipedream API integration class
class PipedreamAPI {
  constructor(apiKey, baseUrl = 'https://api.pipedream.com/v1', workspaceId = null) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.workspaceId = workspaceId;
  }

  // Get request headers for Pipedream API
  getHeaders(customHeaders = {}) {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AnythingLLM-Pipedream-Plugin/1.0.0',
      ...customHeaders
    };
  }

  // Execute a workflow by URL (direct endpoint)
  async executeWorkflowByUrl(workflowUrl, data = {}, method = 'POST', customHeaders = {}, timeout = 30000) {
    if (!isValidPipedreamUrl(workflowUrl)) {
      throw new Error(`Invalid Pipedream URL: ${workflowUrl}`);
    }

    const url = new URL(workflowUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders
      }
    };

    try {
      const response = await makeHttpRequest(options, data, timeout);
      return {
        success: response.statusCode >= 200 && response.statusCode < 300,
        statusCode: response.statusCode,
        data: response.body,
        headers: response.headers
      };
    } catch (error) {
      throw new Error(`Failed to execute workflow: ${error.message}`);
    }
  }

  // List workflows using Pipedream API
  async listWorkflows() {
    const url = new URL(`${this.baseUrl}/workflows`);
    if (this.workspaceId) {
      url.searchParams.append('workspace_id', this.workspaceId);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: this.getHeaders()
    };

    try {
      const response = await makeHttpRequest(options);
      if (response.statusCode === 200) {
        return response.body;
      }
      throw new Error(`API error: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    } catch (error) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  // Get workflow status
  async getWorkflowStatus(workflowId) {
    const url = new URL(`${this.baseUrl}/workflows/${workflowId}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: this.getHeaders()
    };

    try {
      const response = await makeHttpRequest(options);
      if (response.statusCode === 200) {
        return response.body;
      }
      throw new Error(`API error: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }
  }

  // Create a webhook (requires Pro plan)
  async createWebhook(name, eventType = 'http') {
    const url = new URL(`${this.baseUrl}/sources`);
    
    const webhookData = {
      name: name,
      component: {
        key: 'http',
        version: '0.0.1'
      }
    };

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: this.getHeaders()
    };

    try {
      const response = await makeHttpRequest(options, webhookData);
      if (response.statusCode === 200 || response.statusCode === 201) {
        return response.body;
      }
      throw new Error(`API error: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }
}

// Format workflow execution result for display
function formatWorkflowResult(result, workflowName = 'Unknown') {
  if (!result.success) {
    return `❌ **Workflow "${workflowName}" failed**\n\n**Status Code:** ${result.statusCode}\n**Error:** ${JSON.stringify(result.data, null, 2)}`;
  }

  let output = `✅ **Workflow "${workflowName}" executed successfully**\n\n`;
  output += `**Status Code:** ${result.statusCode}\n`;
  
  if (result.data) {
    if (typeof result.data === 'string') {
      output += `**Response:** ${result.data}`;
    } else {
      output += `**Response Data:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``;
    }
  }

  return output;
}

// Format workflows list for display
function formatWorkflowsList(workflows) {
  if (!workflows || workflows.length === 0) {
    return '📋 **No workflows found**\n\nCreate workflows at https://pipedream.com to get started.';
  }

  let output = `📋 **Your Pipedream Workflows (${workflows.length}):**\n\n`;
  
  workflows.forEach((workflow, index) => {
    output += `${index + 1}. **${workflow.name || 'Untitled'}**\n`;
    output += `   🆔 ID: \`${workflow.id}\`\n`;
    output += `   📊 Status: ${workflow.active ? '🟢 Active' : '🔴 Inactive'}\n`;
    
    if (workflow.summary) {
      output += `   📝 ${workflow.summary}\n`;
    }
    
    if (workflow.endpoint) {
      output += `   🔗 Endpoint: \`${workflow.endpoint}\`\n`;
    }
    
    output += '\n';
  });

  return output;
}

module.exports.runtime = {
  handler: async function ({ 
    action, 
    workflow_name, 
    workflow_url, 
    workflow_id, 
    data, 
    headers, 
    method, 
    async: asyncExecution, 
    timeout, 
    webhook_name, 
    event_type,
    runtimeArgs 
  }) {
    try {
      // Get configuration from setup_args
      const apiKey = runtimeArgs?.PIPEDREAM_API_KEY;
      const baseUrl = runtimeArgs?.PIPEDREAM_BASE_URL || 'https://api.pipedream.com/v1';
      const workspaceId = runtimeArgs?.DEFAULT_WORKSPACE_ID;
      const workflowEndpoints = parseWorkflowEndpoints(runtimeArgs?.WORKFLOW_ENDPOINTS || '');
      const defaultTimeout = parseInt(runtimeArgs?.DEFAULT_TIMEOUT || '30') * 1000;
      const enableAsync = runtimeArgs?.ENABLE_ASYNC_EXECUTION === 'true';

      // Validate API key
      if (!apiKey) {
        return `🔑 **Pipedream API Key Required**

To use Pipedream integration, you need to configure your API key:

1. **Get your API key:**
   - Go to https://pipedream.com/settings/account
   - Copy your API key (starts with 'pd_')

2. **Configure in AnythingLLM:**
   - Go to Admin Settings → Agent Skills
   - Find "Pipedream Workflow Integration"
   - Enter your API key in PIPEDREAM_API_KEY

3. **Set up workflows:**
   - Create workflows at https://pipedream.com
   - Configure workflow endpoints in the plugin settings`;
      }

      // Initialize Pipedream API
      const pipedream = new PipedreamAPI(apiKey, baseUrl, workspaceId);
      const requestTimeout = timeout ? timeout * 1000 : defaultTimeout;

      // Parse data and headers if provided as strings
      let parsedData = data;
      let parsedHeaders = headers;

      try {
        if (typeof data === 'string' && data.trim()) {
          parsedData = JSON.parse(data);
        }
      } catch (e) {
        parsedData = data; // Keep as string if not valid JSON
      }

      try {
        if (typeof headers === 'string' && headers.trim()) {
          parsedHeaders = JSON.parse(headers);
        }
      } catch (e) {
        parsedHeaders = {}; // Default to empty object
      }

      // Execute the requested action
      switch (action?.toLowerCase()) {
        case 'execute_workflow':
          let targetUrl = workflow_url;
          let workflowDisplayName = workflow_name || 'Direct URL';

          // Check if workflow_name refers to a pre-configured endpoint
          if (workflow_name && workflowEndpoints[workflow_name]) {
            targetUrl = workflowEndpoints[workflow_name];
            workflowDisplayName = workflow_name;
          }

          if (!targetUrl) {
            return `❓ **Missing Workflow URL**

You need to provide either:
- \`workflow_url\`: Direct Pipedream endpoint URL
- \`workflow_name\`: Name of pre-configured workflow

**Pre-configured workflows:**
${Object.keys(workflowEndpoints).length > 0 ? 
  Object.keys(workflowEndpoints).map(name => `• ${name}: ${workflowEndpoints[name]}`).join('\n') :
  'None configured. Add them in plugin settings under WORKFLOW_ENDPOINTS.'}

**Example usage:**
- "Execute my slack-notification workflow with message 'Hello World'"
- "Run workflow https://eo123abc.m.pipedream.net with customer data"`;
          }

          // Check for async execution
          if (asyncExecution === 'true' || asyncExecution === true) {
            if (!enableAsync) {
              return `⚠️ **Async execution is disabled**. Enable it in plugin settings to use async workflows.`;
            }
            
            // For async execution, we'd typically store the execution ID
            // For now, we'll just indicate it's been queued
            setTimeout(async () => {
              try {
                await pipedream.executeWorkflowByUrl(
                  targetUrl, 
                  parsedData || {}, 
                  method || 'POST', 
                  parsedHeaders || {}, 
                  requestTimeout
                );
              } catch (error) {
                console.error('Async workflow execution failed:', error);
              }
            }, 100);

            return `🚀 **Workflow "${workflowDisplayName}" queued for async execution**

The workflow has been started in the background. Check your Pipedream dashboard for execution status.

**Workflow:** ${targetUrl}
**Data sent:** ${parsedData ? JSON.stringify(parsedData, null, 2) : 'None'}`;
          }

          // Synchronous execution
          const result = await pipedream.executeWorkflowByUrl(
            targetUrl, 
            parsedData || {}, 
            method || 'POST', 
            parsedHeaders || {}, 
            requestTimeout
          );

          return formatWorkflowResult(result, workflowDisplayName);

        case 'list_workflows':
          const workflows = await pipedream.listWorkflows();
          return formatWorkflowsList(workflows.data || workflows);

        case 'get_workflow_status':
          if (!workflow_id) {
            return `❓ **Workflow ID required**

Please provide the workflow ID to check status.

**Example:** "Get status of workflow wf_abc123"`;
          }

          const status = await pipedream.getWorkflowStatus(workflow_id);
          
          let statusOutput = `📊 **Workflow Status: ${workflow_id}**\n\n`;
          statusOutput += `**Name:** ${status.name || 'Untitled'}\n`;
          statusOutput += `**Status:** ${status.active ? '🟢 Active' : '🔴 Inactive'}\n`;
          statusOutput += `**Created:** ${status.created_at ? new Date(status.created_at).toLocaleString() : 'Unknown'}\n`;
          statusOutput += `**Updated:** ${status.updated_at ? new Date(status.updated_at).toLocaleString() : 'Unknown'}\n`;
          
          if (status.summary) {
            statusOutput += `**Description:** ${status.summary}\n`;
          }

          return statusOutput;

        case 'create_webhook':
          if (!webhook_name) {
            return `❓ **Webhook name required**

Please provide a name for the new webhook.

**Example:** "Create webhook named 'anythingllm-trigger'"`;
          }

          const webhook = await pipedream.createWebhook(webhook_name, event_type || 'http');
          
          let webhookOutput = `🎣 **Webhook Created Successfully!**\n\n`;
          webhookOutput += `**Name:** ${webhook.name}\n`;
          webhookOutput += `**ID:** ${webhook.id}\n`;
          webhookOutput += `**URL:** ${webhook.endpoint_url}\n\n`;
          webhookOutput += `You can now send HTTP requests to this endpoint to trigger your workflows.`;

          return webhookOutput;

        default:
          return `❓ **Unknown action: ${action}**

**Available actions:**
• **execute_workflow** - Run a Pipedream workflow
• **list_workflows** - List all your workflows
• **get_workflow_status** - Check workflow status
• **create_webhook** - Create a new webhook endpoint

**Quick Examples:**
• "Execute my slack-notification workflow with message 'Hello!'"
• "List all my Pipedream workflows"
• "Get status of workflow wf_abc123"
• "Create webhook named 'my-trigger'"

**Setup workflows at:** https://pipedream.com`;
      }

    } catch (error) {
      return `❌ **Pipedream operation failed**

**Error:** ${error.message}

**Troubleshooting:**
1. **Check API Key:** Verify your Pipedream API key is correct
2. **Verify URLs:** Ensure workflow URLs are accessible
3. **Check Data Format:** Verify JSON data is properly formatted
4. **Network:** Ensure internet connectivity to Pipedream

**Need help?** Visit https://pipedream.com/docs or check the AnythingLLM logs.`;
    }
  }
};