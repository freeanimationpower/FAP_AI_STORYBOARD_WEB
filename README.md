# StoryboardPro AI — by FAP / fierroduque.com
<img width="1368" height="1202" alt="LOGO FREE ANIMATION POWER con bg" src="https://github.com/user-attachments/assets/26712e66-cdc4-4aa6-95e4-356728552729" />


Aplicacion web que convierte un brief creativo en un storyboard visual de 4 escenas
(2 planos por escena) con presentacion descargable en PDF.

Parte del ecosistema **Free Animation Power (FAP)** junto con:

- [FAP Desktop](https://github.com/freeanimationpower/FAP_PC_WEB_VERSION) — Estudio de animacion 2D para PC (1920x1080, 60 pinceles, tabletas)
- [FAP Mobile](https://github.com/freeanimationpower/FAP_MOBILE_WEB_VERSION) — Estudio de animacion 2D para moviles

Arquitectura multi-proveedor: el usuario conecta su propia API key del servicio que
prefiera, sin depender de un unico modelo.

## Arquitectura

- **Frontend**: HTML5 + Tailwind CSS (CDN) + JavaScript Vanilla (ES5)
- **Tema visual**: Tema oscuro FAP — fondo `#0d0d10`, acento naranja `#ff6d00`
- **IA Narrativa**: Multi-proveedor — API OpenAI-compatible generica + Gemini nativo
- **Generacion Visual**: Multi-proveedor con fallback en cascada (HF FLUX, DALL-E,
  Gemini Imagen, Pollinations gratis, Canvas placeholder)
- **Exportacion**: jsPDF (CDN) — empaquetado 100% en el navegador del cliente
- **Servidor**: Node.js unificado (puerto 3000) — estaticos + proxy texto + proxy imagenes

## Estructura de archivos

```
/
  server.js     -- Servidor unificado
  index.html    -- Interfaz con panel de configuracion de APIs
  app.js        -- Logica completa
  README.md     -- Documentacion
```

## Inicio rapido

```bash
# 1. Iniciar servidor
node server.js

# 2. Abrir navegador
http://localhost:3000

# 3. Configurar APIs
Click en "Configurar APIs" > elegir proveedor > pegar API key > Guardar

# 4. Escribir brief y generar
```

## Proveedores soportados

### Texto (8 proveedores)

| Proveedor | Modelo sugerido | Formato |
|-----------|-----------------|---------|
| OpenAI (GPT-4o) | gpt-4o | OpenAI |
| Google Gemini | gemini-2.0-flash | Gemini nativo |
| OpenCode Zen | deepseek-v4-flash-free | OpenAI |
| DeepSeek | deepseek-chat | OpenAI |
| Groq | llama-3.3-70b-versatile | OpenAI |
| Together AI | Llama-3.3-70B-Instruct-Turbo | OpenAI |
| OpenRouter | openai/gpt-4o | OpenAI |
| Personalizado | Cualquier endpoint | OpenAI |

### Imagenes (8 proveedores)

| Proveedor | Requiere key | Calidad |
|-----------|:---:|:---:|
| Google Gemini Imagen | Si (Gemini key) | Muy alta |
| HuggingFace FLUX.1 Schnell | Si (HF Token) | Alta |
| HuggingFace FLUX.1 Dev | Si (HF Token) | Muy alta |
| HuggingFace SDXL Turbo | Si (HF Token) | Alta |
| OpenAI DALL-E 3 | Si (OpenAI Key) | Muy alta |
| OpenAI DALL-E 2 | Si (OpenAI Key) | Alta |
| Pollinations.ai | No (gratis) | Media |
| Personalizado | Depende | Variable |

## Flujo de generacion

```
Brief
  └→ API de Texto (guion JSON: 4 escenas x 2 planos)
       └→ API de Imagenes (8 imagenes)
            ├─ Proveedor configurado (con key)
            ├─ Pollinations.ai (fallback gratuito automatico)
            └─ Canvas placeholder (ultimo recurso)
                 └→ PDF descargable con jsPDF
```

## Guia de APIs: como obtener tus claves

La calidad del texto y de las imagenes generadas depende directamente del modelo
que conectes. Un modelo gratuito basico produce resultados funcionales; uno pago
de gama alta genera storyboards con calidad profesional.

---

### APIs GRATUITAS (sin tarjeta de credito)

#### 1. Google Gemini — texto + imagenes (recomendado para empezar)

**Una sola API key sirve para texto E imagenes.** Es la opcion mas completa
del tier gratuito.

| Paso | Accion |
|------|--------|
| 1 | Entra a [Google AI Studio](https://aistudio.google.com/) |
| 2 | Inicia sesion con tu cuenta de Google |
| 3 | Click en **"Get API key"** (esquina superior izquierda) |
| 4 | Click en **"Create API key"** > selecciona un proyecto (o crea uno nuevo) |
| 5 | Copia la key (formato: `AIzaSy...`) |
| 6 | En StoryboardPro: |
| | - **API de Texto**: proveedor `Google Gemini`, pega la key, modelo `gemini-2.0-flash` |
| | - **API de Imagenes**: proveedor `Google Gemini (Imagen)`, misma key |

**Limites gratuitos (cuota por minuto/dia):**
- Gemini 2.0 Flash: ~1500 peticiones/dia
- Imagen: ~20-50 imagenes/dia

**Calidad esperada:**
- Texto: narrativas correctas, entiende bien el espanol
- Imagenes: buena calidad en estilo storyboard

---

#### 2. OpenCode Zen — texto con DeepSeek

**No necesita registro.** Usa la key publica del servicio.

| Paso | Accion |
|------|--------|
| 1 | En StoryboardPro, selecciona proveedor `OpenCode Zen` |
| 2 | Usa esta key publica (o genera la tuya en [opencode.ai](https://opencode.ai)): |
| | `sk-veyjiD9KJveVJzMdTh0TC2gByeXmMBv5L9YazoTZHLiqc17d4LY` |
| 3 | Modelo sugerido: `deepseek-v4-flash-free` |

**Limites:** ~50-100 peticiones/dia (key compartida)

**Calidad esperada:** buena para texto tecnico, JSON estructurado.

---

#### 3. HuggingFace FLUX.1 Schnell — imagenes

| Paso | Accion |
|------|--------|
| 1 | Entra a [huggingface.co](https://huggingface.co/) y crea cuenta gratis |
| 2 | Ve a [Settings > Access Tokens](https://huggingface.co/settings/tokens) |
| 3 | Click en **"Create new token"** > tipo `Read` > dale un nombre |
| 4 | Copia el token (formato: `hf_...`) |
| 5 | En StoryboardPro, API de Imagenes: proveedor `HuggingFace FLUX.1 Schnell` |
| 6 | Pega el token como API key |

**Limites gratuitos:** ~30-50 imagenes/dia, modelo se carga bajo demanda (primeras
imagenes pueden tardar 10-30s mientras carga).

**Calidad esperada:** imagenes de alta calidad en estilo storyboard, buen seguimiento
de prompt. No es fotorrealista — ideal para bocetos estilo comic/ilustracion.

---

#### 4. Pollinations.ai — imagenes (sin registro, sin key)

| Paso | Accion |
|------|--------|
| 1 | En StoryboardPro, API de Imagenes: proveedor `Pollinations.ai (gratis)` |
| 2 | No necesita API key — funciona inmediatamente |

**Limites:** ilimitado pero lento (~30-120s por imagen en horas pico). Calidad
media-baja, util como fallback.

**Calidad esperada:** resultados variables. Imagenes a veces genericas o poco
detalladas. Bueno para pruebas rapidas o como respaldo.

---

#### 5. Groq — texto (modelos Llama)

| Paso | Accion |
|------|--------|
| 1 | Entra a [console.groq.com](https://console.groq.com/) |
| 2 | Inicia sesion con Google/GitHub |
| 3 | Ve a **API Keys** > **Create API Key** |
| 4 | Copia la key (formato: `gsk_...`) |
| 5 | En StoryboardPro, API de Texto: proveedor `Groq` |
| 6 | Pega la key, modelo: `llama-3.3-70b-versatile` |

**Limites gratuitos:** generosos (~30 peticiones/minuto, ~1000/dia).

**Calidad esperada:** muy rapido, buen JSON estructurado. Narrativas decentes
aunque menos creativo que Gemini o GPT-4o.

---

### APIs de PAGO (mejor calidad, mayor limite)

#### OpenAI — GPT-4o + DALL-E 3

La membresia de ChatGPT Plus ($20/mes) NO incluye API. La API se paga por uso
(creditos prepago, minimo $5).

| Paso | Accion |
|------|--------|
| 1 | Entra a [platform.openai.com](https://platform.openai.com/) |
| 2 | Inicia sesion o crea cuenta |
| 3 | Ve a [Settings > Billing](https://platform.openai.com/settings/organization/billing) |
| 4 | Agrega metodo de pago y compra creditos (minimo $5) |
| 5 | Ve a [API Keys](https://platform.openai.com/api-keys) > **Create new secret key** |
| 6 | Copia la key (formato: `sk-proj-...`) |
| 7 | En StoryboardPro: |
| | - **API de Texto**: proveedor `OpenAI (GPT-4o)`, modelo `gpt-4o` |
| | - **API de Imagenes**: proveedor `OpenAI DALL-E 3` (misma key) |

**Costos aprox (por storyboard de 8 imagenes):**
- GPT-4o texto: ~$0.01-0.05 por generacion
- DALL-E 3: ~$0.40 por storyboard ($0.05 x 8 imagenes)
- Total: ~$0.45 por storyboard completo

**Calidad esperada:** la mejor combinacion posible. GPT-4o genera los guiones
mas coherentes y creativos. DALL-E 3 produce las imagenes mas detalladas y con
mejor seguimiento de instrucciones. Calidad profesional.

---

#### DeepSeek — texto

| Paso | Accion |
|------|--------|
| 1 | Entra a [platform.deepseek.com](https://platform.deepseek.com/) |
| 2 | Crea cuenta y ve a **API Keys** |
| 3 | Agrega saldo (minimo ~$2) |
| 4 | Copia la key (formato: `sk-...`) |
| 5 | En StoryboardPro, API de Texto: proveedor `DeepSeek`, modelo `deepseek-chat` |

**Costos aprox:** ~$0.001 por generacion. Extremadamente barato.

**Calidad esperada:** muy buena relacion calidad/precio. Comparable a GPT-4o en
tareas de JSON estructurado. Buen soporte multilingue.

---

#### OpenRouter — acceso unificado a +200 modelos

OpenRouter es un intermediario: una sola cuenta, una sola key, acceso a modelos
de OpenAI, Anthropic, Meta, Google y mas. Pagas por uso.

| Paso | Accion |
|------|--------|
| 1 | Entra a [openrouter.ai](https://openrouter.ai/) |
| 2 | Crea cuenta y ve a **Keys** |
| 3 | Crea una key (formato: `sk-or-v1-...`) |
| 4 | Agrega creditos (minimo $5) |
| 5 | En StoryboardPro, API de Texto: proveedor `OpenRouter` |
| 6 | Pega la key. Puedes usar cualquier modelo: |
| | - `openai/gpt-4o` (el mejor para guiones) |
| | - `anthropic/claude-3.5-sonnet` (muy creativo) |
| | - `google/gemini-2.0-flash-001` (bueno y barato) |
| | - `meta-llama/llama-3.3-70b-instruct` (gratuito en OpenRouter) |

**Costos aprox:** varian por modelo. GPT-4o via OpenRouter ~$5/M tokens.
Modelos gratuitos disponibles (Meta Llama 3, Gemma, etc).

**Calidad esperada:** depende del modelo elegido. Con GPT-4o o Claude, calidad
profesional. Con modelos gratuitos, calidad media-alta.

---

### Tabla comparativa de calidad

#### Texto (generacion de guion)

| Proveedor + Modelo | Creatividad | JSON | Espanol | Costo |
|-------------------|:---:|:---:|:---:|:---:|
| OpenAI GPT-4o | ***** | ***** | ***** | $$ |
| Google Gemini 2.0 Flash | **** | **** | **** | Gratis |
| DeepSeek Chat | **** | ***** | *** | $ |
| Groq Llama 3.3 70B | *** | **** | *** | Gratis |
| OpenCode Zen DeepSeek V4 | *** | *** | *** | Gratis |

#### Imagenes

| Proveedor + Modelo | Detalle | Prompt | Estilo | Costo |
|-------------------|:---:|:---:|:---:|:---:|
| OpenAI DALL-E 3 | ***** | ***** | Foto/ilust | $$ |
| Google Gemini Imagen | ***** | **** | Foto/ilust | Gratis |
| HF FLUX.1 Dev | ***** | **** | Ilust/arte | Gratis |
| HF FLUX.1 Schnell | **** | *** | Ilust/arte | Gratis |
| HF SDXL Turbo | *** | ** | Ilust/arte | Gratis |
| Pollinations.ai | ** | * | Variable | Gratis |

---

## Errores inteligentes

Cada error indica exactamente que API fallo y el motivo:

- `API de Texto (OpenAI): API key invalida o sin creditos.`
- `API de Texto (Gemini): Limite de uso alcanzado.`
- `API de Imagenes (HF FLUX): sin respuesta. Cambiando a Pollinations gratis...`

Status en tiempo real durante generacion:

```
Imagen 1/8: HF FLUX.1 Schnell
Imagen 2/8: Pollinations.ai (gratis)
...
Completado. Imagenes: 6x HF FLUX.1 Schnell, 2x Pollinations.ai
```

## Seguridad

- Las API keys se guardan en **localStorage** del navegador del usuario
- El servidor proxy **no almacena** ninguna key — solo forwardea peticiones
- Las keys nunca se envian a servidores de terceros no configurados por el usuario
- El token nunca se incluye en la URL del remote de git

## Deploy a produccion

Servidor unificado compatible con cualquier plataforma Node.js:

| Plataforma | Comando |
|-----------|---------|
| Render.com | `node server.js` |
| Railway | `node server.js` |
| Fly.io | `node server.js` |
| VPS / Hostinger | `node server.js` |

Puerto configurable via variable de entorno `PORT` (defecto: 3000).

## Licencia

© Todos los derechos reservados. Free Animation Power (FAP) por Eduardo Fierro Duque.

- fierroduque.com
- freeanimationpower.com
- GitHub: [eduardofierroduque-sudo](https://github.com/eduardofierroduque-sudo)
- GitHub FAP: [freeanimationpower](https://github.com/freeanimationpower)
