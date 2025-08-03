# ✅ Checklist para Deploy de AnythingLLM en Coolify

## 🔍 **Verificación Pre-Deploy**

### ✅ Archivos generados:
- [ ] `docker-compose.coolify.yml` - Configuración Docker
- [ ] `.env.coolify` - Variables de entorno con claves seguras  
- [ ] `COOLIFY_DEPLOYMENT.md` - Guía de deployment
- [ ] `DEPLOYMENT_SUMMARY.md` - Resumen completo
- [ ] `quick-setup.sh` - Script de configuración

### ✅ Claves de seguridad generadas:
- [ ] **JWT_SECRET**: `58197e7e4aedf57a8fbe9696e2c9c95f2155a6d59e8553ac74664e0ba066a377`
- [ ] **SIG_KEY**: `1396a21afb156622ba6d74c3289645f660ebfa0a0133cb514ba8a386896cb8cc`
- [ ] **SIG_SALT**: `c3f9f8f04a0503bd42298d84a8e65700dae30c0491c837817a11e12f1fa36ccd`

### ✅ Configuración base lista:
- [ ] Puerto: `3001`
- [ ] Storage: `/app/server/storage`
- [ ] Embedding: `native`
- [ ] Vector DB: `lancedb`
- [ ] Telemetría: `deshabilitada`

## 🚀 **Pasos para Deploy en Coolify**

### Paso 1: Preparar Coolify
- [ ] Acceder al dashboard de Coolify
- [ ] Crear nuevo proyecto
- [ ] Seleccionar "Docker Compose"

### Paso 2: Configurar Proyecto  
- [ ] Subir el archivo `docker-compose.coolify.yml`
- [ ] Configurar nombre del proyecto: `anythingllm`
- [ ] Verificar puerto expuesto: `3001`

### Paso 3: Variables de Entorno
- [ ] Ir a "Environment Variables"
- [ ] Copiar TODAS las variables desde `.env.coolify`
- [ ] **Configurar proveedor LLM** (ver opciones abajo)

### Paso 4: Proveedor LLM (Elegir UNO)

#### OpenAI (Recomendado):
- [ ] Agregar: `LLM_PROVIDER=openai`
- [ ] Agregar: `OPEN_AI_KEY=sk-tu-clave-aqui`
- [ ] Agregar: `OPEN_MODEL_PREF=gpt-4o`

#### Ollama (Local/Gratis):
- [ ] Agregar: `LLM_PROVIDER=ollama`
- [ ] Agregar: `OLLAMA_BASE_PATH=http://host.docker.internal:11434`
- [ ] Agregar: `OLLAMA_MODEL_PREF=llama3.2:latest`

#### Azure OpenAI:
- [ ] Agregar: `LLM_PROVIDER=azure`
- [ ] Agregar: `AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com`
- [ ] Agregar: `AZURE_OPENAI_KEY=tu-clave-azure`

#### Google Gemini:
- [ ] Agregar: `LLM_PROVIDER=gemini`
- [ ] Agregar: `GEMINI_API_KEY=tu-clave-gemini`
- [ ] Agregar: `GEMINI_LLM_MODEL_PREF=gemini-2.0-flash-lite`

#### Anthropic Claude:
- [ ] Agregar: `LLM_PROVIDER=anthropic`
- [ ] Agregar: `ANTHROPIC_API_KEY=tu-clave-anthropic`
- [ ] Agregar: `ANTHROPIC_MODEL_PREF=claude-3-sonnet-20240229`

### Paso 5: Deploy
- [ ] Revisar configuración
- [ ] Hacer clic en "Deploy"
- [ ] Esperar a que termine el build
- [ ] Verificar logs sin errores

### Paso 6: Configurar Dominio (Opcional)
- [ ] Ir a configuración del servicio
- [ ] Agregar dominio personalizado
- [ ] Activar SSL automático
- [ ] Verificar HTTPS funcionando

## 🧪 **Verificación Post-Deploy**

### ✅ Healthcheck:
- [ ] Acceder a `tu-url/api/ping`
- [ ] Debe responder: `{"online":true}`

### ✅ Interfaz Web:
- [ ] Acceder a la URL principal
- [ ] Ver página de bienvenida
- [ ] Crear primer usuario admin

### ✅ Funcionalidades:
- [ ] Crear workspace de prueba
- [ ] Subir documento de prueba
- [ ] Hacer pregunta al AI
- [ ] Verificar respuesta

## ⚠️ **Solución de Problemas**

### Si el container no inicia:
- [ ] Verificar todas las variables de entorno
- [ ] Revisar logs en Coolify
- [ ] Confirmar que JWT_SECRET, SIG_KEY y SIG_SALT están configurados

### Si hay errores de API:
- [ ] Verificar API key del proveedor LLM
- [ ] Confirmar que el proveedor está bien configurado
- [ ] Revisar límites de la API

### Si no se procesan documentos:
- [ ] Verificar volúmenes de storage
- [ ] Confirmar permisos de archivos
- [ ] Revisar logs del collector

## 📊 **Métricas de Éxito**

- [ ] **Tiempo de deploy**: < 5 minutos
- [ ] **Health check**: ✅ OK
- [ ] **Interfaz accesible**: ✅ OK  
- [ ] **Login funcional**: ✅ OK
- [ ] **Upload de documentos**: ✅ OK
- [ ] **Chat con AI**: ✅ OK

## 🎯 **Configuraciones Adicionales**

### Para uso avanzado:
- [ ] Configurar SMTP para recuperación de contraseña
- [ ] Habilitar text-to-speech
- [ ] Configurar agentes web browsing
- [ ] Configurar base de datos externa (PostgreSQL)

### Para producción:
- [ ] Configurar backups automáticos
- [ ] Monitoreo y alertas
- [ ] Escalado horizontal
- [ ] Certificados SSL personalizados

## 🆘 **Recursos de Soporte**

- 📖 **Docs**: https://docs.anythingllm.com
- 💬 **Discord**: https://discord.gg/6UyHPeGZAC  
- 🐛 **Issues**: https://github.com/Mintplex-Labs/anything-llm/issues
- 🚀 **Coolify**: https://coolify.io/docs

---

## 🎉 **¡Listo para Deploy!**

**✅ Todos los archivos generados**
**✅ Claves de seguridad creadas**  
**✅ Configuración optimizada**
**✅ Documentación completa**

**🚀 ¡Ve a Coolify y haz tu primer deploy de AnythingLLM!**