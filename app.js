/**
 * Generador de Storyboard - fierroduque.com
 * Arquitectura multi-proveedor | Generacion de Storyboards en PDF
 *
 * Flujo:
 *   1) Envia el brief a la IA configurada (JSON mode) -> obtiene titulo + 4 escenas
 *   2) Por cada escena, genera una imagen via el proveedor configurado + fallbacks
 *   3) Ensambla un archivo PDF con jsPDF y fuerza la descarga
 */

// ============================================================
//  UTILIDADES GLOBALES — Timeouts, Parseo Seguro, Validacion
// ============================================================
var MASTER_STYLE = 'film storyboard frame, sequential art, hand-drawn pencil illustration, professional storyboard artist style, clear character poses, defined backgrounds, cinematic composition, black ink on white paper, clean linework, readable action, no color, no photorealism, no 3D, no photography, no text, no watermark';

function fetchWithTimeout(url, options, timeoutMs) {
    return Promise.race([
        fetch(url, options),
        new Promise(function(_, reject) {
            setTimeout(function() { reject(new Error('TIMEOUT_EXCEDIDO')); }, timeoutMs);
        })
    ]);
}

function safeParseJSON(rawText) {
    if (!rawText || typeof rawText !== 'string') return typeof rawText === 'object' ? rawText : null;

    try { return JSON.parse(rawText); } catch(e) {}

    var cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    var first = cleaned.indexOf('{');
    var last = cleaned.lastIndexOf('}');

    if (first !== -1 && last > first) {
        cleaned = cleaned.slice(first, last + 1);
        try { return JSON.parse(cleaned); } catch(e) {}
    }

    cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    try { return JSON.parse(cleaned); } catch(e) {}

    var match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch(e) {}
    }
    return null;
}

function validarGuion(datos) {
    if (!datos || typeof datos !== 'object') return false;
    if (!Array.isArray(datos.escenas)) datos.escenas = [];

    var escenas = datos.escenas.slice(0, 4);
    while (escenas.length < 4) {
        escenas.push({ numero: escenas.length + 1, planos: [] });
    }

    for (var e = 0; e < escenas.length; e++) {
        var esc = escenas[e];
        if (!esc.planos || !Array.isArray(esc.planos)) esc.planos = [];

        while (esc.planos.length < 2) {
            esc.planos.push({
                texto_narrativo: 'Accion de continuidad.',
                image_prompt: 'Cinematic wide shot, continuity scene',
                tipo_camara: 'Plano General',
                movimiento_camara: 'Fijo',
                ritmo_plano: 'medio',
                estilo_visual: 'storyboard'
            });
        }
        esc.planos = esc.planos.slice(0, 2);
    }

    datos.escenas = escenas;
    return datos;
}

// ============================================================
//  TRADUCCIONES (EN / ES / FR / PT)
// ============================================================
var I18N = {
    'en': {
        'title': 'Storyboard AI &mdash; Free Animation Power',
        'subtitle': 'by Free Animation Power / fierroduque.com',
        'desc': 'Connect your own API key and generate professional storyboards with AI. Compatible with OpenAI, Gemini, DeepSeek, HuggingFace, DALL-E and more.',
        'config_apis': 'Configure APIs',
        'hide_config': 'Hide configuration',
        'api_text': 'Text API',
        'api_image': 'Image API',
        'provider': 'Provider',
        'api_key': 'API Key',
        'model': 'Model',
        'url_base': 'Base URL',
        'url_base_img': 'Base URL (Custom only)',
        'headers_extra': 'Extra headers (JSON, Custom only)',
        'save_config': 'Save configuration',
        'clear': 'Clear',
        'brief_label': 'Creative Brief',
        'brief_placeholder': 'Ex: A 30-second commercial for an electric car brand, aimed at young urban professionals who value sustainability...',
        'generate_btn': 'Generate storyboard PDF',
        'processing': 'Processing...',
        'status_text_intro': 'Structuring technical narrative...',
        'status_generating': 'Generating images with AI...',
        'status_pdf': 'Assembling final PDF...',
        'status_done': 'Download complete.',
        'status_image': 'Generating image',
        'status_img_item': 'Image',
        'status_completed': 'Completed. Images:',
        'status_error': 'Error:',
        'footer': 'Free Animation Power &middot; fierroduque.com',
        'lang_tooltip': 'Change language',
        'saved_ok': 'Configuration saved. Ready to generate.',
        'saved_no_key': 'Configuration saved. Missing text API key.'
    },
    'es': {
        'title': 'Storyboard AI &mdash; Free Animation Power',
        'subtitle': 'by Free Animation Power / fierroduque.com',
        'desc': 'Conecta tu propia API key y genera storyboards profesionales con IA. Compatible con OpenAI, Gemini, DeepSeek, HuggingFace, DALL-E y mas.',
        'config_apis': 'Configurar APIs',
        'hide_config': 'Ocultar configuracion',
        'api_text': 'API de Texto',
        'api_image': 'API de Imagenes',
        'provider': 'Proveedor',
        'api_key': 'API Key',
        'model': 'Modelo',
        'url_base': 'URL Base',
        'url_base_img': 'URL Base (solo Personalizado)',
        'headers_extra': 'Headers extra (JSON, solo Personalizado)',
        'save_config': 'Guardar configuracion',
        'clear': 'Limpiar',
        'brief_label': 'Brief creativo',
        'brief_placeholder': 'Ej: Un comercial de 30 segundos para una marca de autos electricos, dirigido a jovenes profesionales urbanos que valoran la sostenibilidad...',
        'generate_btn': 'Generar storyboard PDF',
        'processing': 'Procesando...',
        'status_text_intro': 'Estructurando narrativa tecnica...',
        'status_generating': 'Generando imagenes con IA...',
        'status_pdf': 'Empaquetando PDF final...',
        'status_done': 'Descarga completada.',
        'status_image': 'Generando imagen',
        'status_img_item': 'Imagen',
        'status_completed': 'Completado. Imagenes:',
        'status_error': 'Error:',
        'footer': 'Free Animation Power &middot; fierroduque.com',
        'lang_tooltip': 'Cambiar idioma',
        'saved_ok': 'Configuracion guardada. Listo para generar.',
        'saved_no_key': 'Configuracion guardada. Falta API key de texto.'
    },
    'fr': {
        'title': 'Storyboard AI &mdash; Free Animation Power',
        'subtitle': 'par Free Animation Power / fierroduque.com',
        'desc': 'Connectez votre propre clé API et générez des storyboards professionnels avec l\'IA. Compatible avec OpenAI, Gemini, DeepSeek, HuggingFace, DALL-E et plus.',
        'config_apis': 'Configurer les APIs',
        'hide_config': 'Masquer la configuration',
        'api_text': 'API de Texte',
        'api_image': 'API d\'Images',
        'provider': 'Fournisseur',
        'api_key': 'Clé API',
        'model': 'Modèle',
        'url_base': 'URL de base',
        'url_base_img': 'URL de base (Personnalisé uniquement)',
        'headers_extra': 'En-têtes supplémentaires (JSON, Personnalisé uniquement)',
        'save_config': 'Enregistrer',
        'clear': 'Effacer',
        'brief_label': 'Brief créatif',
        'brief_placeholder': 'Ex: Une publicité de 30 secondes pour une marque de voitures électriques, destinée aux jeunes professionnels urbains...',
        'generate_btn': 'Générer le storyboard PDF',
        'processing': 'Traitement en cours...',
        'status_text_intro': 'Structuration du récit technique...',
        'status_generating': 'Génération des images avec l\'IA...',
        'status_pdf': 'Assemblage du PDF final...',
        'status_done': 'Téléchargement terminé.',
        'status_image': 'Génération de l\'image',
        'status_img_item': 'Image',
        'status_completed': 'Terminé. Images:',
        'status_error': 'Erreur:',
        'footer': 'Free Animation Power &middot; fierroduque.com',
        'lang_tooltip': 'Changer la langue',
        'saved_ok': 'Configuration enregistrée. Prêt à générer.',
        'saved_no_key': 'Configuration enregistrée. Clé API texte manquante.'
    },
    'pt': {
        'title': 'Storyboard AI &mdash; Free Animation Power',
        'subtitle': 'por Free Animation Power / fierroduque.com',
        'desc': 'Conecte sua própria chave API e gere storyboards profissionais com IA. Compatível com OpenAI, Gemini, DeepSeek, HuggingFace, DALL-E e mais.',
        'config_apis': 'Configurar APIs',
        'hide_config': 'Ocultar configuração',
        'api_text': 'API de Texto',
        'api_image': 'API de Imagens',
        'provider': 'Provedor',
        'api_key': 'Chave API',
        'model': 'Modelo',
        'url_base': 'URL Base',
        'url_base_img': 'URL Base (apenas Personalizado)',
        'headers_extra': 'Cabeçalhos extras (JSON, apenas Personalizado)',
        'save_config': 'Salvar configuração',
        'clear': 'Limpar',
        'brief_label': 'Brief criativo',
        'brief_placeholder': 'Ex: Um comercial de 30 segundos para uma marca de carros elétricos, voltado para jovens profissionais urbanos...',
        'generate_btn': 'Gerar storyboard PDF',
        'processing': 'Processando...',
        'status_text_intro': 'Estruturando narrativa técnica...',
        'status_generating': 'Gerando imagens com IA...',
        'status_pdf': 'Montando PDF final...',
        'status_done': 'Download concluído.',
        'status_image': 'Gerando imagem',
        'status_img_item': 'Imagem',
        'status_completed': 'Concluído. Imagens:',
        'status_error': 'Erro:',
        'footer': 'Free Animation Power &middot; fierroduque.com',
        'lang_tooltip': 'Mudar idioma',
        'saved_ok': 'Configuração salva. Pronto para gerar.',
        'saved_no_key': 'Configuração salva. Falta chave API de texto.'
    }
};

