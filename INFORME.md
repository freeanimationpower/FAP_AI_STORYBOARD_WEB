# Informe de Desarrollo — FAP Storyboard AI

## Fecha: 6 Agosto 2026

---

## 1. RESUMEN DEL PROYECTO

Aplicación web para generar storyboards con IA multi-proveedor. El usuario conecta su propia API key del servicio que prefiera (texto + imágenes). Exporta PDF profesional.

### Stack técnico
- **Frontend**: HTML5 + Tailwind CSS (CDN) + JavaScript Vanilla (ES5)
- **Backend**: Node.js (server.js unificado, puerto 3000) — proxy genérico texto + proxy genérico imágenes
- **PDF**: jsPDF (CDN)
- **Idiomas**: EN / ES / FR / PT (selector en vivo)
- **Tema**: FAP corporativo — fondo amarillo #ffdc00, cards blancas, acento naranja #ff4200

### Repositorios
- https://github.com/eduardofierroduque-sudo/STORYBOARD-PRO-
- https://github.com/freeanimationpower/FAP_AI_STORYBOARD_WEB (principal)
- GitHub Pages: https://freeanimationpower.github.io/FAP_AI_STORYBOARD_WEB/

---

## 2. PROVEEDORES ACTUALES (22/08/2026)

### Texto — 11 proveedores (7 gratuitos + 4 pago)

| # | Proveedor | Tipo | Modelo | Funciona |
|---|-----------|:---:|--------|:---:|
| 1 | OpenAI (GPT-4o) | Pago | gpt-4o | ✅ |
| 2 | Mistral AI | Gratis | mistral-large-latest | ✅ |
| 3 | Google Gemini | Gratis | gemini-2.0-flash | ✅ |
| 4 | OpenCode Zen | Gratis | deepseek-v4-flash-free | ✅ |
| 5 | DeepSeek (gratis) | Gratis | deepseek-chat | ✅ |
| 6 | Groq | Gratis | llama-3.3-70b-versatile | ✅ |
| 7 | Together AI | Gratis | Llama-3.3-70B-Instruct-Turbo | ✅ |
| 8 | Fireworks AI | Gratis | llama-v3p1-70b-instruct | ✅ |
| 9 | OpenRouter | Pago | openai/gpt-4o | ✅ |
| 10 | xAI Grok | Pago | grok-2 | ✅ |
| 11 | Personalizado | Libre | — | ✅ |

### Imagen — 10 proveedores (8 gratuitos + 2 pago)

| # | Proveedor | Tipo | Modelo | Funciona |
|---|-----------|:---:|--------|:---:|
| 1 | Stability AI SD3 | Gratis (25 créditos) | SD3 | ✅ |
| 2 | Google Gemini Imagen | Gratis | Imagen 3.0 | ✅ |
| 3 | HF FLUX.1 Schnell | Gratis (token HF) | FLUX.1 Schnell | ✅ |
| 4 | HF FLUX.1 Dev | Gratis (token HF) | FLUX.1 Dev | ✅ |
| 5 | HF SDXL Turbo | Gratis (token HF) | SDXL Turbo | ✅ |
| 6 | OpenAI DALL-E 3 | Pago | DALL-E 3 | ✅ |
| 7 | OpenAI DALL-E 2 | Pago | DALL-E 2 | ✅ |
| 8 | Pollinations.ai | Gratis (sin key) | — | ✅ |
| 9 | Personalizado | Libre | — | ✅ |

---

## 3. PROBLEMAS ENCONTRADOS Y SOLUCIONES

### 3.1 API Keys hardcodeadas en el código fuente
**Problema**: `app.js` contenía `OPENCODE_API_KEY = 'sk-...'` y `hf-proxy.js` contenía `HF_TOKEN = 'hf-...'` expuestos en el cliente.

**Solución**: Eliminadas todas las keys hardcodeadas. El usuario ahora configura sus propias API keys mediante un panel en la UI. Las keys se guardan en localStorage del navegador y nunca tocan el servidor.

**Archivos**: `app.js` (eliminación de constantes), `index.html` (panel de configuración)

---

