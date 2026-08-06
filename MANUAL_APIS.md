# Manual: Cómo obtener tus propias APIs para generar Storyboards

---

## ¿Qué es una API Key? (Explicación para humanos)

Imagina que quieres entrar a un parque de diversiones. En la entrada hay un guardia
que te pide tu **pase especial**. Sin ese pase, no puedes subirte a los juegos.

Una **API Key** es exactamente eso: un **pase secreto** (una contraseña larga) que
le dice a la inteligencia artificial: *"este usuario tiene permiso para usarme"*.

Cada vez que le pides a una IA que genere un texto o una imagen, tu computador
le muestra ese pase al servidor de la IA. Si el pase es válido, la IA trabaja
para ti. Si no, te dice "no puedes pasar".

Ese pase se ve más o menos así:

```
sk-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789
```

**Es gratis conseguirlo** en la mayoría de los servicios. Solo necesitas crear
una cuenta, y ellos te dan tu pase. Vamos paso a paso con cada uno.

---

## APIs para TEXTO (la IA que escribe el guion del storyboard)

Cuando escribes tu idea en el cuadro de "Brief creativo", una IA lee esa idea
y crea un guion con 4 escenas y 2 planos cada una. Para que eso funcione,
necesitas conectar una API de texto.

Aquí tienes todas las opciones, ordenadas de la más fácil a la más avanzada:

---

### 1. Google Gemini (GRATIS — la más fácil)