var currentLang = localStorage.getItem('storyboard_lang') || 'es';

function __(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || (I18N['es'][key]) || key;
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('storyboard_lang', lang);
    applyTranslations();
}

function applyTranslations() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var key = el.getAttribute('data-i18n');
        var translated = __(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translated;
        } else {
            el.innerHTML = translated;
        }
    }
    var titles = document.querySelectorAll('[data-i18n-title]');
    for (var j = 0; j < titles.length; j++) {
        titles[j].title = __(titles[j].getAttribute('data-i18n-title'));
    }
}

// ============================================================
//  PRESETS DE PROVEEDORES
// ============================================================
const TEXT_PROVIDERS = {
    openai: {
        name: 'OpenAI (GPT-4o)',
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o',
        supportsJsonMode: true
    },
    mistral: {
        name: 'Mistral AI',
        url: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-large-latest',
        supportsJsonMode: true
    },
    gemini: {
        name: 'Google Gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/',
        model: 'gemini-2.0-flash',
        apiFormat: 'gemini',
        supportsJsonMode: true
    },
    opencode: {
        name: 'OpenCode Zen',
        url: 'https://opencode.ai/zen/v1/chat/completions',
        model: 'deepseek-v4-flash-free',
        supportsJsonMode: true
    },
    deepseek: {
        name: 'DeepSeek (pago)',
        url: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        supportsJsonMode: true
    },
    groq: {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        supportsJsonMode: true
    },
    fireworks: {
        name: 'Fireworks AI (gratis)',
        url: 'https://api.fireworks.ai/inference/v1/chat/completions',
        model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        supportsJsonMode: true
    },
    together: {
        name: 'Together AI',
        url: 'https://api.together.xyz/v1/chat/completions',
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        supportsJsonMode: true
    },
    openrouter: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-4o',
        supportsJsonMode: true
    },
    xai: {
        name: 'xAI Grok (pago)',
        url: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-2',
        supportsJsonMode: true
    },
    custom: {
        name: 'Personalizado',
        url: '',
        model: '',
        supportsJsonMode: false
    }
};

const IMAGE_PROVIDERS = {
    stability_sd3: {
        name: 'Stability AI SD3',
        model: 'Stable Diffusion 3',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._key, 'Accept': 'image/*' },
                bodyType: 'form',
                body: { prompt: prompt, output_format: 'jpeg', aspect_ratio: '16:9' }
            };
        }
    },
    gemini_imagen: {
        name: 'Google Gemini (Imagen)',
        model: 'Imagen 3.0',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=' + this._key,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    instances: [{ prompt: prompt }],
                    parameters: { sampleCount: 1, aspectRatio: '16:9' }
                }
            };
        }
    },
    hf_flux_schnell: {
        name: 'HuggingFace FLUX.1 Schnell',
        model: 'FLUX.1 Schnell',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._key, 'Content-Type': 'application/json' },
                body: { inputs: prompt, parameters: { width: 1024, height: 576 } }
            };
        }
    },
    hf_flux_dev: {
        name: 'HuggingFace FLUX.1 Dev',
        model: 'FLUX.1 Dev',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._key, 'Content-Type': 'application/json' },
                body: { inputs: prompt, parameters: { width: 1024, height: 576, num_inference_steps: 28 } }
            };
        }
    },
    hf_sdxl: {
        name: 'HuggingFace SDXL Turbo',
        model: 'SDXL Turbo',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://router.huggingface.co/hf-inference/models/stabilityai/sdxl-turbo',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._key, 'Content-Type': 'application/json' },
                body: { inputs: prompt, parameters: { width: 1024, height: 576 } }
            };
        }
    },
    openai_dalle3: {
        name: 'OpenAI DALL-E 3',
        model: 'DALL-E 3',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://api.openai.com/v1/images/generations',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._key, 'Content-Type': 'application/json' },
                body: { model: 'dall-e-3', prompt: prompt, n: 1, size: '1024x576', quality: 'standard' }
            };
        }
    },
    openai_dalle2: {
        name: 'OpenAI DALL-E 2',
        model: 'DALL-E 2',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: 'https://api.openai.com/v1/images/generations',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + this._key, 'Content-Type': 'application/json' },
                body: { model: 'dall-e-2', prompt: prompt, n: 1, size: '1024x576' }
            };
        }
    },
    pollinations: {
        name: 'Pollinations.ai (gratis)',
        method: 'GET',
        formatPayload: function(prompt) {
            var encoded = encodeURIComponent(prompt.slice(0, 400));
            return {
                url: 'https://image.pollinations.ai/prompt/' + encoded + '?width=1024&height=576&nologo=true',
                method: 'GET',
                headers: {}
            };
        }
    },
    custom: {
        name: 'Personalizado',
        method: 'POST',
        formatPayload: function(prompt) {
            return {
                url: this._url || '',
                method: this._method || 'POST',
                headers: this._headers || { 'Authorization': 'Bearer ' + this._key, 'Content-Type': 'application/json' },
                body: { prompt: prompt }
            };
        }
    }
};

// ============================================================
//  GESTION DE CONFIGURACION (localStorage)
// ============================================================
var CONFIG_KEY = 'storyboardpro_config_v2';

function getDefaultConfig() {
    return {
        text: {
            provider: 'opencode',
            apiKey: '',
            model: 'deepseek-v4-flash-free',
            baseUrl: 'https://opencode.ai/zen/v1/chat/completions'
        },
        image: {
            provider: 'pollinations',
            apiKey: '',
            model: '',
            baseUrl: '',
            extraHeaders: ''
        }
    };
}

function loadConfig() {
    try {
        var raw = localStorage.getItem(CONFIG_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            var def = getDefaultConfig();
            parsed.text = parsed.text || def.text;
            parsed.image = parsed.image || def.image;
            return parsed;
        }
    } catch (e) {}
    return getDefaultConfig();
}

function saveConfig(config) {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('No se pudo guardar configuracion en localStorage');
    }
}

function clearConfig() {
    try {
        localStorage.removeItem(CONFIG_KEY);
    } catch (e) {}
}

// ============================================================
//  MENSAJES DE ERROR (espanol)
// ============================================================
function getErrorMessage(code, providerName, apiType) {
    var prefix = '';
    if (apiType && providerName) {
        prefix = apiType + ' (' + providerName + '): ';
    } else if (providerName) {
        prefix = providerName + ': ';
    }
    var messages = {
        'CONFIG_REQUIRED': 'No hay API key configurada. Abre el panel de configuracion arriba y agrega tu clave.',
        'API_KEY_INVALID': 'API key invalida o sin creditos.',
        'RATE_LIMITED': 'Limite de uso alcanzado. Espera unos minutos o cambia de proveedor (ej: Mistral AI tambien es gratis).',
        'CONNECTION_ERROR': 'No se pudo conectar al proveedor.',
        'PARSE_ERROR': 'La IA devolvio una respuesta inesperada.',
        'MODEL_LOADING': 'El modelo se esta cargando. Reintentando...',
        'TIMEOUT': 'Tiempo de espera agotado en la API.',
        'SERVER_DOWN': 'El servidor proxy no responde. Ejecuta "node server.js" en la terminal.',
        'IMAGE_FAILED': 'Fallo la generacion de imagen.',
        'IMAGE_PROVIDER_FAILED': 'sin respuesta. Cambiando a Pollinations gratis...'
    };
    return prefix + (messages[code] || code);
}

