#!/bin/bash

# 🚀 AnythingLLM Quick Setup Script for Coolify
# Este script configura rápidamente AnythingLLM para deployment en Coolify

echo "🚀 Configurando AnythingLLM para Coolify..."

# Generar claves de seguridad únicas
echo "🔐 Generando claves de seguridad..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SIG_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SIG_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Crear archivo de configuración para Coolify
cat > .env.coolify << EOF
# 🔐 Claves de seguridad generadas automáticamente
JWT_SECRET=$JWT_SECRET
SIG_KEY=$SIG_KEY  
SIG_SALT=$SIG_SALT

# 📦 Configuración básica
SERVER_PORT=3001
STORAGE_DIR=/app/server/storage
NODE_ENV=production
ANYTHING_LLM_RUNTIME=docker

# 🛡️ Privacidad y seguridad
DISABLE_TELEMETRY=true

# 🧠 Configuración por defecto
EMBEDDING_ENGINE=native
VECTOR_DB=lancedb

# 🤖 Configuración LLM (elige y descomenta uno)
# === OpenAI ===
# LLM_PROVIDER=openai
# OPEN_AI_KEY=sk-tu-clave-openai-aqui
# OPEN_MODEL_PREF=gpt-4o

# === Ollama (modelos locales) ===
# LLM_PROVIDER=ollama  
# OLLAMA_BASE_PATH=http://host.docker.internal:11434
# OLLAMA_MODEL_PREF=llama3.2:latest

# === Azure OpenAI ===
# LLM_PROVIDER=azure
# AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com
# AZURE_OPENAI_KEY=tu-clave-azure
# AZURE_OPENAI_MODEL_PREF=gpt-4

# === Google Gemini ===
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=tu-clave-gemini  
# GEMINI_LLM_MODEL_PREF=gemini-2.0-flash-lite

# === Anthropic Claude ===
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=tu-clave-anthropic
# ANTHROPIC_MODEL_PREF=claude-3-sonnet-20240229
EOF

echo "✅ Archivo .env.coolify creado con claves seguras"

# Mostrar resumen
echo ""
echo "📋 RESUMEN DE CONFIGURACIÓN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 JWT_SECRET: $JWT_SECRET"
echo "🔐 SIG_KEY: $SIG_KEY"
echo "🔐 SIG_SALT: $SIG_SALT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo "1. Copia el contenido de .env.coolify en las variables de entorno de Coolify"
echo "2. Configura tu proveedor LLM preferido"
echo "3. Usa docker-compose.coolify.yml para el deployment"
echo "4. ¡Deploy y disfruta!"
echo ""

echo "📚 Archivos importantes creados:"
echo "• docker-compose.coolify.yml - Configuración Docker para Coolify"
echo "• .env.coolify - Variables de entorno con claves seguras"
echo "• COOLIFY_DEPLOYMENT.md - Guía completa de deployment"
echo "• GENERATED_KEYS.md - Documentación de las claves"
echo ""

echo "✅ ¡AnythingLLM listo para Coolify!"