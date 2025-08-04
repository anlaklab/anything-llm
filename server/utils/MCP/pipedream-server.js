const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { SSEClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js");
const crypto = require("crypto");
const { safeJsonParse } = require("../http");
const fs = require("fs");
const path = require("path");

/**
 * Pipedream MCP Server with OAuth2 Integration
 * Provides seamless authentication and tool discovery for Pipedream's 2,700+ APIs
 */
class PipedreamMCPServer {
  constructor(options = {}) {
    this.clientId = options.clientId || process.env.PIPEDREAM_CLIENT_ID;
    this.clientSecret = options.clientSecret || process.env.PIPEDREAM_CLIENT_SECRET;
    this.projectId = options.projectId || process.env.PIPEDREAM_PROJECT_ID;
    this.environment = options.environment || process.env.PIPEDREAM_PROJECT_ENVIRONMENT || "production";
    this.baseUrl = options.baseUrl || "https://api.pipedream.com";
    this.mcpServerUrl = options.mcpServerUrl || "https://mcp.pipedream.com";
    
    this.userTokens = new Map(); // In-memory token storage (should be persistent in production)
    this.authenticatedClients = new Map();
    this.availableApps = new Set();
    
    this.tokenStoragePath = path.resolve(
      process.env.STORAGE_DIR || path.resolve(__dirname, '../../../storage'),
      'pipedream_tokens.json'
    );
    
    this.loadTokens();
  }

  /**
   * Load stored tokens from persistent storage
   */
  loadTokens() {
    try {
      if (fs.existsSync(this.tokenStoragePath)) {
        const tokens = safeJsonParse(fs.readFileSync(this.tokenStoragePath, 'utf8'), {});
        this.userTokens = new Map(Object.entries(tokens));
      }
    } catch (error) {
      console.warn('Failed to load Pipedream tokens:', error.message);
    }
  }

  /**
   * Save tokens to persistent storage
   */
  saveTokens() {
    try {
      const tokensObj = Object.fromEntries(this.userTokens);
      fs.writeFileSync(this.tokenStoragePath, JSON.stringify(tokensObj, null, 2));
    } catch (error) {
      console.error('Failed to save Pipedream tokens:', error.message);
    }
  }

  /**
   * Generate OAuth2 authorization URL for a user
   * @param {string} userId - Unique user identifier
   * @param {string[]} scopes - OAuth scopes (optional)
   * @returns {string} Authorization URL
   */
  generateAuthUrl(userId, scopes = []) {
    const state = crypto.randomBytes(32).toString('hex');
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: `${userId}:${state}`,
      scope: scopes.join(' ') || 'read:apps write:apps',
      redirect_uri: this.getRedirectUri()
    });

    // Store state for verification
    this.userTokens.set(`state:${state}`, { userId, timestamp: Date.now() });
    this.saveTokens();

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Get the OAuth redirect URI
   * @returns {string} Redirect URI
   */
  getRedirectUri() {
    return process.env.PIPEDREAM_OAUTH_REDIRECT_URI || 'http://localhost:3001/api/oauth/pipedream/callback';
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code
   * @param {string} state - State parameter for verification
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code, state) {
    const [userId, stateToken] = state.split(':');
    const storedState = this.userTokens.get(`state:${stateToken}`);
    
    if (!storedState || storedState.userId !== userId) {
      throw new Error('Invalid state parameter');
    }

    const tokenRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.getRedirectUri()
      })
    };

    const response = await fetch(`${this.baseUrl}/oauth/token`, tokenRequest);
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Store token for user
    this.userTokens.set(userId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      token_type: tokenData.token_type || 'Bearer'
    });

    // Clean up state
    this.userTokens.delete(`state:${stateToken}`);
    this.saveTokens();

    return tokenData;
  }

  /**
   * Refresh an expired access token
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} New token data
   */
  async refreshToken(userId) {
    const tokenData = this.userTokens.get(userId);
    if (!tokenData || !tokenData.refresh_token) {
      throw new Error('No refresh token available');
    }

    const refreshRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    };

    const response = await fetch(`${this.baseUrl}/oauth/token`, refreshRequest);
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const newTokenData = await response.json();
    
    // Update stored token
    this.userTokens.set(userId, {
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token || tokenData.refresh_token,
      expires_at: Date.now() + (newTokenData.expires_in * 1000),
      token_type: newTokenData.token_type || 'Bearer'
    });

    this.saveTokens();
    return newTokenData;
  }

  /**
   * Get valid access token for user (refresh if necessary)
   * @param {string} userId - User identifier
   * @returns {Promise<string>} Valid access token
   */
  async getValidToken(userId) {
    const tokenData = this.userTokens.get(userId);
    if (!tokenData) {
      throw new Error('User not authenticated');
    }

    // Check if token is expired (with 5 minute buffer)
    if (tokenData.expires_at && Date.now() > (tokenData.expires_at - 300000)) {
      await this.refreshToken(userId);
      return this.userTokens.get(userId).access_token;
    }

    return tokenData.access_token;
  }

  /**
   * Create authenticated MCP client for user
   * @param {string} userId - User identifier
   * @param {string} app - App slug (e.g., 'slack', 'gmail', 'notion')
   * @returns {Promise<Client>} Authenticated MCP client
   */
  async createAuthenticatedClient(userId, app) {
    const clientKey = `${userId}:${app}`;
    
    // Return existing client if available
    if (this.authenticatedClients.has(clientKey)) {
      return this.authenticatedClients.get(clientKey);
    }

    try {
      const token = await this.getValidToken(userId);
      
      // Create SSE transport with authentication
      const transport = new SSEClientTransport(
        new URL(`${this.mcpServerUrl}/${app}/sse`),
        {
          requestInit: {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-External-User-ID': userId,
              'X-Pipedream-Project-ID': this.projectId,
              'X-Pipedream-Environment': this.environment
            }
          }
        }
      );

      const client = new Client({ name: `pipedream-${app}`, version: "1.0.0" });
      await client.connect(transport);

      // Store authenticated client
      this.authenticatedClients.set(clientKey, client);
      
      // Add app to available apps
      this.availableApps.add(app);
      
      return client;
    } catch (error) {
      throw new Error(`Failed to create authenticated client for ${app}: ${error.message}`);
    }
  }

  /**
   * Discover available tools for a user and app
   * @param {string} userId - User identifier
   * @param {string} app - App slug
   * @returns {Promise<Object[]>} Available tools
   */
  async discoverTools(userId, app) {
    const client = await this.createAuthenticatedClient(userId, app);
    const toolsResponse = await client.listTools();
    return toolsResponse.tools || [];
  }

  /**
   * Execute a tool for authenticated user
   * @param {string} userId - User identifier
   * @param {string} app - App slug
   * @param {string} toolName - Tool name to execute
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(userId, app, toolName, args = {}) {
    const client = await this.createAuthenticatedClient(userId, app);
    
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Check if user is authenticated
   * @param {string} userId - User identifier
   * @returns {boolean} Authentication status
   */
  isUserAuthenticated(userId) {
    return this.userTokens.has(userId);
  }

  /**
   * Get available apps for user
   * @param {string} userId - User identifier
   * @returns {Promise<string[]>} Available app slugs
   */
  async getAvailableApps(userId) {
    if (!this.isUserAuthenticated(userId)) {
      return [];
    }

    // You could make an API call to get user's connected apps
    // For now, return a default set of popular apps
    return [
      'slack', 'gmail', 'notion', 'google-sheets', 'github', 
      'discord', 'twitter', 'linkedin', 'hubspot', 'salesforce',
      'airtable', 'trello', 'asana', 'zoom', 'calendar'
    ];
  }

  /**
   * Disconnect user authentication
   * @param {string} userId - User identifier
   */
  disconnectUser(userId) {
    // Close all clients for this user
    for (const [clientKey, client] of this.authenticatedClients.entries()) {
      if (clientKey.startsWith(`${userId}:`)) {
        client.close();
        this.authenticatedClients.delete(clientKey);
      }
    }

    // Remove tokens
    this.userTokens.delete(userId);
    this.saveTokens();
  }

  /**
   * Clean up expired tokens and inactive clients
   */
  cleanup() {
    const now = Date.now();
    
    // Remove expired tokens
    for (const [key, tokenData] of this.userTokens.entries()) {
      if (key.startsWith('state:')) {
        // Remove state tokens older than 1 hour
        if (now - tokenData.timestamp > 3600000) {
          this.userTokens.delete(key);
        }
      } else if (tokenData.expires_at && now > tokenData.expires_at) {
        // Remove expired tokens that can't be refreshed
        if (!tokenData.refresh_token) {
          this.userTokens.delete(key);
        }
      }
    }

    this.saveTokens();
  }
}

module.exports = PipedreamMCPServer;