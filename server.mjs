import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  confirmAuthToken,
  getAuthSnapshot,
  requestAuthToken,
  resetAuthStore,
  verifyAuthToken
} from './backend/auth-store.mjs';

const rootDir = process.cwd();
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, content, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  response.end(content);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

function resolveStaticPath(requestPath) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const normalizedPath = safePath.replace(/\\/g, '/');
  const fullPath = resolve(join(rootDir, `.${normalizedPath}`));
  if (!fullPath.startsWith(rootDir)) {
    throw new Error('INVALID_PATH');
  }
  return fullPath;
}

async function serveStatic(response, requestPath) {
  try {
    const filePath = resolveStaticPath(requestPath);
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      return serveStatic(response, `${requestPath.replace(/\/$/, '')}/index.html`);
    }

    const body = await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch (error) {
    if (error.code === 'ENOENT' || error.message === 'INVALID_PATH') {
      sendText(response, 404, 'Not found');
      return;
    }
    sendText(response, 500, 'Static file error');
  }
}

async function handleApi(request, response, url) {
  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(response, 200, {
        ok: true,
        service: 'eServices backend',
        now: new Date().toISOString()
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/state') {
      return sendJson(response, 200, getAuthSnapshot());
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/request-token') {
      const body = await readBody(request);
      const result = requestAuthToken(body);
      return sendJson(response, 200, result);
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/confirm-token') {
      const body = await readBody(request);
      const result = confirmAuthToken(body);
      return sendJson(response, 200, result);
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/verify-token') {
      const body = await readBody(request);
      const result = verifyAuthToken(body);
      return sendJson(response, 200, result);
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/reset') {
      resetAuthStore();
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === 'GET' && url.pathname === '/api/users') {
      return sendJson(response, 200, getAuthSnapshot().users);
    }

    return sendJson(response, 404, { ok: false, error: 'NOT_FOUND' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return sendJson(response, statusCode, {
      ok: false,
      error: error.message || 'INTERNAL_ERROR'
    });
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname.startsWith('/api/')) {
    return handleApi(request, response, requestUrl);
  }

  return serveStatic(response, requestUrl.pathname);
});

server.listen(port, () => {
  console.log(`eServices backend running at http://localhost:${port}`);
});