### 3.2 Un solo modelo fijo (OpenCode Zen)
**Problema**: El código solo funcionaba con `deepseek-v4-flash-free` vía `opencode.ai`. El usuario no podía elegir otro proveedor.

**Solución**: Arquitectura multi-proveedor. Se creó `TEXT_PROVIDERS` e `IMAGE_PROVIDERS` con presets para 11+ proveedores. El proxy de texto (`server.js`) se hizo genérico: lee `x-target-url` y `x-api-key` de los headers y forwardea a cualquier endpoint OpenAI-compatible.

**Archivos**: `app.js` (TEXT_PROVIDERS, IMAGE_PROVIDERS), `server.js` (handleChatProxy genérico)

---

### 3.3 Tres proxies Node.js separados
**Problema**: Existían `api-proxy.js` (puerto 3001), `hf-proxy.js` (puerto 3002) y `proxy.js` (puerto 3000) ejecutándose por separado. Difícil de mantener y desplegar.

**Solución**: Unificación en un solo `server.js` (puerto 3000) que:
- Sirve archivos estáticos (`index.html`, `app.js`, `logo-fap.png`)
- Maneja proxy de texto en `POST /api/chat`
- Maneja proxy de imágenes en `POST /api/img`

**Archivos**: `server.js` (nuevo), eliminados `api-proxy.js`, `hf-proxy.js`, `proxy.js`

---

### 3.4 Formato Gemini no compatible con OpenAI
**Problema**: Google Gemini usa un formato de API diferente (`generateContent` con `contents/parts`) en vez del estándar `chat/completions` con `messages`.

**Solución**: Se agregó `apiFormat: 'gemini'` al provider. El frontend detecta este formato y:
- Construye la petición en formato Gemini (`system_instruction` + `contents`)
- Parsea la respuesta Gemini (`candidates[0].content.parts` → texto)
- Incluye la API key como query param `?key=...` en la URL

**Archivos**: `app.js` (buildGeminiPayload, parseGeminiResponse)

---

### 3.5 Imágenes repetidas en el PDF
**Problema**: Las 8 imágenes del storyboard se repetían (misma imagen en varios planos). El bug era un closure de JavaScript: `var planosImg = []` estaba declarado fuera del IIFE del bucle. Como `var` tiene scope de función, los 4 IIFEs compartían la misma variable. Cuando la promesa de la escena 0 se resolvía, `planosImg` ya apuntaba al array de la escena 3.

**Solución**: Movido `var planosImg = []` dentro del IIFE. Cada escena ahora tiene su propio array aislado.

```javascript
// ANTES (bug)
for (var e = 0; ...) {
    var planosImg = [];  // compartido entre todos los IIFEs
    (function(escena, e) { ... })(escena, e);
}

// DESPUÉS (fix)
for (var e = 0; ...) {
    (function(escena, e) {
        var planosImg = [];  // propio de esta escena
        ...
    })(escena, e);
}
```

**Archivos**: `app.js` (bucle principal de generación)

---

### 3.6 Errores sin trazabilidad
**Problema**: Cuando una API fallaba, el mensaje era genérico ("API key inválida") sin indicar si el problema era de texto o imágenes, ni qué proveedor falló.

**Solución**: 
- Errores ahora incluyen `errorCode`, `providerName` y `apiType` como propiedades del objeto Error
- Mensajes formateados: `"API de Texto (Groq): Límite de uso alcanzado"`
- Status en tiempo real durante generación: `"Imagen 3/8: HF FLUX.1 Schnell"`
- Resumen al finalizar: `"Completado. Imagenes: 6x HF FLUX, 2x Pollinations"`
- Fallback con aviso en consola cuando un proveedor falla y se usa el siguiente

**Archivos**: `app.js` (getErrorMessage, makeError, fetchImageAsBase64, bucle principal)

---

### 3.7 Sin selector de idioma
**Problema**: Toda la UI estaba en español hardcodeado.

**Solución**: Sistema i18n con:
- Objeto `I18N` con traducciones completas EN/ES/FR/PT
- Función `__(key)` para traducciones dinámicas en JS
- Atributos `data-i18n` en HTML para textos estáticos
- Función `applyTranslations()` que recorre el DOM
- Selector de idioma tipo pill en la esquina superior derecha
- Persistencia en localStorage

