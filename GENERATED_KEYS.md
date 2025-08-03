# 🔐 Claves de Seguridad Generadas para AnythingLLM

## 🚨 **IMPORTANTE: Guarda estas claves de forma segura**

### Claves principales generadas:

```bash
# Claves de seguridad principales
JWT_SECRET=1f52e6c706189c5575096aadaa31b21d75df7de471e2aa082321ca42de007fd0
SIG_KEY=6290213950aaafcd4a453a123f2e94eb14248b68fe18fc9073a8b34343b48a00
SIG_SALT=58b1fa653ac476816fb9d84c7a1e19e1ea53db22149b96dd8a63d2c93ced6844
```

### Configuración completa para variables de entorno:

```bash
# === CONFIGURACIÓN BÁSICA ===
SERVER_PORT=3001
JWT_SECRET=1f52e6c706189c5575096aadaa31b21d75df7de471e2aa082321ca42de007fd0
SIG_KEY=6290213950aaafcd4a453a123f2e94eb14248b68fe18fc9073a8b34343b48a00
SIG_SALT=58b1fa653ac476816fb9d84c7a1e19e1ea53db22149b96dd8a63d2c93ced6844

# === ALMACENAMIENTO ===
STORAGE_DIR=/app/server/storage

# === PRIVACIDAD ===
DISABLE_TELEMETRY=true

# === CONFIGURACIÓN POR DEFECTO ===
EMBEDDING_ENGINE=native
VECTOR_DB=lancedb
NODE_ENV=production
ANYTHING_LLM_RUNTIME=docker

# === PROVEEDORES LLM (Configura solo uno) ===

# OpenAI
# LLM_PROVIDER=openai
# OPEN_AI_KEY=sk-tu-clave-openai-aqui
# OPEN_MODEL_PREF=gpt-4o

# Ollama (modelos locales)
# LLM_PROVIDER=ollama
# OLLAMA_BASE_PATH=http://host.docker.internal:11434
# OLLAMA_MODEL_PREF=llama3.2:latest

# Azure OpenAI
# LLM_PROVIDER=azure
# AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com
# AZURE_OPENAI_KEY=tu-clave-azure
# AZURE_OPENAI_MODEL_PREF=gpt-4

# Google Gemini
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=tu-clave-gemini
# GEMINI_LLM_MODEL_PREF=gemini-2.0-flash-lite

# Anthropic Claude
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=tu-clave-anthropic
# ANTHROPIC_MODEL_PREF=claude-3-sonnet-20240229
```

### 📋 **Para usar en Coolify:**

1. **Copia estas variables** en la sección de Environment Variables de tu proyecto Coolify
2. **Configura tu proveedor LLM** descomentando y configurando solo una sección de proveedor
3. **Agrega tu clave API** del proveedor que elijas

### 🛡️ **Seguridad:**

- ✅ **JWT_SECRET**: 64 caracteres hexadecimales seguros
- ✅ **SIG_KEY**: 64 caracteres hexadecimales seguros  
- ✅ **SIG_SALT**: 64 caracteres hexadecimales seguros
- ✅ **Telemetría deshabilitada** por defecto
- ✅ **Motor de embedding nativo** configurado

### 🚀 **Próximos pasos:**

1. **Deploy en Coolify** usando `docker-compose.coolify.yml`
2. **Configura estas variables** en tu proyecto Coolify
3. **Agrega tu API key** del proveedor LLM que prefieras
4. **¡Listo para usar!**

---

**⚠️ IMPORTANTE:** 
- Nunca compartas estas claves públicamente
- Úsalas solo en tu instancia de producción
- Cambia las claves si sospechas que fueron comprometidas