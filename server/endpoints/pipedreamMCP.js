const { reqBody } = require("../utils/http");
const PipedreamMCPServer = require("../utils/MCP/pipedream-server");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");

function pipedreamMCPEndpoints(app) {
  if (!app) return;

  // Initialize Pipedream MCP server
  const pipedreamMCP = new PipedreamMCPServer();

  // Get OAuth authorization URL
  app.post(
    "/pipedream-mcp/auth/start",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { userId, scopes } = reqBody(request);
        
        if (!userId) {
          return response.status(400).json({
            success: false,
            error: "User ID is required"
          });
        }

        const authUrl = pipedreamMCP.generateAuthUrl(userId, scopes);
        
        return response.status(200).json({
          success: true,
          authUrl,
          message: "Navigate to the provided URL to authorize Pipedream access"
        });
      } catch (error) {
        console.error("Error starting Pipedream OAuth:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // OAuth callback handler
  app.get(
    "/api/oauth/pipedream/callback",
    async (request, response) => {
      try {
        const { code, state, error } = request.query;
        
        if (error) {
          return response.status(400).json({
            success: false,
            error: `OAuth error: ${error}`
          });
        }

        if (!code || !state) {
          return response.status(400).json({
            success: false,
            error: "Missing authorization code or state"
          });
        }

        const tokenData = await pipedreamMCP.exchangeCodeForToken(code, state);
        
        // Redirect to success page or close popup
        return response.send(`
          <html>
            <head><title>Pipedream Authorization Complete</title></head>
            <body>
              <h2>✅ Authorization Successful!</h2>
              <p>You can now close this window and return to AnythingLLM.</p>
              <script>
                // Try to communicate with parent window if this is a popup
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'PIPEDREAM_AUTH_SUCCESS',
                    data: { success: true }
                  }, '*');
                  window.close();
                }
                // Auto-close after 3 seconds if not a popup
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
          </html>
        `);
      } catch (error) {
        console.error("Error handling Pipedream OAuth callback:", error);
        return response.send(`
          <html>
            <head><title>Pipedream Authorization Error</title></head>
            <body>
              <h2>❌ Authorization Failed</h2>
              <p>Error: ${error.message}</p>
              <p>Please close this window and try again.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'PIPEDREAM_AUTH_ERROR',
                    data: { error: '${error.message}' }
                  }, '*');
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
      }
    }
  );

  // Check authentication status
  app.post(
    "/pipedream-mcp/auth/status",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { userId } = reqBody(request);
        
        if (!userId) {
          return response.status(400).json({
            success: false,
            error: "User ID is required"
          });
        }

        const isAuthenticated = pipedreamMCP.isUserAuthenticated(userId);
        const availableApps = isAuthenticated ? await pipedreamMCP.getAvailableApps(userId) : [];
        
        return response.status(200).json({
          success: true,
          authenticated: isAuthenticated,
          availableApps
        });
      } catch (error) {
        console.error("Error checking Pipedream auth status:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Discover tools for an app
  app.post(
    "/pipedream-mcp/tools/discover",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { userId, app } = reqBody(request);
        
        if (!userId || !app) {
          return response.status(400).json({
            success: false,
            error: "User ID and app are required"
          });
        }

        if (!pipedreamMCP.isUserAuthenticated(userId)) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated with Pipedream",
            requiresAuth: true
          });
        }

        const tools = await pipedreamMCP.discoverTools(userId, app);
        
        return response.status(200).json({
          success: true,
          app,
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            fullName: `pipedream-${app}-${tool.name}`
          }))
        });
      } catch (error) {
        console.error("Error discovering Pipedream tools:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Execute a tool
  app.post(
    "/pipedream-mcp/tools/execute",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { userId, app, toolName, args } = reqBody(request);
        
        if (!userId || !app || !toolName) {
          return response.status(400).json({
            success: false,
            error: "User ID, app, and tool name are required"
          });
        }

        if (!pipedreamMCP.isUserAuthenticated(userId)) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated with Pipedream",
            requiresAuth: true
          });
        }

        const result = await pipedreamMCP.executeTool(userId, app, toolName, args);
        
        return response.status(200).json({
          success: result.success,
          data: result.data,
          error: result.error
        });
      } catch (error) {
        console.error("Error executing Pipedream tool:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Disconnect user authentication
  app.post(
    "/pipedream-mcp/auth/disconnect",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { userId } = reqBody(request);
        
        if (!userId) {
          return response.status(400).json({
            success: false,
            error: "User ID is required"
          });
        }

        pipedreamMCP.disconnectUser(userId);
        
        return response.status(200).json({
          success: true,
          message: "User disconnected from Pipedream"
        });
      } catch (error) {
        console.error("Error disconnecting Pipedream user:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get available apps for user
  app.post(
    "/pipedream-mcp/apps/list",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { userId } = reqBody(request);
        
        if (!userId) {
          return response.status(400).json({
            success: false,
            error: "User ID is required"
          });
        }

        const availableApps = await pipedreamMCP.getAvailableApps(userId);
        
        return response.status(200).json({
          success: true,
          apps: availableApps
        });
      } catch (error) {
        console.error("Error listing Pipedream apps:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Health check and cleanup
  app.get(
    "/pipedream-mcp/health",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_request, response) => {
      try {
        // Run cleanup
        pipedreamMCP.cleanup();
        
        return response.status(200).json({
          success: true,
          message: "Pipedream MCP server is healthy",
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error checking Pipedream MCP health:", error);
        return response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );
}

module.exports = { pipedreamMCPEndpoints };