// ============================================================
//  PROMPT DE SISTEMA (Forza JSON estricto)
// ============================================================
var obtenerSystemPrompt = function() {
    return 'Actua como un Director de Arte experto. Genera un guion tecnico completo para un storyboard de 4 escenas. Cada escena debe contener 2 planos (tomas) diferentes. Incluye toda la informacion tecnica posible para produccion cinematografica y publicitaria.\n\nREGLAS ESTRICTAS:\n1. Responde UNICAMENTE con un objeto JSON valido. Sin texto adicional, sin bloques markdown, sin ```json.\n2. El JSON debe tener exactamente esta estructura:\n{\n  "titulo": "Titulo de la presentacion",\n  "ritmo_spot": "Ritmo general del spot (ej: ritmo lento y reflexivo, ritmo rapido y dinamico)",\n  "notas_produccion": "Notas tecnicas de produccion: referencias de color, tratamiento visual, influencias artisticas, y direccion de arte general.",\n  "escenas": [\n    {\n      "numero": 1,\n      "ritmo_escena": "Ritmo de la escena",\n      "planos": [\n        {\n          "texto_narrativo": "Descripcion detallada de la accion (maximo 4 lineas, rica en detalle visual y emocional).",\n          "image_prompt": "Prompt in English (3-5 sentences) for a STORYBOARD ARTIST. MUST describe: exact subject(s) visible, their body position and facial expression, specific background elements, props, lighting direction, and depth of field. Be highly specific and visual. EACH image_prompt MUST BE COMPLETELY DIFFERENT from all others. Never reuse descriptions.",\n          "tipo_camara": "Tipo de camara y angulo (ej: Primer plano, Plano general, Picado, Contrapicado, etc.).",\n          "movimiento_camara": "Movimiento de camara completo (ej: Travelling forward, Steadicam, Camara fija, Dolly zoom, etc.).",\n          "ritmo_plano": "Ritmo y duracion estimada del plano (ej: lento 5s, rapido 1.5s).",\n          "estilo_visual": "Estilo visual y tratamiento del plano (ej: blanco y negro alto contraste, fotorealista grading frio, granular, motion graphics 2D)."\n        }\n      ]\n    }\n  ]\n}\nNOTA CRITICA: Cada image_prompt debe ser RADICALMENTE DIFERENTE de los demas. Describe elementos visuales UNICOS para cada plano: diferentes angulos, diferentes sujetos visibles, diferentes fondos, diferentes acciones. NUNCA uses descripciones genericas o similares entre planos. Si una escena tiene un primer plano y un plano general, los image_prompts deben reflejar esa diferencia con detalles visuales totalmente distintos.';
};

// ============================================================
//  FUNCIONES NUCLEO
// ============================================================

/**
 * Llama a la API de texto via el proxy generico.
 * Reintenta automaticamente en errores 503/429 y parseo fallido.
 */
function buildGeminiPayload(tc, brief) {
    var systemPrompt = obtenerSystemPrompt();
    return {
        body: {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: brief }] }],
            generationConfig: {
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            }
        },
        headers: {
            'Content-Type': 'application/json',
            'x-target-url': 'https://generativelanguage.googleapis.com/v1beta/models/' + tc.model + ':generateContent?key=' + tc.apiKey
        }
    };
}

function parseGeminiResponse(data) {
    var parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    if (parts) {
        return parts.map(function(p) { return p.text || ''; }).join('').trim();
    }
    return '';
}

function obtenerGuionIA(brief, intento) {
    intento = intento || 1;
    var MAX_INTENTOS = 3;
    var config = loadConfig();
    var tc = config.text;

    if (!tc.apiKey) {
        return Promise.reject(makeError('CONFIG_REQUIRED'));
    }

    var provider = TEXT_PROVIDERS[tc.provider] || TEXT_PROVIDERS.custom;
    var isGemini = (provider.apiFormat === 'gemini');

    function makeError(code, msg) {
        var err = new Error(msg || code);
        err.errorCode = code;
        err.providerName = provider.name;
        err.apiType = 'Texto';
        return err;
    }

    var requestHeaders, requestBody;

    if (isGemini) {
        var geminiReq = buildGeminiPayload(tc, brief);
        requestHeaders = geminiReq.headers;
        requestBody = geminiReq.body;
    } else {
        var payload = {
            model: tc.model,
            messages: [
                { role: 'system', content: obtenerSystemPrompt() },
                { role: 'user', content: brief }
            ],
            max_tokens: 4096
        };

        if (provider.supportsJsonMode) {
            payload.response_format = { type: 'json_object' };
        }

        requestHeaders = {
            'Content-Type': 'application/json',
            'x-target-url': tc.baseUrl,
            'x-api-key': tc.apiKey
        };
        requestBody = payload;
    }

    return fetchWithTimeout('/api/chat', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
    }, 30000)
    .then(function(response) {
        if (!response.ok) {
            return response.text().then(function(errText) {
                var errObj = safeParseJSON(errText) || {};
                var msg = errObj.error ? (errObj.error.message || errObj.error) : (errObj.message || ('HTTP ' + response.status));

                if (response.status === 401 || response.status === 403) {
                    return Promise.reject(makeError('API_KEY_INVALID', msg));
                }
                if (response.status === 429) {
                    if (intento < MAX_INTENTOS) {
                        var delay = intento * 20000 + 10000;
                        console.warn('Rate limit alcanzado (' + provider.name + '). Reintento ' + intento + '/' + (MAX_INTENTOS - 1) + ' en ' + (delay / 1000) + 's...');
                        return new Promise(function(r) { setTimeout(r, delay); })
                            .then(function() { return obtenerGuionIA(brief, intento + 1); });
                    }
                    return Promise.reject(makeError('RATE_LIMITED', msg));
                }
                if (response.status === 503) {
                    if (intento < MAX_INTENTOS) {
                        var delay503 = intento * 30000 + 20000;
                        console.warn('Modelo cargando (' + provider.name + '). Reintento ' + intento + '/' + (MAX_INTENTOS - 1) + ' en ' + (delay503 / 1000) + 's...');
                        return new Promise(function(r) { setTimeout(r, delay503); })
                            .then(function() { return obtenerGuionIA(brief, intento + 1); });
                    }
                    return Promise.reject(makeError('MODEL_LOADING', msg));
                }

                if (intento < MAX_INTENTOS) {
                    var delay2 = intento * 10000;
                    return new Promise(function(r) { setTimeout(r, delay2); })
                        .then(function() { return obtenerGuionIA(brief, intento + 1); });
                }
                return Promise.reject(makeError('HTTP_ERROR', msg));
            });
        }
        return response.text();
    })
    .then(function(rawText) {
        var parsedResponse = safeParseJSON(rawText);
        if (!parsedResponse) {
            if (intento < MAX_INTENTOS) {
                return new Promise(function(r) { setTimeout(r, 2000); })
                    .then(function() { return obtenerGuionIA(brief, intento + 1); });
            }
            throw makeError('PARSE_ERROR');
        }

        var extractedText = isGemini
            ? parseGeminiResponse(parsedResponse)
            : (parsedResponse.choices && parsedResponse.choices[0] && parsedResponse.choices[0].message && parsedResponse.choices[0].message.content);

        if (!extractedText) {
            if (intento < MAX_INTENTOS) {
                return new Promise(function(r) { setTimeout(r, 2000); })
                    .then(function() { return obtenerGuionIA(brief, intento + 1); });
            }
            throw makeError('PARSE_ERROR');
        }

        var guionParsed = safeParseJSON(extractedText);
        if (guionParsed) {
            var validado = validarGuion(guionParsed);
            if (validado) return validado;
        }

        if (intento < MAX_INTENTOS) {
            return new Promise(function(r) { setTimeout(r, 2000 * intento); })
                .then(function() { return obtenerGuionIA(brief, intento + 1); });
        }
        throw makeError('PARSE_ERROR');
    })
    .catch(function(e) {
        if (e.message === 'TIMEOUT_EXCEDIDO') {
            if (intento < MAX_INTENTOS) {
                console.warn('Timeout de 30s en texto (' + provider.name + '). Reintento ' + intento + '/' + (MAX_INTENTOS - 1) + '...');
                return new Promise(function(r) { setTimeout(r, 1000); })
                    .then(function() { return obtenerGuionIA(brief, intento + 1); });
            }
            throw makeError('TIMEOUT');
        }
        if (e.errorCode === 'CONFIG_REQUIRED' || e.errorCode === 'API_KEY_INVALID' ||
            e.errorCode === 'RATE_LIMITED' || e.errorCode === 'PARSE_ERROR' ||
            e.errorCode === 'MODEL_LOADING' || e.errorCode === 'TIMEOUT' ||
            e.errorCode === 'HTTP_ERROR') {
            throw e;
        }
        throw makeError('CONNECTION_ERROR');
    });
}