**Una sola key sirve para texto Y para imágenes.** Es la mejor opción para empezar.

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [Google AI Studio](https://aistudio.google.com/) |
| 2 | Inicia sesión con tu cuenta de Gmail |
| 3 | Haz click en el botón azul **"Get API key"** |
| 4 | Click en **"Create API key"** |
| 5 | Elige "Create new project" y ponle cualquier nombre (ej: "mi storyboard") |
| 6 | ¡Listo! Copia la key que aparece (empieza con `AIzaSy...`) |
| 7 | En StoryboardPro, pega esa key en **API de Texto** Y en **API de Imagenes** |

**¿Cuánto puedo usar gratis?**
- Texto: como 1,500 preguntas por día
- Imágenes: como 50 por día

---

### 2. Mistral AI (GRATIS — muy buena calidad)

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [Mistral AI Console](https://console.mistral.ai/) |
| 2 | Click en **"Sign up"** (regístrate con Google o GitHub) |
| 3 | En el menú izquierdo, busca **"API Keys"** |
| 4 | Click en **"Create new key"** |
| 5 | Copia la key y pégala en StoryboardPro: proveedor `Mistral AI` |

**Modelo sugerido**: `mistral-large-latest`

---

### 3. Groq (GRATIS — la más rápida de todas)

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [Groq Console](https://console.groq.com/) |
| 2 | Inicia sesión con Google o GitHub |
| 3 | En el menú izquierdo, busca **"API Keys"** |
| 4 | Click en **"Create API Key"** |
| 5 | Ponle un nombre y copia la key (empieza con `gsk_...`) |
| 6 | En StoryboardPro: proveedor `Groq`, modelo `llama-3.3-70b-versatile` |

**¿Cuánto puedo usar gratis?**
- Como 1,000 preguntas por día
- Es la más rápida: responde en 1-2 segundos

---

### 4. OpenCode Zen (GRATIS — ni siquiera necesitas registrarte)

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | En StoryboardPro, selecciona proveedor `OpenCode Zen` |
| 2 | Usa esta key pública: `sk-veyjiD9KJveVJzMdTh0TC2gByeXmMBv5L9YazoTZHLiqc17d4LY` |
| 3 | Modelo: `deepseek-v4-flash-free` |

Es una key compartida, así que a veces se satura. Si falla, prueba Gemini o Mistral.

---

### 5. OpenAI GPT-4o (PAGO — la mejor calidad)

Esta es como la versión "premium". Cuesta aproximadamente $0.05 por storyboard.

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [OpenAI Platform](https://platform.openai.com/) |
| 2 | Crea cuenta o inicia sesión |
| 3 | Ve a [Settings > Billing](https://platform.openai.com/settings/organization/billing) |
| 4 | Agrega un método de pago y compra $5 de créditos |
| 5 | Ve a [API Keys](https://platform.openai.com/api-keys) |
| 6 | Click en **"Create new secret key"** |
| 7 | Copia la key (empieza con `sk-proj-...`) |
| 8 | En StoryboardPro: proveedor `OpenAI (GPT-4o)`, modelo `gpt-4o` |

---

### 6. DeepSeek (PAGO — muy barato)

Cuesta como $0.001 por storyboard. Necesitas $2 de saldo mínimo.

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [DeepSeek Platform](https://platform.deepseek.com/) |
| 2 | Crea cuenta y ve a **"API Keys"** |
| 3 | Recarga $2 de saldo |
| 4 | Copia la key y pégala en StoryboardPro: proveedor `DeepSeek (pago)` |

---

## APIs para IMAGEN (la IA que dibuja cada escena)

Estas APIs convierten las descripciones de cada plano en dibujos estilo storyboard.
Funcionan igual que las de texto: necesitas una key.

---

### 1. Google Gemini Imagen (GRATIS)

**Usa la misma key que creaste para Google Gemini (texto).** No necesitas una nueva.

Si ya tienes Gemini para texto, simplemente selecciona `Google Gemini (Imagen)`
en **API de Imagenes** y pega la misma key.

---

### 2. HuggingFace FLUX.1 (GRATIS)

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [HuggingFace](https://huggingface.co/) y crea cuenta gratis |
| 2 | Ve a [Settings > Access Tokens](https://huggingface.co/settings/tokens) |
| 3 | Click en **"Create new token"** |
| 4 | Elige tipo "Read" y ponle un nombre |
| 5 | Copia el token (empieza con `hf_...`) |
| 6 | En StoryboardPro, **API de Imagenes**: `HuggingFace FLUX.1 Schnell` |
| 7 | Pega el token |

Ese mismo token `hf_...` sirve para FLUX.1 Schnell, FLUX.1 Dev y SDXL Turbo.

---

### 3. Stability AI SD3 (GRATIS — 25 imágenes de regalo)

| Paso | ¿Qué hago? |
|:---:|------------|
| 1 | Abre [Stability AI Platform](https://platform.stability.ai/) |
| 2 | Crea cuenta (Google, GitHub o email) |
| 3 | Ve a [Account > API Keys](https://platform.stability.ai/account/keys) |
| 4 | Copia la key (empieza con `sk-...`) |
| 5 | En StoryboardPro: proveedor `Stability AI SD3` |

Te regalan 25 créditos al registrarte (como 80 imágenes).

---

### 4. Pollinations.ai (GRATIS — sin registro)

No necesitas hacer nada. Selecciona `Pollinations.ai (gratis)` en
**API de Imagenes** y listo. Es ilimitado pero puede ser lento.

---

### 5. OpenAI DALL-E 3 (PAGO)

Usa la misma key de OpenAI que creaste para GPT-4o. Cuesta como $0.05 por imagen.

En StoryboardPro: proveedor `OpenAI DALL-E 3`, misma key `sk-proj-...`.

---

## Resumen Rápido: ¿Cuál elijo?

| Si quieres... | Usa esto |
|---------------|----------|
| Lo más fácil y gratis | Google Gemini (texto + imagen, 1 sola key) |
| Texto rápido y gratis | Groq o Mistral AI |
| Imagen estilo storyboard | HuggingFace FLUX.1 Schnell |
| La mejor calidad (pagando) | OpenAI GPT-4o + DALL-E 3 |
| Sin registrarme | OpenCode Zen (texto) + Pollinations.ai (imagen) |

---

## ¿Dónde pego las keys?

1. Abre `http://localhost:3000` (o la web de FAP)
2. Click en el botón naranja **"Configurar APIs"**
3. En **API de Texto**: elige proveedor, pega la key, verifica el modelo
4. En **API de Imagenes**: elige proveedor, pega la key
5. Click en **"Guardar configuración"**
6. Escribe tu idea y dale a **"Generar storyboard PDF"**

**Las keys se guardan en tu navegador.** Nadie más las ve. No se suben a ningún
servidor. Son tuyas y solo tuyas.