**Archivos**: `app.js` (I18N, __(), setLang(), applyTranslations()), `index.html` (data-i18n, lang-switch)

---

### 3.8 Diseño visual no coincidía con FAP
**Problema**: La UI tenía tema claro genérico. No coincidía con la identidad de Free Animation Power.

**Solución**: Rediseño completo al estilo corporativo FAP:
- Fondo amarillo `#ffdc00`
- Cards blancas con borde `#ede4c0`
- Acento naranja `#ff4200`
- Botones pill con fondo negro y texto naranja/amarillo
- Fuentes Outfit (títulos) + Plus Jakarta Sans (cuerpo) + JetBrains Mono (campos)
- Logo FAP en el header
- Scrollbars estilizados con acento
- Efectos de hover y focus suaves

**Archivos**: `index.html` (CSS completo + HTML reestructurado)

---

### 3.9 PDF no tenía identidad FAP
**Problema**: El PDF generado tenía fondo oscuro genérico. No incluía logo ni los colores corporativos.

**Solución**:
- Portada del PDF: fondo amarillo `#FFE000`
- Título en naranja `#FC4902` y textos en negro
- Logo FAP cargado desde archivo y centrado en la portada
- Footer en todas las páginas: `www.fierroduque.com` (izq) + `www.freeanimationpower.com` (der)
- Línea decorativa en naranja

**Archivos**: `app.js` (ensamblarPDF), `logo-fap.png` (nuevo)

---

### 3.10 Campo modelo no se actualizaba al cambiar proveedor
**Problema**: Al cambiar de proveedor en el panel, el campo "Modelo" se quedaba con el valor anterior. El usuario tenía que borrarlo y escribir el nuevo manualmente.

**Solución**: 
- Reestructuración de `initConfigUI()`: listeners registrados ANTES de `fillSelect()`
- Flag `initializing` bloquea los listeners durante la carga inicial
- Después de init, cualquier cambio de proveedor actualiza modelo y URL automáticamente
- Para imágenes, el modelo se auto-llena con el nombre del preset

**Archivos**: `app.js` (initConfigUI)

---

### 3.11 HuggingFace Chat no funciona en capa gratuita
**Problema**: Se intentó agregar HF Chat como proveedor gratuito de texto. Proceso de debug:

1. **Error 429 (Rate Limited)**: Groq devolvía rate limit → mejorado el manejo de reintentos con delays de 20-110s y mensajes informativos.

2. **Error 502 (Bad Gateway)**: El DNS `api-inference.huggingface.co` no resuelve → migrado a `router.huggingface.co` (mismo dominio que imágenes FLUX).

3. **Error 502 persistente**: La URL `router.huggingface.co/hf-inference/models/{model}` para TEXTO funciona (responde 401 sin token, 400 con token válido).

4. **Error 400 (Bad Request)**: El formato TGI Chat Completions (`/v1/chat/completions`) no es aceptado por el router de HF para modelos de texto gratuitos. Probado con formato raw (`{"inputs": "..."}`) con ChatML template — también rechazado.

5. **Error 401 (Unauthorized)**: Con token válido, el router de HF rechaza la petición para texto. El endpoint `router.huggingface.co` solo funciona para modelos de IMAGEN (FLUX).

**Solución**: Eliminado HuggingFace Chat del panel. No es viable en capa gratuita. Se mantiene HF solo para imágenes (FLUX.1, SDXL).

**Archivos**: `app.js` (eliminación completa de hf_chat, buildHfPayload, parseHfResponse, template {model})

---

### 3.12 Proxy no soportaba multipart/form-data (Stability AI)
**Problema**: Stability AI requiere `multipart/form-data` para su endpoint de generación de imágenes. El proxy solo enviaba `application/json`.

**Solución**: Agregado `bodyType: 'form'` en el payload del proxy de imagen. Cuando se detecta este tipo, el servidor construye manualmente el `multipart/form-data` con boundary y lo envía con el Content-Type correcto.

**Archivos**: `server.js` (handleImageProxy), `app.js` (stability_sd3 formatPayload)

