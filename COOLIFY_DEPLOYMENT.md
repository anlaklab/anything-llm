# AnythingLLM Deployment Guide for Coolify

This guide provides step-by-step instructions for deploying AnythingLLM on Coolify, a self-hosted platform-as-a-service (PaaS).

## Prerequisites

- A running Coolify instance
- Docker and Docker Compose support
- At least 2GB RAM and 10GB storage
- A domain name or subdomain (optional but recommended)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Create a new project in Coolify**
   - Go to your Coolify dashboard
   - Click "Create New Project"
   - Choose "Docker Compose" as the deployment method

2. **Configure the Docker Compose file**
   ```bash
   # Use the provided docker-compose.coolify.yml file
   # This file is already optimized for Coolify deployment
   ```

3. **Set up environment variables**
   - In Coolify, go to your project's environment variables section
   - Copy the contents from `coolify.env.example` 
   - Configure the required variables (see Configuration section below)

4. **Deploy**
   - Click "Deploy" in Coolify
   - Wait for the build and deployment process to complete
   - Your AnythingLLM instance will be available at the assigned URL

### Option 2: Using Git Repository

1. **Fork or clone this repository**
   ```bash
   git clone https://github.com/Mintplex-Labs/anything-llm.git
   cd anything-llm
   ```

2. **Create a new service in Coolify**
   - Choose "Git Repository" as the source
   - Point to your forked repository
   - Set the Dockerfile path to `./docker/Dockerfile`

3. **Configure build settings**
   - Build command: `yarn setup && yarn prod:frontend`
   - Port: `3001`
   - Health check path: `/api/ping`

## Configuration

### Required Environment Variables

**Security (MUST CHANGE IN PRODUCTION):**
```bash
JWT_SECRET=your-secure-jwt-secret-minimum-12-chars
SIG_KEY=your-secure-signature-key-minimum-32-chars  
SIG_SALT=your-secure-salt-minimum-32-chars
```

**Storage:**
```bash
STORAGE_DIR=/app/server/storage
```

### LLM Provider Configuration

Choose ONE of the following providers:

#### OpenAI
```bash
LLM_PROVIDER=openai
OPEN_AI_KEY=sk-your-openai-api-key-here
OPEN_MODEL_PREF=gpt-4o
```

#### Azure OpenAI
```bash
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-azure-openai-key
AZURE_OPENAI_MODEL_PREF=gpt-4
```

#### Google Gemini
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_LLM_MODEL_PREF=gemini-2.0-flash-lite
```

#### Anthropic Claude
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL_PREF=claude-3-sonnet-20240229
```

#### Local Models (Ollama)
```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_PATH=http://host.docker.internal:11434
OLLAMA_MODEL_PREF=llama3.2:latest
```

### Vector Database Configuration

The default LanceDB works great for most use cases:
```bash
VECTOR_DB=lancedb
```

For external vector databases:

#### Pinecone
```bash
VECTOR_DB=pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=your-pinecone-index-name
```

#### Chroma
```bash
VECTOR_DB=chroma
CHROMA_ENDPOINT=http://your-chroma-instance:8000
```

### Embedding Configuration

Use the native embedder (recommended):
```bash
EMBEDDING_ENGINE=native
```

Or configure external embedders:
```bash
EMBEDDING_ENGINE=openai
OPEN_AI_KEY=sk-your-openai-api-key-here
EMBEDDING_MODEL_PREF=text-embedding-3-small
```

## Persistent Storage

AnythingLLM requires persistent storage for:
- SQLite database
- Uploaded documents
- Vector cache
- Model cache

Coolify automatically handles this through Docker volumes defined in the compose file:
- `anythingllm_storage` - Main application data
- `anythingllm_hotdir` - Document processing queue
- `anythingllm_outputs` - Processed documents

## Domain and SSL

1. **Configure domain in Coolify:**
   - Go to your service settings
   - Add your domain name
   - Enable SSL (Let's Encrypt is automatically configured)

2. **Update environment variables:**
   ```bash
   SERVER_HOST=your-domain.com
   ```

## Health Checks

AnythingLLM includes built-in health checks:
- **Endpoint:** `/api/ping`
- **Expected response:** HTTP 200
- **Timeout:** 10 seconds

Coolify will automatically monitor this endpoint and restart the container if unhealthy.

## Backup and Restore

### Backup
```bash
# Backup the persistent volumes
docker volume create anythingllm_backup
docker run --rm -v anythingllm_storage:/source -v anythingllm_backup:/backup alpine tar czf /backup/anythingllm_backup.tar.gz -C /source .
```

### Restore
```bash
# Restore from backup
docker run --rm -v anythingllm_storage:/target -v anythingllm_backup:/backup alpine tar xzf /backup/anythingllm_backup.tar.gz -C /target
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check that all required environment variables are set
   - Verify JWT_SECRET, SIG_KEY, and SIG_SALT are properly configured
   - Check Coolify logs for specific error messages

2. **Database connection issues**
   - Ensure STORAGE_DIR is set to `/app/server/storage`
   - Check that persistent volumes are properly mounted
   - Verify database file permissions

3. **LLM provider not working**
   - Verify API keys are correct
   - Check provider-specific endpoints and model names
   - Ensure network connectivity to external APIs

4. **File upload issues**
   - Check that hotdir and outputs volumes are mounted
   - Verify file permissions in `/app/collector/` directories
   - Increase FILE_UPLOAD_SIZE_LIMIT if needed

### Logs and Debugging

Access logs through Coolify:
1. Go to your service in Coolify
2. Click on "Logs" tab
3. Monitor real-time logs for errors

For detailed debugging:
```bash
# Enable debug logging
DEBUG=anythingllm:*
LOG_LEVEL=debug
```

## Performance Optimization

### Memory Settings
```bash
# For containers with limited memory
NODE_OPTIONS=--max-old-space-size=2048
```

### Caching
```bash
# Enable caching for better performance
CACHE_VECTORS=true
CACHE_MODEL=true
```

### File Limits
```bash
# Adjust upload limits based on your needs
FILE_UPLOAD_SIZE_LIMIT=52428800  # 50MB
```

## Security Considerations

1. **Change default secrets** - Never use the example values in production
2. **Enable HTTPS** - Always use SSL in production
3. **Disable telemetry** - Set `DISABLE_TELEMETRY=true` for privacy
4. **Regular updates** - Keep AnythingLLM updated to the latest version
5. **Backup regularly** - Implement automated backup procedures

## Scaling

For high-traffic deployments:

1. **Resource allocation:**
   - CPU: 2+ cores
   - Memory: 4GB+ RAM
   - Storage: 50GB+ for documents and vectors

2. **External databases:**
   - Use PostgreSQL instead of SQLite for better performance
   - Configure external vector databases (Pinecone, Weaviate, etc.)

3. **Load balancing:**
   - Deploy multiple instances behind a load balancer
   - Use shared storage for consistency

## Support

- **Documentation:** https://docs.anythingllm.com
- **GitHub Issues:** https://github.com/Mintplex-Labs/anything-llm/issues
- **Discord Community:** https://discord.gg/6UyHPeGZAC

## Version Compatibility

This deployment guide is tested with:
- AnythingLLM v1.8.4
- Coolify v4.x
- Docker v20.10+
- Docker Compose v2.x

## License

AnythingLLM is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.