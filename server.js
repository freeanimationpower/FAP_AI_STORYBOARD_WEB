const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.json': 'application/json'
};

function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-target-url, x-api-key');
}

function serveStatic(req, res) {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
    });
}

function proxyRequest(targetUrl, method, headers, body) {
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (e) {
            return reject(new Error('URL invalida: ' + targetUrl));
        }

        const isHttps = parsed.protocol === 'https:';
        const transport = isHttps ? https : http;

        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: method,
            headers: headers,
            timeout: 120000
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const proxyReq = transport.request(options, (proxyRes) => {
            const chunks = [];
            proxyRes.on('data', c => chunks.push(c));
            proxyRes.on('end', () => {
                resolve({
                    status: proxyRes.statusCode,
                    headers: proxyRes.headers,
                    body: Buffer.concat(chunks)
                });
            });
        });

        proxyReq.on('timeout', () => {
            proxyReq.destroy();
            reject(new Error('Timeout de conexion'));
        });

        proxyReq.on('error', (e) => {
            reject(new Error('Error de conexion: ' + e.message));
        });

        if (body) {
            proxyReq.write(body);
        }
        proxyReq.end();
    });
}

function parseBody(req) {
    return new Promise((resolve) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

async function handleChatProxy(req, res) {
    try {
        const rawBody = await parseBody(req);
        const targetUrl = req.headers['x-target-url'];
        const apiKey = req.headers['x-api-key'];

        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Falta x-target-url' }));
            return;
        }

        var headers = { 'Content-Type': 'application/json' };

        if (apiKey) {
            headers['Authorization'] = 'Bearer ' + apiKey;
        }

        const result = await proxyRequest(targetUrl, 'POST', headers, rawBody.toString());

        res.setHeader('Content-Type', 'application/json');
        res.writeHead(result.status);
        res.end(result.body);
    } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

async function handleImageProxy(req, res) {
    try {
        const rawBody = await parseBody(req);
        const payload = JSON.parse(rawBody.toString());
        const { url: targetUrl, method, headers, body, bodyType } = payload;

        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Falta url en el body' }));
            return;
        }

        const reqMethod = method || 'POST';
        const reqHeaders = headers || {};
        var reqBody = null;

        if (bodyType === 'form' && body) {
            var boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
            var parts = [];
            var keys = Object.keys(body);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                parts.push('--' + boundary);
                parts.push('Content-Disposition: form-data; name="' + k + '"');
                parts.push('');
                parts.push(body[k]);
            }
            parts.push('--' + boundary + '--');
            reqBody = parts.join('\r\n');
            reqHeaders['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
        } else if (body) {
            reqBody = JSON.stringify(body);
            if (!reqHeaders['Content-Type']) {
                reqHeaders['Content-Type'] = 'application/json';
            }
        }

        const result = await proxyRequest(targetUrl, reqMethod, reqHeaders, reqBody);
        const contentType = (result.headers['content-type'] || '').toLowerCase();

        if (contentType.includes('application/json')) {
            try {
                const json = JSON.parse(result.body.toString());
                if (json.data && json.data[0] && json.data[0].url) {
                    const imgUrl = json.data[0].url;
                    console.log('  DALL-E URL → descargando imagen...');
                    const imgResult = await proxyRequest(imgUrl, 'GET', {}, null);
                    res.setHeader('Content-Type', imgResult.headers['content-type'] || 'image/png');
                    res.writeHead(200);
                    res.end(imgResult.body);
                    return;
                }
                if (json.data && json.data[0] && json.data[0].b64_json) {
                    const buf = Buffer.from(json.data[0].b64_json, 'base64');
                    res.setHeader('Content-Type', 'image/png');
                    res.writeHead(200);
                    res.end(buf);
                    return;
                }
                if (json.predictions && json.predictions[0] && json.predictions[0].bytesBase64Encoded) {
                    const buf = Buffer.from(json.predictions[0].bytesBase64Encoded, 'base64');
                    res.setHeader('Content-Type', 'image/png');
                    res.writeHead(200);
                    res.end(buf);
                    return;
                }
            } catch (_) {}
        }

        res.setHeader('Content-Type', result.headers['content-type'] || 'image/png');
        res.writeHead(result.status);
        res.end(result.body);
    } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error de proxy: ' + e.message }));
    }
}

const server = http.createServer((req, res) => {
    setCORS(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const reqUrl = new URL(req.url, 'http://localhost');
    const pathname = reqUrl.pathname;

    if (pathname === '/api/chat' && req.method === 'POST') {
        return handleChatProxy(req, res);
    }

    if (pathname === '/api/img' && req.method === 'POST') {
        return handleImageProxy(req, res);
    }

    return serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log('==========================================');
    console.log('  STORYBOARDPRO AI - Servidor unificado');
    console.log('  http://localhost:' + PORT);
    console.log('==========================================');
    console.log('  Estaticos:   /');
    console.log('  Texto:       POST /api/chat');
    console.log('  Imagenes:    POST /api/img');
    console.log('==========================================');
});
