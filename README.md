# Storyboard AI — by FAP / fierroduque.com

> **Accede directamente desde la web**: [freeanimationpower.org/tools/storyboard/](https://freeanimationpower.org/tools/storyboard/)  
> El hub central de FAP incluye proxies PHP que reemplazan el servidor Node.js. Conecta tu API key y usa la herramienta sin instalar nada.

<img width="1254" height="1254" alt="FAP AI STORYBOARD WEB" src="https://github.com/user-attachments/assets/25f6f90d-6c85-4a9a-a799-8ae551cb0e7a" />

Aplicacion web que convierte un brief creativo en un storyboard visual de 4 escenas
(2 planos por escena) con presentacion descargable en PDF. **9 proveedores de texto
y 10 de imagen.** Traducida a 4 idiomas.

Parte del ecosistema **Free Animation Power (FAP)** junto con:

- [FAP Web Hub](https://freeanimationpower.org) — Landing page oficial con todas las herramientas
- [FAP Desktop](https://github.com/freeanimationpower/FAP_PC_WEB_VERSION) — Estudio de animacion 2D para PC (1920x1080, 60 pinceles, tabletas)
- [FAP Mobile](https://github.com/freeanimationpower/FAP_MOBILE_WEB_VERSION) — Estudio de animacion 2D para moviles
- [FAP Desktop App](https://github.com/freeanimationpower/FreeAnimationPower) — Aplicacion nativa Windows (C++20/Qt 6)
- [FAP APK](https://github.com/freeanimationpower/FREE-ANIMATION-POWER-APK) — App Android nativa

Arquitectura multi-proveedor: el usuario conecta su propia API key del servicio que
prefiera, sin depender de un unico modelo.

## Arquitectura

- **Frontend**: HTML5 + Tailwind CSS (CDN) + JavaScript Vanilla (ES5)
- **Tema visual**: FAP corporativo — fondo amarillo `#ffdc00`, cards blancas, acento naranja `#ff4200`, fuentes Outfit + Plus Jakarta Sans
- **Idiomas**: Ingles, Español, Francés, Portugués — selector en vivo sin recargar
- **IA Narrativa**: Multi-proveedor — API OpenAI-compatible generica + Gemini nativo
- **Generacion Visual**: Multi-proveedor con fallback en cascada (Stability SD3, HF FLUX, DALL-E, Gemini Imagen, Pollinations gratis, Canvas placeholder)
- **Exportacion**: jsPDF (CDN) — empaquetado 100% en el navegador del cliente
- **Servidor**: Node.js unificado — estaticos + proxy texto + proxy imagenes. Soporte `multipart/form-data` para Stability AI.

## Inicio rapido

```bash
# 1. Iniciar servidor
node server.js

# 2. Abrir navegador
http://localhost:3000

# 3. Seleccionar idioma (ES / FR / PT) en la esquina superior derecha

# 4. Configurar APIs
Click en "Configurar APIs" > elegir proveedor > pegar API key > Guardar

# 5. Escribir brief y generar
```

## Proveedores soportados

### Texto (9 proveedores)

| Proveedor | Modelo sugerido | Formato | Tipo |
|-----------|-----------------|---------|:---:|
| OpenAI (GPT-4o) | gpt-4o | OpenAI | Pago |
| Mistral AI | mistral-large-latest | OpenAI | Gratis/Pago |
| Google Gemini | gemini-2.0-flash | Gemini nativo | Gratis |
| OpenCode Zen | deepseek-v4-flash-free | OpenAI | Gratis |
| DeepSeek | deepseek-chat | OpenAI | Pago |
| Groq | llama-3.3-70b-versatile | OpenAI | Gratis |
| Together AI | Llama-3.3-70B-Instruct-Turbo | OpenAI | Gratis |
| OpenRouter | openai/gpt-4o | OpenAI | Pago |
| Personalizado | Cualquier endpoint | OpenAI | — |

### Imagenes (10 proveedores)

| Proveedor | Requiere key | Calidad | Tipo |
|-----------|:---:|:---:|:---:|
| Stability AI SD3 | Si | Muy alta | Gratis (25 creditos) |
| Google Gemini Imagen | Si (Gemini key) | Muy alta | Gratis |
| HuggingFace FLUX.1 Schnell | Si (HF Token) | Alta | Gratis |
| HuggingFace FLUX.1 Dev | Si (HF Token) | Muy alta | Gratis |
| HuggingFace SDXL Turbo | Si (HF Token) | Alta | Gratis |
| OpenAI DALL-E 3 | Si (OpenAI Key) | Muy alta | Pago |
| OpenAI DALL-E 2 | Si (OpenAI Key) | Alta | Pago |
| Pollinations.ai | No | Media | Gratis |
| Personalizado | Depende | Variable | — |

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
| 6 | En Storyboard AI: **API de Texto** > `Google Gemini`, modelo `gemini-2.0-flash` |
| 7 | Para imagenes: **API de Imagenes** > `Google Gemini (Imagen)`, misma key |

**Limites gratuitos:** ~1500 peticiones/dia texto, ~20-50 imagenes/dia.

---

#### 2. Mistral AI — texto (La Plateforme)

| Paso | Accion |
|------|--------|
| 1 | Entra a [console.mistral.ai](https://console.mistral.ai/) |
| 2 | Crea cuenta (Google/GitHub/Microsoft) |
| 3 | Ve a **API Keys** > **Create new key** |
| 4 | Copia la key (formato: `...`) |
| 5 | En Storyboard AI: **API de Texto** > `Mistral AI`, modelo `mistral-large-latest` |

**Limites gratuitos:** rate-limit generoso en tier gratuito (La Plateforme).
**Calidad:** Excelente en JSON estructurado y textos multilingue. Muy rapido.

---

#### 3. Stability AI — imagenes (25 creditos gratis)

| Paso | Accion |
|------|--------|
| 1 | Entra a [platform.stability.ai](https://platform.stability.ai/) |
| 2 | Crea cuenta (Google/GitHub/email) |
| 3 | Ve a **Account > API Keys** |
| 4 | Copia la key (formato: `sk-...`) |
| 5 | En Storyboard AI: **API de Imagenes** > `Stability AI SD3` |

**Limites gratuitos:** 25 creditos al registrarte. Cada imagen gasta ~0.3 creditos.
**Calidad:** SD3 genera imagenes de muy alta calidad con excelente seguimiento del prompt.

---

#### 4. HuggingFace FLUX.1 — imagenes

| Paso | Accion |
|------|--------|
| 1 | Entra a [huggingface.co](https://huggingface.co/) y crea cuenta gratis |
| 2 | Ve a [Settings > Access Tokens](https://huggingface.co/settings/tokens) |
| 3 | Click en **"Create new token"** > tipo `Read` |
| 4 | Copia el token (formato: `hf_...`) |
| 5 | En Storyboard AI: **API de Imagenes** > `HuggingFace FLUX.1 Schnell` |

**Limites:** ~30-50 imagenes/dia. Modelo carga bajo demanda (10-30s la primera).

---

#### 5. Groq — texto (modelos Llama)

| Paso | Accion |
|------|--------|
| 1 | Entra a [console.groq.com](https://console.groq.com/) |
| 2 | Inicia sesion con Google/GitHub |
| 3 | Ve a **API Keys** > **Create API Key** (formato: `gsk_...`) |
| 4 | En Storyboard AI: **API de Texto** > `Groq`, modelo `llama-3.3-70b-versatile` |

**Limites:** ~30 req/minuto, ~1000/dia. Muy rapido.

---

#### 6. Pollinations.ai — imagenes (sin registro, sin key)

No necesita API key. Selecciona `Pollinations.ai (gratis)` en el panel de imagen.
Ilimitado pero lento (~30-120s por imagen). Util como fallback automatico.

---

### APIs de PAGO (mejor calidad, mayor limite)

#### OpenAI — GPT-4o + DALL-E 3

Creditos prepago, minimo $5.

| Paso | Accion |
|------|--------|
| 1 | Entra a [platform.openai.com](https://platform.openai.com/) |
| 2 | Ve a [Billing](https://platform.openai.com/settings/organization/billing) > agrega metodo de pago ($5 min) |
| 3 | Ve a [API Keys](https://platform.openai.com/api-keys) > **Create new secret key** |
| 4 | Formato: `sk-proj-...` |
| 5 | Storyboard AI: Texto > `OpenAI (GPT-4o)`, Imagen > `OpenAI DALL-E 3` (misma key) |

**Costos:** ~$0.45 por storyboard completo (8 imagenes). **Calidad profesional.**

---

#### DeepSeek — texto

| Paso | Accion |
|------|--------|
| 1 | Entra a [platform.deepseek.com](https://platform.deepseek.com/) |
| 2 | Crea cuenta > **API Keys** > agrega saldo (~$2 min) |
| 3 | Storyboard AI: Texto > `DeepSeek`, modelo `deepseek-chat` |

**Costos:** ~$0.001 por generacion. Extremadamente barato. Comparable a GPT-4o.

---

#### OpenRouter — acceso a +200 modelos, 1 sola key

| Paso | Accion |
|------|--------|
| 1 | Entra a [openrouter.ai](https://openrouter.ai/) |
| 2 | Crea cuenta > **Keys** > agrega creditos ($5 min) |
| 3 | Storyboard AI: Texto > `OpenRouter` |
| 4 | Modelos recomendados: `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, `google/gemini-2.0-flash-001` |

---

### Tabla comparativa de calidad

#### Texto

| Proveedor + Modelo | Creatividad | JSON | Espanol | Costo |
|-------------------|:---:|:---:|:---:|:---:|
| OpenAI GPT-4o | ★★★★★ | ★★★★★ | ★★★★★ | $$ |
| Mistral Large | ★★★★ | ★★★★★ | ★★★★ | Gratis |
| Google Gemini 2.0 Flash | ★★★★ | ★★★★ | ★★★★ | Gratis |
| DeepSeek Chat | ★★★★ | ★★★★★ | ★★★ | $ |
| Groq Llama 3.3 70B | ★★★ | ★★★★ | ★★★ | Gratis |

#### Imagenes

| Proveedor + Modelo | Detalle | Prompt | Estilo | Costo |
|-------------------|:---:|:---:|:---:|:---:|
| Stability AI SD3 | ★★★★★ | ★★★★ | Foto/ilust | Gratis* |
| OpenAI DALL-E 3 | ★★★★★ | ★★★★★ | Foto/ilust | $$ |
| Google Gemini Imagen | ★★★★★ | ★★★★ | Foto/ilust | Gratis |
| HF FLUX.1 Dev | ★★★★★ | ★★★★ | Ilust/arte | Gratis |
| HF FLUX.1 Schnell | ★★★★ | ★★★ | Ilust/arte | Gratis |
| HF SDXL Turbo | ★★★ | ★★ | Ilust/arte | Gratis |
| Pollinations.ai | ★★ | ★ | Variable | Gratis |

*25 creditos gratis al registrarse en Stability AI.

---

## Errores inteligentes

Cada error indica exactamente que API fallo y el motivo:

- `API de Texto (OpenAI): API key invalida o sin creditos.`
- `API de Texto (Gemini): Limite de uso alcanzado.`
- `API de Imagenes (Stability AI SD3): sin respuesta. Cambiando a Pollinations...`

Status en tiempo real durante generacion:

```
Imagen 1/8: Stability AI SD3
Imagen 2/8: Pollinations.ai (gratis)
...
Completado. Imagenes: 6x Stability AI SD3, 2x Pollinations.ai
```

## Seguridad

- Las API keys se guardan en **localStorage** del navegador del usuario
- El servidor proxy **no almacena** ninguna key — solo forwardea peticiones
- Las keys nunca se envian a servidores de terceros no configurados por el usuario

## Deploy a produccion

| Plataforma | Comando |
|-----------|---------|
| **FAP Web Hub** | [freeanimationpower.org/tools/storyboard](https://freeanimationpower.org/tools/storyboard) |
| Render.com | `node server.js` |
| Railway | `node server.js` |
| Fly.io | `node server.js` |
| VPS / Hostinger | `node server.js` |

Puerto configurable via variable de entorno `PORT` (defecto: 3000).

## Licencia

© Todos los derechos reservados. Free Animation Power (FAP) por Eduardo Fierro Duque.

- [freeanimationpower.org](https://freeanimationpower.org)
- [fierroduque.com](https://www.fierroduque.com)
- GitHub: [eduardofierroduque-sudo](https://github.com/eduardofierroduque-sudo)
- GitHub FAP: [freeanimationpower](https://github.com/freeanimationpower)
