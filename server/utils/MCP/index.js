const MCPHypervisor = require("./hypervisor");
const PipedreamMCPServer = require("./pipedream-server");

class MCPCompatibilityLayer extends MCPHypervisor {
  static _instance;

  constructor() {
    super();
    if (MCPCompatibilityLayer._instance) return MCPCompatibilityLayer._instance;
    MCPCompatibilityLayer._instance = this;
    this.pipedreamMCP = new PipedreamMCPServer();
  }

  /**
   * Get all of the active MCP servers as plugins we can load into agents.
   * This will also boot all MCP servers if they have not been started yet.
   * @returns {Promise<string[]>} Array of flow names in @@mcp_{name} format
   */
  async activeMCPServers() {
    await this.bootMCPServers();
    const standardServers = Object.keys(this.mcps).flatMap((name) => `@@mcp_${name}`);
    
    // Add Pipedream as a special MCP server if configured
    if (this.isPipedreamConfigured()) {
      standardServers.push("@@mcp_pipedream");
    }
    
    return standardServers;
  }

  /**
   * Check if Pipedream MCP is configured
   * @returns {boolean} True if Pipedream is configured
   */
  isPipedreamConfigured() {
    return !!(process.env.PIPEDREAM_CLIENT_ID && process.env.PIPEDREAM_CLIENT_SECRET);
  }

  /**
   * Convert an MCP server name to an AnythingLLM Agent plugin
   * @param {string} name - The base name of the MCP server to convert - not the tool name. eg: `docker-mcp` not `docker-mcp:list-containers`
   * @param {Object} aibitat - The aibitat object to pass to the plugin
   * @returns {Promise<{name: string, description: string, plugin: Function}[]|null>} Array of plugin configurations or null if not found
   */
  async convertServerToolsToPlugins(name, _aibitat = null) {
    // Handle special case for Pipedream MCP
    if (name === "pipedream") {
      return await this.convertPipedreamToolsToPlugins(_aibitat);
    }

    const mcp = this.mcps[name];
    if (!mcp) return null;

    const tools = (await mcp.listTools()).tools;
    if (!tools.length) return null;

    const plugins = [];
    for (const tool of tools) {
      plugins.push({
        name: `${name}-${tool.name}`,
        description: tool.description,
        plugin: function () {
          return {
            name: `${name}-${tool.name}`,
            setup: (aibitat) => {
              aibitat.function({
                super: aibitat,
                name: `${name}-${tool.name}`,
                controller: new AbortController(),
                description: tool.description,
                examples: [],
                parameters: {
                  $schema: "http://json-schema.org/draft-07/schema#",
                  ...tool.inputSchema,
                },
                handler: async function (args = {}) {
                  try {
                    aibitat.handlerProps.log(
                      `Executing MCP server: ${name}:${tool.name} with args:`,
                      args
                    );
                    aibitat.introspect(
                      `Executing MCP server: ${name} with ${JSON.stringify(args, null, 2)}`
                    );
                    const result = await mcp.callTool({
                      name: tool.name,
                      arguments: args,
                    });
                    aibitat.handlerProps.log(
                      `MCP server: ${name}:${tool.name} completed successfully`,
                      result
                    );
                    aibitat.introspect(
                      `MCP server: ${name}:${tool.name} completed successfully`
                    );
                    return typeof result === "object"
                      ? JSON.stringify(result)
                      : String(result);
                  } catch (error) {
                    aibitat.handlerProps.log(
                      `MCP server: ${name}:${tool.name} failed with error:`,
                      error
                    );
                    aibitat.introspect(
                      `MCP server: ${name}:${tool.name} failed with error:`,
                      error
                    );
                    return `The tool ${name}:${tool.name} failed with error: ${error?.message || "An unknown error occurred"}`;
                  }
                },
              });
            },
          };
        },
        toolName: `${name}:${tool.name}`,
      });
    }

    return plugins;
  }

  /**
   * Returns the MCP servers that were loaded or attempted to be loaded
   * so that we can display them in the frontend for review or error logging.
   * @returns {Promise<{
   *   name: string,
   *   running: boolean,
   *   tools: {name: string, description: string, inputSchema: Object}[],
   *   process: {pid: number, cmd: string}|null,
   *   error: string|null
   * }[]>} - The active MCP servers
   */
  async servers() {
    await this.bootMCPServers();
    const servers = [];
    for (const [name, result] of Object.entries(this.mcpLoadingResults)) {
      const config = this.mcpServerConfigs.find((s) => s.name === name);

      if (result.status === "failed") {
        servers.push({
          name,
          config: config?.server || null,
          running: false,
          tools: [],
          error: result.message,
          process: null,
        });
        continue;
      }

      const mcp = this.mcps[name];
      if (!mcp) {
        delete this.mcpLoadingResults[name];
        delete this.mcps[name];
        continue;
      }

      const online = !!(await mcp.ping());
      const tools = online ? (await mcp.listTools()).tools : [];
      servers.push({
        name,
        config: config?.server || null,
        running: online,
        tools,
        error: null,
        process: {
          pid: mcp.transport?.process?.pid || null,
        },
      });
    }
    return servers;
  }