---

### 3.13 Puerto 3000 bloqueado / procesos Node residuales
**Problema**: Múltiples procesos `node` acumulados bloqueaban el puerto 3000. El servidor no podía iniciar.

**Solución**: 
- `Get-Process -Name node | Stop-Process -Force` para matar todos los procesos
- Inicio limpio con `node server.js`
- Verificación con `Get-NetTCPConnection -LocalPort 3000`

---

### 3.14 Google Fonts colgando la página
**Problema**: La URL de Google Fonts incluía `Segoe+UI` que no es una fuente de Google (es del sistema Windows). El navegador se quedaba esperando la carga.

**Solución**: Eliminada `Segoe+UI` de la URL de Google Fonts. Solo se carga `JetBrains Mono` desde Google; `Segoe UI` y `Plus Jakarta Sans` están configuradas como fallback del sistema.

**Archivos**: `index.html`

---

### 3.15 Conflictos de autenticación Git y tokens expirados
**Problema**: Múltiples tokens de GitHub expiraron durante las sesiones. El remote `origin` perdía la configuración. Conflictos de merge con el FAP Web Hub.

**Solución**: 
- Cada push se hace con token embebido en la URL: `git push "https://{token}@github.com/..."`
- Después del push, se limpia la URL: `git remote set-url origin "https://github.com/..."` (sin token)
- Pull antes de push para resolver conflictos con cambios del Hub
- Sincronización de tracking con `git branch -u origin/main`

---

## 4. ARQUITECTURA FINAL

```
index.html ──→ app.js ──→ /api/chat ──→ server.js ──→ OpenAI/Gemini/Groq/...
                          ──→ /api/img  ──→ server.js ──→ HF FLUX/DALL-E/Stability/...
                          
Config en localStorage (nunca toca el servidor)
```

### Flujo de generación:
```
Brief → API de Texto (guion JSON: 4 escenas × 2 planos)
      → API de Imágenes (8 imágenes, secuenciales)
           ├─ Proveedor configurado (si hay key + modelo)
           ├─ Pollinations.ai (fallback gratuito automático)
           └─ Canvas placeholder (último recurso)
                → PDF descargable con jsPDF
```

---

## 5. ARCHIVOS DEL PROYECTO

| Archivo | Líneas | Función |
|---------|:---:|---------|
| `server.js` | 227 | Servidor Node.js unificado (estáticos + proxy texto + proxy imágenes) |
| `index.html` | 580 | Interfaz FAP corporativa con panel de configuración y selector de idioma |
| `app.js` | 1697 | Lógica completa: proveedores, i18n, generación, PDF, Canvas placeholder |
| `logo-fap.png` | — | Logo Free Animation Power (256×256) |
| `README.md` | 350 | Documentación con guías de APIs, tablas comparativas, deploy |
| `.gitignore` | 3 | Ignora node_modules, .env, logs |

---

## 6. ESTADO ACTUAL — LO QUE FUNCIONA

✅ Panel de configuración con 11 proveedores de texto + 10 de imagen  
✅ Selector de idioma EN/ES/FR/PT con persistencia  
✅ Tema visual FAP corporativo (amarillo, blanco, naranja)  
✅ Errores inteligentes con trazabilidad (qué API falló + por qué)  
✅ Status en tiempo real durante generación  
✅ Fallback automático en cascada para imágenes  
✅ PDF con logo FAP, colores corporativos, footer con ambas webs  
✅ Proxy genérico (funciona con cualquier API OpenAI-compatible)  
✅ Proxy de imagen con soporte JSON y multipart/form-data  
✅ Sistema de reintentos con delays progresivos (429, 503)  
✅ Canvas placeholder como último recurso  
✅ Auto-llenado de modelo al cambiar proveedor  

## 7. PENDIENTE / MEJORAS FUTURAS

- [ ] Tailwind CSS en producción (quitar CDN, usar build)
- [ ] Replicate API (requiere refactor grande del proxy por ser async)
- [ ] Historial de generaciones
- [ ] Más formatos de exportación (PNG individuales, ZIP)
- [ ] Modo offline con modelos locales (Ollama)