// Mantenemos alias para compatibilidad
function obtenerGuionGemini(brief, intento) {
    return obtenerGuionIA(brief, intento);
}

/**
 * Genera un placeholder estilo visor de director de cine.
 * Fallback visual profesional cuando falla la generacion externa.
 */
function generarPlaceholder(texto, index) {
    var W = 1024, H = 576;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    var t = texto.toLowerCase();
    var m = 40;

    ctx.fillStyle = '#faf6ee';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(180,160,130,0.08)';
    for (var i = 0; i < 500; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = 'rgba(180,170,150,0.2)';
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
    ctx.strokeStyle = '#c0b090';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H * 0.62); ctx.lineTo(W, H * 0.62); ctx.stroke();

    var cx = W * 0.5, cy = H * 0.45;

    if (t.includes('sun') || t.includes('sol') || t.includes('bright') || t.includes('brillante') || t.includes('day') || t.includes('dia')) {
        var sx = W * 0.82, sy = H * 0.18;
        var g = ctx.createRadialGradient(sx, sy, 8, sx, sy, 55);
        g.addColorStop(0, 'rgba(255,220,100,0.6)');
        g.addColorStop(0.4, 'rgba(255,200,60,0.2)');
        g.addColorStop(1, 'rgba(255,180,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f5d442'; ctx.beginPath(); ctx.arc(sx, sy, 25, 0, Math.PI * 2); ctx.fill();
    }

    var dibujarNube = function(nx, ny, s) {
        ctx.fillStyle = 'rgba(220,215,200,0.4)'; ctx.beginPath();
        ctx.arc(nx, ny, s*12, 0, Math.PI*2); ctx.arc(nx+s*10, ny-s*3, s*9, 0, Math.PI*2);
        ctx.arc(nx+s*20, ny, s*11, 0, Math.PI*2); ctx.arc(nx+s*30, ny-s*2, s*8, 0, Math.PI*2);
        ctx.fill();
    };
    dibujarNube(W*0.15, H*0.12, 1.2);
    dibujarNube(W*0.55, H*0.08, 1);

    if (t.includes('field') || t.includes('grass') || t.includes('campo') || t.includes('pasto') || t.includes('outdoor') || t.includes('exterior')) {
        ctx.fillStyle = 'rgba(140,180,100,0.25)';
        ctx.fillRect(0, H*0.62, W, H*0.38);
        ctx.strokeStyle = '#7a9a50';
        for (var x = 0; x < W; x += 8) {
            var hh = 8 + Math.random() * 18;
            ctx.lineWidth = 0.8 + Math.random() * 1.2;
            ctx.beginPath(); ctx.moveTo(x, H*0.62 + 2); ctx.lineTo(x + (Math.random()-0.5)*4, H*0.62 - hh); ctx.stroke();
        }
    }

    if (t.includes('mountain') || t.includes('montaña') || t.includes('landscape') || t.includes('paisaje')) {
        ctx.fillStyle = 'rgba(130,150,180,0.3)';
        ctx.beginPath(); ctx.moveTo(0, H*0.62); ctx.lineTo(W*0.15, H*0.28); ctx.lineTo(W*0.35, H*0.5);
        ctx.lineTo(W*0.5, H*0.22); ctx.lineTo(W*0.72, H*0.48); ctx.lineTo(W*0.9, H*0.3);
        ctx.lineTo(W, H*0.45); ctx.lineTo(W, H*0.62); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#708090'; ctx.lineWidth = 1; ctx.stroke();
    }

    if (t.includes('city') || t.includes('building') || t.includes('ciudad') || t.includes('edificio') || t.includes('urban') || t.includes('urbano')) {
        var colors = ['#8899aa', '#7799bb', '#99aabb', '#8899aa', '#7788aa'];
        for (var bx = -30; bx < W + 30; bx += 60) {
            var bw = 40 + Math.random() * 30;
            var bh = 60 + Math.random() * 90;
            ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)] + '40';
            ctx.fillRect(bx, H*0.62 - bh, bw, bh);
            ctx.strokeStyle = '#556677'; ctx.lineWidth = 0.8;
            ctx.strokeRect(bx, H*0.62 - bh, bw, bh);
            for (var wy = H*0.62 - bh + 8; wy < H*0.62 - 8; wy += 14) {
                for (var wx = bx + 5; wx < bx + bw - 8; wx += 10) {
                    ctx.fillStyle = 'rgba(255,255,200,0.25)';
                    ctx.fillRect(wx, wy, 5, 6);
                }
            }
        }
    }

    if (t.includes('tree') || t.includes('arbol') || t.includes('forest') || t.includes('bosque')) {
        for (var tx = W*0.08; tx < W*0.9; tx += W*0.17) {
            var th = 60 + Math.random() * 50;
            ctx.fillStyle = '#8B6914'; ctx.fillRect(tx - 6, H*0.62 - th, 12, th * 0.55);
            ctx.strokeStyle = '#6B4914'; ctx.lineWidth = 1; ctx.strokeRect(tx - 6, H*0.62 - th, 12, th * 0.55);
            var tcy = H*0.62 - th + th * 0.25;
            for (var l = 0; l < 3; l++) {
                var lr = 28 - l * 5;
                ctx.fillStyle = 'rgba(' + (60+l*15) + ',' + (120+l*10) + ',' + (30+l*5) + ',0.35)';
                ctx.beginPath(); ctx.arc(tx, tcy - l * 12, lr, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#3a6030'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(tx, tcy - l * 12, lr, 0, Math.PI*2); ctx.stroke();
            }
        }
    }

    if (t.includes('path') || t.includes('road') || t.includes('camino') || t.includes('carretera')) {
        ctx.fillStyle = 'rgba(180,160,130,0.4)';
        ctx.beginPath(); ctx.moveTo(W*0.3, H); ctx.lineTo(W*0.2, H*0.62); ctx.lineTo(W*0.35, H*0.62); ctx.lineTo(W*0.45, H);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#a09070'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(W*0.25, H*0.62); ctx.lineTo(W*0.38, H); ctx.stroke();
    }

    if (t.includes('watch') || t.includes('clock') || t.includes('reloj')) {
        var rx = cx - 90, ry = cy - 10;
        ctx.fillStyle = '#d4a520'; ctx.beginPath(); ctx.arc(rx, ry, 35, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rx, ry, 35, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#fffef5'; ctx.beginPath(); ctx.arc(rx, ry, 28, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(rx, ry, 28, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 16, ry - 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 18); ctx.stroke();
        ctx.fillStyle = '#d4a520'; ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#d4a520'; ctx.fillRect(rx - 6, ry - 45, 12, 12);
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2; ctx.strokeRect(rx - 6, ry - 45, 12, 12);
        if (t.includes('run') || t.includes('corriendo') || t.includes('chase') || t.includes('persiguiendo') || t.includes('fast') || t.includes('rapido')) {
            ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(rx - 18, ry + 36); ctx.lineTo(rx - 28, ry + 50); ctx.moveTo(rx - 18, ry + 36); ctx.lineTo(rx - 12, ry + 52); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx + 12, ry + 36); ctx.lineTo(rx + 4, ry + 50); ctx.moveTo(rx + 12, ry + 36); ctx.lineTo(rx + 22, ry + 52); ctx.stroke();
        }
    }

    if (t.includes('rabbit') || t.includes('bunny') || t.includes('conejo')) {
        var bbx = cx + 100, bby = cy - 15;
        ctx.fillStyle = '#e8e0d8'; ctx.beginPath(); ctx.ellipse(bbx, bby, 28, 38, 0.1, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(bbx, bby, 28, 38, 0.1, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bbx + 20, bby + 20, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e8e0d8'; ctx.beginPath(); ctx.arc(bbx - 5, bby - 48, 20, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bbx - 5, bby - 48, 20, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#e8e0d8';
        ctx.beginPath(); ctx.moveTo(bbx - 12, bby - 62); ctx.quadraticCurveTo(bbx - 18, bby - 95, bbx - 8, bby - 90);
        ctx.quadraticCurveTo(bbx - 4, bby - 70, bbx - 5, bby - 60); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bbx + 4, bby - 62); ctx.quadraticCurveTo(bbx + 10, bby - 95, bbx, bby - 92);
        ctx.quadraticCurveTo(bbx - 4, bby - 70, bbx - 5, bby - 60); ctx.fill();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bbx - 12, bby - 62); ctx.quadraticCurveTo(bbx - 18, bby - 95, bbx - 8, bby - 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bbx + 4, bby - 62); ctx.quadraticCurveTo(bbx + 10, bby - 95, bbx, bby - 92); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(bbx + 2, bby - 52, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bbx + 3, bby - 53, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f0a0a0'; ctx.beginPath(); ctx.arc(bbx - 2, bby - 43, 2.5, 0, Math.PI*2); ctx.fill();
    }

    if (t.includes('mr') || t.includes('man') || t.includes('person') || t.includes('character') || t.includes('señor') || t.includes('hombre') || t.includes('personaje') || t.includes('figure') || t.includes('silhouette') || t.includes('silueta')) {
        var px = cx + 140, py = cy - 20;
        if (t.includes('hat') || t.includes('sombrero') || t.includes('top')) {
            ctx.fillStyle = '#444'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px - 20, py - 10); ctx.lineTo(px, py - 32); ctx.lineTo(px + 20, py - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#444'; ctx.fillRect(px - 24, py - 12, 48, 6);
            ctx.strokeRect(px - 24, py - 12, 48, 6);
        }
        ctx.fillStyle = '#f5d5b8'; ctx.beginPath(); ctx.arc(px, py - 5, 14, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py - 5, 14, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(px - 5, py - 9, 2.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 5, py - 9, 2.2, 0, Math.PI*2); ctx.fill();
        if (t.includes('mustache') || t.includes('bigote') || t.includes('mostacho')) {
            ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px - 10, py - 1); ctx.quadraticCurveTo(px, py + 3, px + 10, py - 1); ctx.stroke();
        }
        ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, py + 1, 5, 0.1, Math.PI - 0.1); ctx.stroke();
        ctx.fillStyle = '#3a4a5a'; ctx.fillRect(px - 16, py + 10, 32, 50);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(px - 16, py + 10, 32, 50);
        ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(px - 16, py + 18); ctx.lineTo(px - 40, py + 35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 16, py + 18); ctx.lineTo(px + 35, py + 30); ctx.stroke();
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(px - 12, py + 60, 10, 42); ctx.fillRect(px + 2, py + 60, 10, 42);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 12, py + 60, 10, 42); ctx.strokeRect(px + 2, py + 60, 10, 42);
    }

    if (t.includes('trap') || t.includes('hole') || t.includes('pit') || t.includes('trampa') || t.includes('hoyo') || t.includes('pitfall')) {
        var hhx = cx - 20, hhy = cy + 90;
        ctx.fillStyle = 'rgba(30,20,10,0.5)';
        ctx.beginPath(); ctx.ellipse(hhx, hhy, 58, 26, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#3a2510'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(hhx, hhy, 58, 26, 0, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = 'rgba(10,5,0,0.4)';
        ctx.beginPath(); ctx.ellipse(hhx, hhy - 4, 48, 18, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#5a8a3a';
        for (var l2 = 0; l2 < 8; l2++) {
            var la = Math.random() * Math.PI * 2;
            var lx = hhx + Math.cos(la) * 50;
            var ly = hhy + Math.sin(la) * 20;
            ctx.beginPath(); ctx.ellipse(lx, ly, 8, 4, la, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#3a6a20'; ctx.lineWidth = 0.5; ctx.stroke();
        }
    }

    if (t.includes('cereal') || t.includes('box') || t.includes('caja') || t.includes('paquete')) {
        var cbx = cx + 50, cby = cy + 30;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(cbx - 30, cby - 50, 60, 80);
        ctx.strokeStyle = '#922B21'; ctx.lineWidth = 2.5;
        ctx.strokeRect(cbx - 30, cby - 50, 60, 80);
        ctx.fillStyle = '#f9e79f'; ctx.fillRect(cbx - 24, cby - 42, 48, 28);
        ctx.strokeStyle = '#d4ac0d'; ctx.lineWidth = 1.5; ctx.strokeRect(cbx - 24, cby - 42, 48, 28);
        ctx.fillStyle = '#922B21'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('CEREAL', cbx, cby - 24);
        ctx.fillStyle = '#c0392b'; ctx.fillRect(cbx - 28, cby - 58, 56, 10);
        ctx.strokeStyle = '#7B241C'; ctx.lineWidth = 1.5; ctx.strokeRect(cbx - 28, cby - 58, 56, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(cbx - 38, cby - 40); ctx.lineTo(cbx - 30, cby - 32); ctx.lineTo(cbx - 35, cby - 28); ctx.closePath(); ctx.fill();
    }

    if (t.includes('run') || t.includes('chase') || t.includes('fast') || t.includes('speed') || t.includes('dynamic') || t.includes('corriendo') || t.includes('rapido') || t.includes('movimiento') || t.includes('persecucion') || t.includes('action')) {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        for (var a = 0; a < 6; a++) {
            var ax = cx - 200 + a * 40;
            ctx.beginPath(); ctx.moveTo(ax, cy + 60); ctx.lineTo(ax + 60, cy + 60); ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    if (t.includes('spotlight') || t.includes('dark') || t.includes('oscuro') || t.includes('shadow') || t.includes('sombra') || t.includes('dramatic') || t.includes('dramatico')) {
        for (var s = 0; s < 2; s++) {
            var sx2 = cx - 80 + s * 200;
            var g2 = ctx.createRadialGradient(sx2, cy - 60, 20, sx2, cy + 40, 300);
            g2.addColorStop(0, 'rgba(255,255,240,0.15)');
            g2.addColorStop(1, 'rgba(0,0,0,0.15)');
            ctx.fillStyle = g2; ctx.fillRect(sx2 - 200, 0, 400, H);
        }
    }

    if (t.includes('spark') || t.includes('dust') || t.includes('chispa') || t.includes('polvo') || t.includes('magic') || t.includes('magico') || t.includes('sparkle') || t.includes('brillo')) {
        for (var p = 0; p < 25; p++) {
            var px3 = cx + (Math.random() - 0.5) * 350;
            var py3 = cy + (Math.random() - 0.5) * 120;
            ctx.fillStyle = 'rgba(255,' + (200 + Math.random()*55) + ',' + (Math.random()*100) + ',0.5)';
            ctx.beginPath(); ctx.arc(px3, py3, 1 + Math.random() * 2.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    if (t.includes('net') || t.includes('red')) {
        var nx = cx + 80, ny = cy - 40;
        ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(nx, ny, 35, 0, Math.PI * 2); ctx.stroke();
        for (var ag = 0; ag < 6; ag++) {
            var ang = ag * Math.PI / 3;
            ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(ang) * 35, ny + Math.sin(ang) * 35); ctx.stroke();
        }
    }

    ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5;
    var l = 40;
    [
        [m, m, l, 0], [m, m, 0, l], [W-m, m, -l, 0], [W-m, m, 0, l],
        [m, H-m, l, 0], [m, H-m, 0, -l], [W-m, H-m, -l, 0], [W-m, H-m, 0, -l]
    ].forEach(function(cr) {
        ctx.beginPath(); ctx.moveTo(cr[0], cr[1]); ctx.lineTo(cr[0] + cr[2], cr[1] + cr[3]); ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 0.8;
    ctx.setLineDash([5, 15]);
    ctx.beginPath(); ctx.moveTo(W/2, 20); ctx.lineTo(W/2, H-20);
    ctx.moveTo(20, H/2); ctx.lineTo(W-20, H/2); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#444'; ctx.font = 'bold 13px Courier New, monospace'; ctx.textAlign = 'left';
    ctx.fillText('PLANO ' + (index + 1), m + 4, H - 12);
    ctx.textAlign = 'right'; ctx.fillText('16:9', W - m - 4, H - 12);
    ctx.textAlign = 'center'; ctx.font = '9px Courier New, monospace'; ctx.fillStyle = '#aaa';
    ctx.fillText('fierroduque.com', W/2, H - 12);

    return canvas.toDataURL('image/png');
}

/**
 * Genera imagenes usando el proveedor configurado con fallback a Pollinations y Canvas.
 */
function fetchImageAsBase64(prompt, index) {
    var enhanced = prompt;
    var config = loadConfig();
    var imgConfig = config.image;

    function arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        for (var i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return 'data:image/jpeg;base64,' + btoa(binary);
    }

    function tryViaProxy(payload) {
        return fetchWithTimeout('/api/img', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, 45000).then(function(r) {
            if (r.status !== 200) return null;
            return r.arrayBuffer();
        }).then(function(buf) {
            if (!buf || buf.byteLength < 500) return null;
            console.log('Img ' + (index + 1) + ' OK: ' + buf.byteLength + ' bytes');
            return arrayBufferToBase64(buf);
        }).catch(function() {
            return null;
        });
    }

    // 1) Proveedor de imagen configurado
    if (imgConfig.provider && imgConfig.provider !== 'pollinations' && imgConfig.provider !== 'custom') {
        var provider = IMAGE_PROVIDERS[imgConfig.provider];
        if (provider && imgConfig.apiKey) {
            provider._key = imgConfig.apiKey;
            var payload = provider.formatPayload(enhanced);
            var srcName = provider.name;
            console.log('Img ' + (index + 1) + ' probando ' + srcName + '...');
            return tryViaProxy(payload).then(function(result) {
                if (result) return { data: result, source: srcName };
                console.warn('Img ' + (index + 1) + ' ' + srcName + ' ' + getErrorMessage('IMAGE_PROVIDER_FAILED', srcName, 'Imagen'));
                return tryPollinations(enhanced, index);
            });
        }
    }

    // 2) Proveedor personalizado
    if (imgConfig.provider === 'custom' && imgConfig.apiKey) {
        var customProvider = IMAGE_PROVIDERS.custom;
        customProvider._key = imgConfig.apiKey;
        customProvider._url = imgConfig.baseUrl;
        customProvider._method = 'POST';
        if (imgConfig.extraHeaders) {
            try {
                customProvider._headers = JSON.parse(imgConfig.extraHeaders);
            } catch(e) {
                customProvider._headers = { 'Authorization': 'Bearer ' + imgConfig.apiKey, 'Content-Type': 'application/json' };
            }
        }
        var customPayload = customProvider.formatPayload(enhanced);
        console.log('Img ' + (index + 1) + ' probando Personalizado...');
        return tryViaProxy(customPayload).then(function(result) {
            if (result) return { data: result, source: 'Personalizado' };
            console.warn('Img ' + (index + 1) + ' Personalizado ' + getErrorMessage('IMAGE_PROVIDER_FAILED', 'Personalizado', 'Imagen'));
            return tryPollinations(enhanced, index);
        });
    }

    // 3) Pollinations (gratis, fallback por defecto)
    return tryPollinations(enhanced, index);
}

function tryPollinations(enhanced, index) {
    var pollinationsProvider = IMAGE_PROVIDERS.pollinations;
    var payload = pollinationsProvider.formatPayload(enhanced);
    console.log('Img ' + (index + 1) + ' probando Pollinations.ai (gratis)...');

    function arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        for (var i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return 'data:image/jpeg;base64,' + btoa(binary);
    }

    return tryRequestWithRetry(payload, 5, index).then(function(buf) {
        if (buf && buf.byteLength > 500) {
            console.log('Img ' + (index + 1) + ' Pollinations OK: ' + buf.byteLength + ' bytes');
            return { data: arrayBufferToBase64(buf), source: 'Pollinations.ai (gratis)' };
        }
        console.warn('Img ' + (index + 1) + ' usando sketch Canvas (placeholder)');
        return { data: generarPlaceholder(enhanced, index), source: 'Canvas (placeholder)' };
    });

    function tryRequestWithRetry(payload, maxRetries, idx) {
        return fetchWithTimeout('/api/img', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, 60000).then(function(r) {
            if (r.status === 200) return r.arrayBuffer();
            return null;
        }).then(function(buf) {
            if (buf && buf.byteLength > 500) return buf;
            if (maxRetries > 1) {
                var wait = (6 - maxRetries) * 30000;
                console.log('  reintentando en ' + (wait / 1000) + 's...');
                return new Promise(function(rs) { setTimeout(rs, wait); })
                    .then(function() { return tryRequestWithRetry(payload, maxRetries - 1, idx); });
            }
            return null;
        }).catch(function() {
            if (maxRetries > 1) {
                return new Promise(function(rs) { setTimeout(rs, 15000); })
                    .then(function() { return tryRequestWithRetry(payload, maxRetries - 1, idx); });
            }
            return null;
        });
    }
}

/**
 * Carga dinamica de jsPDF si no esta disponible
 */
function asegurarJsPDF() {
    return new Promise(function(resolve, reject) {
        if (typeof window.jspdf !== 'undefined') return resolve();
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() { resolve(); };
        script.onerror = function() { reject(new Error('No se pudo cargar jsPDF')); };
        document.head.appendChild(script);
    });
}

/**
 * Ensambla el PDF con jsPDF en formato 16:9 (A4 landscape).
 */
function ensamblarPDF(datosGuion, imagenes) {
    return asegurarJsPDF().then(function() {
        return fetch('/logo-fap.png')
            .then(function(r) { return r.blob(); })
            .then(function(blob) {
                return new Promise(function(resolve) {
                    var reader = new FileReader();
                    reader.onload = function() { resolve(reader.result); };
                    reader.readAsDataURL(blob);
                });
            }).catch(function() {
                return null;
            });
    }).then(function(logoDataUrl) {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF('p', 'mm', [297, 335]);
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();
        var m = 12;
        var cw = pw - m * 2;
        var cy = pw / 2;
        var RATIO = 16 / 9;
        var lh = 3;

        var pie = function(numPag, color) {
            color = color || [130, 130, 130];
            doc.setFont('courier', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text('www.fierroduque.com', m, ph - 5);
            doc.text('www.freeanimationpower.com', pw - m, ph - 5, { align: 'right' });
        };

        doc.setFillColor(255, 224, 0);
        doc.rect(0, 0, pw, ph, 'F');

        // Logo FAP centrado arriba
        var logoY = 0;
        if (logoDataUrl) {
            var logoW = 30;
            var logoH = 30;
            var logoX = cy - logoW / 2;
            logoY = 16;
            doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
        }

        var titY = logoDataUrl ? logoY + logoH + 14 : 50;

        doc.setTextColor(252, 73, 2);
        doc.setFont('courier', 'bold');
        doc.setFontSize(28);
        var tituloLines = doc.splitTextToSize(datosGuion.titulo.toUpperCase(), cw * 0.8);
        doc.text(tituloLines, cy, titY, { align: 'center' });

        var titEnd = 78 + (tituloLines.length - 1) * 10;
        doc.setDrawColor(252, 73, 2);
        doc.setLineWidth(0.8);
        doc.line(cy - 44, titEnd + 14, cy + 44, titEnd + 14);
        var nextY = titEnd + 30;

        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('RITMO DEL SPOT', cy, nextY, { align: 'center' });
        nextY += 8;

        var ritmoSpot = datosGuion.ritmo_spot || '';
        if (ritmoSpot) {
            doc.setFont('courier', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);
            var ritmoLines = doc.splitTextToSize(ritmoSpot.toUpperCase(), cw * 0.75);
            doc.text(ritmoLines.slice(0, 2), cy, nextY, { align: 'center' });
            nextY += 4 + ritmoLines.slice(0, 2).length * 6 + 35;
        } else {
            nextY += 35;
        }

        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('PRODUCCION', cy, nextY, { align: 'center' });
        nextY += 10;

        var notas = datosGuion.notas_produccion || '';
        if (notas) {
            doc.setFont('courier', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            var notaLines = doc.splitTextToSize(notas, cw * 0.8);
            doc.text(notaLines, cy, nextY, { align: 'center' });
            nextY += 2 + notaLines.length * 4.5;
        }

        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(252, 73, 2);
        doc.text('Generado por fierroduque.com y freeanimationpower.com', cy, ph - 42, { align: 'center' });
        pie(1, [252, 73, 2]);

        for (var e = 0; e < datosGuion.escenas.length; e++) {
            var escena = datosGuion.escenas[e];
            doc.addPage();

            var yPos = m;

            doc.setFont('courier', 'bold');
            doc.setFontSize(11);
            var ritmoEsc = escena.ritmo_escena ? ' \u2014 ' + escena.ritmo_escena.toUpperCase() : '';
            var titEsc = 'ESCENA ' + escena.numero + ritmoEsc;
            var titEscLines = doc.splitTextToSize(titEsc, cw);

            doc.setTextColor(30, 30, 30);
            doc.text(titEscLines, m, yPos + 5);
            yPos += 7 + (titEscLines.length - 1) * 4;

            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.5);
            doc.line(m, yPos, pw - m, yPos);
            yPos += 5;

            for (var p = 0; p < escena.planos.length; p++) {
                var plano = escena.planos[p];
                var imgSrc = imagenes[e] ? imagenes[e][p] : null;

                if (p > 0) {
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.3);
                    doc.line(m, yPos, pw - m, yPos);
                    yPos += 5;
                }

                doc.setFont('courier', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(60, 60, 60);
                doc.text('PLANO ' + (p + 1), m, yPos + 4);
                yPos += 7;

                var imgHmax = 72;
                var imgW = imgHmax * RATIO;
                var imgH = imgHmax;
                var xOff = m + (cw - imgW) / 2;
                if (imgSrc) {
                    var fmt = imgSrc.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(imgSrc, fmt, xOff + 1.5, yPos + 1.5, imgW - 3, imgH - 3);
                    doc.setDrawColor(160, 160, 160);
                    doc.setLineWidth(1.2);
                    doc.rect(xOff, yPos, imgW, imgH);
                }
                yPos += imgH + 5;

                doc.setFont('courier', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(30, 30, 30);
                doc.text('ACCION / DIALOGO', m, yPos + 2);
                yPos += 6;
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(70, 70, 70);
                var narrLines = doc.splitTextToSize(plano.texto_narrativo, cw);
                doc.text(narrLines, m, yPos);
                yPos += narrLines.length * lh + 1;

                doc.setFont('courier', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(30, 30, 30);
                doc.text('CAMARA', m, yPos + 2);
                yPos += 6;
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(70, 70, 70);
                var camLines = doc.splitTextToSize(plano.tipo_camara || 'No especificado', cw);
                doc.text(camLines, m, yPos);
                yPos += camLines.length * lh + 1;

                doc.setFont('courier', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(30, 30, 30);
                doc.text('MOVIMIENTO', m, yPos + 2);
                yPos += 6;
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(70, 70, 70);
                var movLines = doc.splitTextToSize(plano.movimiento_camara || 'No especificado', cw);
                doc.text(movLines, m, yPos);
                yPos += movLines.length * lh + 1;

                doc.setFont('courier', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(30, 30, 30);
                doc.text('RITMO', m, yPos + 2);
                yPos += 6;
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(70, 70, 70);
                var ritLines = doc.splitTextToSize(plano.ritmo_plano || 'No especificado', cw);
                doc.text(ritLines, m, yPos);
                yPos += ritLines.length * lh + 1;

                doc.setFont('courier', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(30, 30, 30);
                doc.text('ESTILO VISUAL', m, yPos + 2);
                yPos += 6;
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(70, 70, 70);
                var estLines = doc.splitTextToSize(plano.estilo_visual || 'No especificado', cw);
                doc.text(estLines, m, yPos);
                yPos += estLines.length * lh + 1;
            }

            pie(e + 2);
        }

        var fileName = 'Storyboard_' + datosGuion.titulo.replace(/[^a-zA-Z0-9_]/g, '_') + '.pdf';
        doc.save(fileName);
    });
}

// ============================================================
//  INTERFAZ DE CONFIGURACION
// ============================================================
function initConfigUI() {
    var config = loadConfig();

    var textProviderSelect = document.getElementById('textProvider');
    var textApiKeyInput = document.getElementById('textApiKey');
    var textModelInput = document.getElementById('textModel');
    var textUrlInput = document.getElementById('textUrl');
    var imageProviderSelect = document.getElementById('imageProvider');
    var imageApiKeyInput = document.getElementById('imageApiKey');
    var imageModelInput = document.getElementById('imageModel');
    var imageUrlInput = document.getElementById('imageUrl');
    var imageExtraHeadersInput = document.getElementById('imageExtraHeaders');
    var imageExtraHeadersWrap = document.getElementById('imageExtraHeadersWrap');
    var showConfigBtn = document.getElementById('showConfigBtn');
    var configPanel = document.getElementById('configPanel');
    var saveConfigBtn = document.getElementById('saveConfigBtn');
    var clearConfigBtn = document.getElementById('clearConfigBtn');
    var configStatus = document.getElementById('configStatus');

    // Llenar selectores
    function fillSelect(select, providers, selected) {
        select.innerHTML = '';
        var keys = Object.keys(providers);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = providers[k].name;
            if (k === selected) opt.selected = true;
            select.appendChild(opt);
        }
    }

    function populateTextFields() {
        var providerKey = textProviderSelect.value;
        var provider = TEXT_PROVIDERS[providerKey];
        if (provider && providerKey !== 'custom') {
            textModelInput.value = config.text.model || provider.model;
            textUrlInput.value = config.text.baseUrl || provider.url;
        }
    }

    function populateImageFields() {
        var providerKey = imageProviderSelect.value;
        var provider = IMAGE_PROVIDERS[providerKey];
        if (provider && providerKey !== 'custom') {
            if (provider.method === 'GET' && providerKey === 'pollinations') {
                imageApiKeyInput.disabled = true;
                imageApiKeyInput.placeholder = 'No necesita API key';
                imageModelInput.value = 'Pollinations.ai (gratuito)';
                imageModelInput.disabled = true;
            } else {
                imageApiKeyInput.disabled = false;
                imageApiKeyInput.placeholder = 'Ingresa tu API key / token';
                imageModelInput.disabled = false;
            }
        }
        if (providerKey === 'custom') {
            imageApiKeyInput.disabled = false;
            imageModelInput.disabled = false;
            imageUrlInput.disabled = false;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'block';
        } else {
            imageUrlInput.disabled = (providerKey !== 'custom');
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'none';
        }
    }

    // --- Registrar listeners ANTES de fillSelect ---
    var initializing = true;

    textProviderSelect.addEventListener('change', function() {
        if (initializing) return;
        var providerKey = textProviderSelect.value;
        var provider = TEXT_PROVIDERS[providerKey];
        if (providerKey === 'custom') {
            textModelInput.value = '';
            textUrlInput.value = '';
            textModelInput.disabled = false;
            textUrlInput.disabled = false;
        } else {
            textModelInput.value = provider.model;
            textUrlInput.value = provider.url;
            textModelInput.disabled = false;
            textUrlInput.disabled = false;
        }
    });

    imageProviderSelect.addEventListener('change', function() {
        if (initializing) return;
        var providerKey = imageProviderSelect.value;
        var provider = IMAGE_PROVIDERS[providerKey];
        if (providerKey === 'pollinations') {
            imageApiKeyInput.value = '';
            imageApiKeyInput.disabled = true;
            imageApiKeyInput.placeholder = 'No necesita API key';
            imageModelInput.value = 'Pollinations.ai (gratuito)';
            imageModelInput.disabled = true;
            imageUrlInput.value = '';
            imageUrlInput.disabled = true;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'none';
        } else if (providerKey === 'custom') {
            imageApiKeyInput.disabled = false;
            imageApiKeyInput.placeholder = 'Ingresa tu API key / token';
            imageModelInput.disabled = false;
            imageUrlInput.disabled = false;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'block';
        } else {
            imageApiKeyInput.disabled = false;
            imageApiKeyInput.placeholder = 'Ingresa tu API key / token';
            imageModelInput.value = provider ? (provider.model || provider.name) : '';
            imageModelInput.disabled = false;
            imageUrlInput.value = '';
            imageUrlInput.disabled = true;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'none';
        }
    });

    // --- Llenar selectores (listeners bloqueados) ---
    fillSelect(textProviderSelect, TEXT_PROVIDERS, config.text.provider);
    fillSelect(imageProviderSelect, IMAGE_PROVIDERS, config.image.provider);

    // --- Cargar valores guardados ---
    textApiKeyInput.value = config.text.apiKey || '';
    textModelInput.value = config.text.model || '';
    textUrlInput.value = config.text.baseUrl || '';
    imageApiKeyInput.value = config.image.apiKey || '';
    imageModelInput.value = config.image.model || '';
    imageUrlInput.value = config.image.baseUrl || '';
    if (imageExtraHeadersInput) {
        imageExtraHeadersInput.value = config.image.extraHeaders || '';
    }

    // --- Aplicar estado inicial de campos segun proveedor ---
    (function applyTextState() {
        var pk = textProviderSelect.value;
        var p = TEXT_PROVIDERS[pk];
        if (pk === 'custom') {
            textModelInput.disabled = false;
            textUrlInput.disabled = false;
        } else if (p) {
            textModelInput.value = textModelInput.value || p.model;
            textUrlInput.value = textUrlInput.value || p.url;
            textModelInput.disabled = false;
            textUrlInput.disabled = false;
        }
    })();

    (function applyImageState() {
        var pk = imageProviderSelect.value;
        var prov = IMAGE_PROVIDERS[pk];
        if (pk === 'pollinations') {
            imageApiKeyInput.value = imageApiKeyInput.value || '';
            imageApiKeyInput.disabled = true;
            imageApiKeyInput.placeholder = 'No necesita API key';
            imageModelInput.value = 'Pollinations.ai (gratuito)';
            imageModelInput.disabled = true;
            imageUrlInput.value = '';
            imageUrlInput.disabled = true;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'none';
        } else if (pk === 'custom') {
            imageApiKeyInput.disabled = false;
            imageApiKeyInput.placeholder = 'Ingresa tu API key / token';
            imageModelInput.disabled = false;
            imageUrlInput.disabled = false;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'block';
        } else {
            imageApiKeyInput.disabled = false;
            imageApiKeyInput.placeholder = 'Ingresa tu API key / token';
            imageModelInput.value = imageModelInput.value || (prov ? (prov.model || prov.name) : '');
            imageModelInput.disabled = false;
            imageUrlInput.value = '';
            imageUrlInput.disabled = true;
            if (imageExtraHeadersWrap) imageExtraHeadersWrap.style.display = 'none';
        }
    })();

    // --- Fin inicializacion: soltar bloqueo de listeners ---
    initializing = false;

    // --- Guardar configuracion ---
    saveConfigBtn.addEventListener('click', function() {
        config.text.provider = textProviderSelect.value;
        config.text.apiKey = textApiKeyInput.value.trim();
        config.text.model = textModelInput.value.trim();
        config.text.baseUrl = textUrlInput.value.trim();

        config.image.provider = imageProviderSelect.value;
        config.image.apiKey = imageApiKeyInput.value.trim();
        config.image.model = imageModelInput.value.trim();
        config.image.baseUrl = imageUrlInput.value.trim();
        if (imageExtraHeadersInput) {
            config.image.extraHeaders = imageExtraHeadersInput.value.trim();
        }

        saveConfig(config);

        if (config.text.apiKey) {
            configStatus.textContent = __('saved_ok');
            configStatus.style.color = '#2d7d46';
        } else {
            configStatus.textContent = __('saved_no_key');
            configStatus.style.color = '#c09800';
        }
    });

    // --- Limpiar configuracion ---
    clearConfigBtn.addEventListener('click', function() {
        clearConfig();
        config = getDefaultConfig();
        initializing = true;
        fillSelect(textProviderSelect, TEXT_PROVIDERS, config.text.provider);
        fillSelect(imageProviderSelect, IMAGE_PROVIDERS, config.image.provider);
        textApiKeyInput.value = '';
        textModelInput.value = config.text.model;
        textUrlInput.value = config.text.baseUrl;
        imageApiKeyInput.value = '';
        imageModelInput.value = '';
        imageUrlInput.value = '';
        if (imageExtraHeadersInput) imageExtraHeadersInput.value = '';
        initializing = false;
        // Disparar manualmente para aplicar estado
        textProviderSelect.dispatchEvent(new Event('change'));
        imageProviderSelect.dispatchEvent(new Event('change'));
        configStatus.textContent = '';
    });

    // Toggle panel
    showConfigBtn.addEventListener('click', function() {
        var panel = configPanel;
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            showConfigBtn.textContent = __('hide_config');
        } else {
            showConfigBtn.textContent = __('config_apis');
        }
    });

    // Actualizar estado inicial
    if (config.text.apiKey) {
        configStatus.textContent = 'API de texto configurada. Listo.';
        configStatus.style.color = '#2d7d46';
    }
}

// ============================================================
//  CONTROLADOR DE INTERFAZ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    applyTranslations();

    var langBtns = document.querySelectorAll('#langSwitch .lang-btn');
    for (var li = 0; li < langBtns.length; li++) {
        langBtns[li].addEventListener('click', function() {
            var lang = this.getAttribute('data-lang');
            setLang(lang);
            for (var lj = 0; lj < langBtns.length; lj++) {
                langBtns[lj].classList.remove('active-lang');
            }
            this.classList.add('active-lang');
            var showCfg = document.getElementById('showConfigBtn');
            if (showCfg) {
                var panel = document.getElementById('configPanel');
                if (panel && !panel.classList.contains('hidden')) {
                    showCfg.innerHTML = __('hide_config');
                } else {
                    showCfg.innerHTML = __('config_apis');
                }
            }
        });
    }

    var initialLangBtn = document.querySelector('#langSwitch .lang-btn[data-lang="' + currentLang + '"]');
    if (initialLangBtn) initialLangBtn.classList.add('active-lang');

    initConfigUI();

    var generateBtn = document.getElementById('generateBtn');
    var briefInput = document.getElementById('briefInput');
    var loader = document.getElementById('loader');
    var statusText = document.getElementById('statusText');
    var configPanel = document.getElementById('configPanel');

    generateBtn.addEventListener('click', function() {
        var brief = briefInput.value.trim();
        if (!brief) {
            alert('Por favor, ingresa un brief creativo valido.');
            return;
        }

        var config = loadConfig();
        if (!config.text.apiKey) {
            if (configPanel.classList.contains('hidden')) {
                configPanel.classList.remove('hidden');
                var showConfigBtn = document.getElementById('showConfigBtn');
                if (showConfigBtn) showConfigBtn.textContent = __('hide_config');
            }
            alert(getErrorMessage('CONFIG_REQUIRED', '', 'API de Texto'));
            return;
        }

        generateBtn.disabled = true;
        loader.classList.remove('hidden');

        statusText.innerText = __('status_text_intro');
        obtenerGuionIA(brief).then(function(datosGuion) {

            statusText.innerText = __('status_generating');
            var promesas = [];
            var sourcesUsadas = {};
            for (var e = 0; e < datosGuion.escenas.length; e++) {
                var escena = datosGuion.escenas[e];
                (function(escena, e) {
                    var planosImg = [];
                    var pChain = Promise.resolve();
                    for (var p = 0; p < escena.planos.length; p++) {
                        (function(p) {
                            pChain = pChain.then(function() {
                                var imgIdx = e * 10 + p;
                                statusText.innerText = __('status_image') + ' ' + (imgIdx + 1) + '/8...';
                                var plano = escena.planos[p];
                                var uniquePrompt = MASTER_STYLE + '. Panel ' + (e * 2 + p + 1) + '/8: ' + (plano.image_prompt || 'continuity shot') + '. Camera: ' + (plano.tipo_camara || 'medium shot');
                                console.log('Prompt ' + (e + 1) + '-' + (p + 1) + ': ' + uniquePrompt.slice(0, 150));
                                return fetchImageAsBase64(uniquePrompt, imgIdx);
                            }).then(function(result) {
                                planosImg.push(result.data);
                                var src = result.source || 'Desconocido';
                                sourcesUsadas[src] = (sourcesUsadas[src] || 0) + 1;
                                statusText.innerText = __('status_img_item') + ' ' + (e * 2 + p + 1) + '/8: ' + src;
                            });
                        })(p);
                    }
                    promesas.push(pChain.then(function() { return planosImg; }));
                })(escena, e);
            }

            return Promise.all(promesas).then(function(imagenes) {
                statusText.innerText = __('status_pdf');
                var resumen = [];
                var keys = Object.keys(sourcesUsadas);
                for (var k = 0; k < keys.length; k++) {
                    resumen.push(sourcesUsadas[keys[k]] + 'x ' + keys[k]);
                }
                console.log('Resumen de imagenes: ' + resumen.join(', '));
                return ensamblarPDF(datosGuion, imagenes);
            }).then(function() {
                var resumen = [];
                var keys = Object.keys(sourcesUsadas);
                for (var k = 0; k < keys.length; k++) {
                    resumen.push(sourcesUsadas[keys[k]] + 'x ' + keys[k]);
                }
                statusText.innerText = __('status_completed') + ' ' + (resumen.join(', ') || 'N/A');
            });

        }).catch(function(error) {
            console.error('Error en el flujo principal:', error);
            var code = error.errorCode || error.message;
            var provider = error.providerName || '';
            var type = error.apiType || '';
            var msg = getErrorMessage(code, provider, type);
            alert(msg);
            statusText.innerText = __('status_error') + ' ' + msg;
        }).then(function() {
            setTimeout(function() {
                loader.classList.add('hidden');
                generateBtn.disabled = false;
                statusText.innerText = __('processing');
            }, 2000);
        });
    });
});