  /**
   * Toggle the MCP server (start or stop)
   * @param {string} name - The name of the MCP server to toggle
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  async toggleServerStatus(name) {
    const server = this.mcpServerConfigs.find((s) => s.name === name);
    if (!server)
      return {
        success: false,
        error: `MCP server ${name} not found in config file.`,
      };
    const mcp = this.mcps[name];
    const online = !!mcp ? !!(await mcp.ping()) : false; // If the server is not in the mcps object, it is not running

    if (online) {
      const killed = this.pruneMCPServer(name);
      return {
        success: killed,
        error: killed ? null : `Failed to kill MCP server: ${name}`,
      };
    } else {
      const startupResult = await this.startMCPServer(name);
      return { success: startupResult.success, error: startupResult.error };
    }
  }

  /**
   * Delete the MCP server - will also remove it from the config file
   * @param {string} name - The name of the MCP server to delete
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  async deleteServer(name) {
    const server = this.mcpServerConfigs.find((s) => s.name === name);
    if (!server)
      return {
        success: false,
        error: `MCP server ${name} not found in config file.`,
      };

    const mcp = this.mcps[name];
    const online = !!mcp ? !!(await mcp.ping()) : false; // If the server is not in the mcps object, it is not running
    if (online) this.pruneMCPServer(name);
    this.removeMCPServerFromConfig(name);

    delete this.mcps[name];
    delete this.mcpLoadingResults[name];
    this.log(`MCP server was killed and removed from config file: ${name}`);
    return { success: true, error: null };
  }

  /**
   * Convert Pipedream tools to AnythingLLM Agent plugins with OAuth2 handling
   * @param {Object} aibitat - The aibitat object to pass to the plugin
   * @returns {Promise<{name: string, description: string, plugin: Function}[]>} Array of plugin configurations
   */
  async convertPipedreamToolsToPlugins(_aibitat = null) {
    if (!this.isPipedreamConfigured()) {
      return [{
        name: "pipedream-auth-required",
        description: "Pipedream OAuth2 authentication required",
        plugin: function () {
          return {
            name: "pipedream-auth-required",
            setup: (aibitat) => {
              aibitat.function({
                super: aibitat,
                name: "pipedream-auth-required",
                controller: new AbortController(),
                description: "Authenticate with Pipedream to access 2,700+ APIs and tools",
                examples: ["Connect to Pipedream", "Setup Pipedream authentication"],
                parameters: {
                  $schema: "http://json-schema.org/draft-07/schema#",
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      enum: ["authenticate"],
                      description: "Action to perform"
                    }
                  },
                  required: ["action"]
                },
                handler: async function (args = {}) {
                  try {
                    return `🔐 **Pipedream Authentication Required**

To use Pipedream's 2,700+ APIs and tools, you need to configure OAuth2 credentials:

1. **Get Pipedream OAuth credentials:**
   - Go to https://pipedream.com/settings/account
   - Create a new OAuth app or use existing credentials
   - Copy your Client ID and Client Secret

2. **Configure environment variables:**
   - Set PIPEDREAM_CLIENT_ID=your_client_id
   - Set PIPEDREAM_CLIENT_SECRET=your_client_secret
   - Set PIPEDREAM_PROJECT_ID=your_project_id (optional)

3. **Restart AnythingLLM** to enable Pipedream integration

Once configured, you'll have access to tools for Slack, Gmail, Notion, GitHub, and 2,700+ more APIs with automatic OAuth2 handling.`;
                  } catch (error) {
                    return `Error: ${error.message}`;
                  }
                },
              });
            },
          };
        },
        toolName: "pipedream:auth-required"
      }];
    }

    // Return dynamic Pipedream tools that handle OAuth2 flow
    return [{
      name: "pipedream-tool-discovery",
      description: "Discover and execute Pipedream tools with automatic OAuth2 authentication",
      plugin: function () {
        return {
          name: "pipedream-tool-discovery",
          setup: (aibitat) => {
            aibitat.function({
              super: aibitat,
              name: "pipedream-tool-discovery",
              controller: new AbortController(),
              description: "Access 2,700+ APIs through Pipedream with automatic OAuth2 authentication. Supports Slack, Gmail, Notion, GitHub, Google Sheets, Discord, Twitter, LinkedIn, HubSpot, Salesforce, Airtable, Trello, Asana, Zoom, Calendar, and many more.",
              examples: [
                "Send a message to Slack channel #general",
                "Create a new row in Google Sheets",
                "Send an email via Gmail",
                "Create a Notion page",
                "Post a tweet on Twitter",
                "Create a GitHub issue"
              ],
              parameters: {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["discover", "execute", "auth_status", "connect"],
                    description: "Action to perform: discover tools, execute a tool, check auth status, or connect to an app"
                  },
                  app: {
                    type: "string",
                    description: "App slug (e.g., 'slack', 'gmail', 'notion', 'github', 'google-sheets')"
                  },
                  tool_name: {
                    type: "string",
                    description: "Name of the tool to execute"
                  },
                  args: {
                    type: "object",
                    description: "Arguments to pass to the tool"
                  },
                  user_id: {
                    type: "string",
                    description: "User identifier for authentication (defaults to session user)"
                  }
                },
                required: ["action"]
              },
              handler: async function (args = {}) {
                try {
                  const { action, app, tool_name, args: toolArgs, user_id } = args;
                  const userId = user_id || aibitat.handlerProps?.userId || "default-user";
                  const pipedreamMCP = new (require("../MCP/pipedream-server"))();

                  aibitat.handlerProps.log(`Pipedream ${action} requested for user: ${userId}`);

                  switch (action) {
                    case "auth_status":
                      const isAuthenticated = pipedreamMCP.isUserAuthenticated(userId);
                      if (!isAuthenticated) {
                        const authUrl = pipedreamMCP.generateAuthUrl(userId);
                        return `🔐 **Authentication Required**

You need to authenticate with Pipedream to access APIs. Please visit:
${authUrl}

After authentication, you'll have access to 2,700+ APIs including:
• **Communication:** Slack, Discord, Gmail, Teams
• **Productivity:** Notion, Google Sheets, Airtable, Trello
• **Development:** GitHub, GitLab, Jira
• **Marketing:** HubSpot, Mailchimp, Twitter, LinkedIn
• **And many more...**`;
                      }
                      
                      const availableApps = await pipedreamMCP.getAvailableApps(userId);
                      return `✅ **Authenticated with Pipedream**

Available apps: ${availableApps.join(", ")}

You can now use tools like:
• "discover slack" - See available Slack tools
• "execute slack send_message" - Send Slack messages
• "execute gmail send_email" - Send emails`;

                    case "connect":
                      if (!app) {
                        return "❓ **App required** - Specify which app to connect (e.g., 'slack', 'gmail', 'notion')";
                      }
                      
                      if (!pipedreamMCP.isUserAuthenticated(userId)) {
                        const authUrl = pipedreamMCP.generateAuthUrl(userId);
                        return `🔐 **Please authenticate first:** ${authUrl}`;
                      }

                      return `🔌 **Connecting to ${app}...**

Once connected, you'll be able to use ${app} tools directly through the agent.`;

                    case "discover":
                      if (!app) {
                        const availableApps = await pipedreamMCP.getAvailableApps(userId);
                        return `📋 **Available Pipedream Apps:**

${availableApps.map(appName => `• **${appName}** - Use "discover ${appName}" to see tools`).join('\n')}

Popular apps:
• **slack** - Send messages, create channels, manage users
• **gmail** - Send emails, manage inbox
• **notion** - Create pages, update databases
• **github** - Create issues, manage repos
• **google-sheets** - Create rows, update cells`;
                      }

                      if (!pipedreamMCP.isUserAuthenticated(userId)) {
                        const authUrl = pipedreamMCP.generateAuthUrl(userId);
                        return `🔐 **Authentication required:** ${authUrl}`;
                      }

                      const tools = await pipedreamMCP.discoverTools(userId, app);
                      if (!tools.length) {
                        return `📋 **No tools found for ${app}** - The app may need additional setup or permissions.`;
                      }

                      return `🔧 **${app} Tools:**

${tools.map(tool => `• **${tool.name}** - ${tool.description}`).join('\n')}

Use "execute ${app} <tool_name>" to run a tool.`;

                    case "execute":
                      if (!app || !tool_name) {
                        return "❓ **App and tool name required** - e.g., 'execute slack send_message'";
                      }

                      if (!pipedreamMCP.isUserAuthenticated(userId)) {
                        const authUrl = pipedreamMCP.generateAuthUrl(userId);
                        return `🔐 **Authentication required:** ${authUrl}`;
                      }

                      const result = await pipedreamMCP.executeTool(userId, app, tool_name, toolArgs || {});
                      
                      if (result.success) {
                        return `✅ **${app}:${tool_name} executed successfully**

${typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}`;
                      } else {
                        return `❌ **${app}:${tool_name} failed**

Error: ${result.error}`;
                      }

                    default:
                      return `❓ **Unknown action:** ${action}

Available actions:
• **auth_status** - Check authentication status
• **connect** - Connect to an app
• **discover** - Discover available tools
• **execute** - Execute a specific tool`;
                  }
                } catch (error) {
                  aibitat.handlerProps.log(`Pipedream tool error:`, error);
                  return `❌ **Pipedream tool failed:** ${error.message}

This might be due to:
• Authentication issues - Check your Pipedream connection
• Invalid app or tool name
• Missing required parameters
• Network connectivity issues`;
                }
              },
            });
          },
        };
      },
      toolName: "pipedream:tool-discovery"
    }];
  }
}
module.exports = MCPCompatibilityLayer;
