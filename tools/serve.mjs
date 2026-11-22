#!/usr/bin/env node
/**
 * Zero-dependency static file server for local development.
 *
 *   node tools/serve.mjs            # http://localhost:8080
 *   node tools/serve.mjs 3000       # custom port
 *
 * (ES modules do not load from file:// URLs, so you need *a* server — this
 * one, `npx wrangler pages dev .`, `python3 -m http.server`, anything.)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/** Create (but do not start) the static server. Used by tools/smoke.mjs too. */
export function createStaticServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      let file = join(root, rel);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
      let info = await stat(file).catch(() => null);
      if (info && info.isDirectory()) { file = join(file, 'index.html'); info = await stat(file).catch(() => null); }
      if (!info) {
        const notFound = await readFile(join(root, '404.html')).catch(() => null);
        res.writeHead(404, { 'content-type': TYPES['.html'] }).end(notFound || 'Not found');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        // files without an extension (LICENSE) are plain text
        'content-type': TYPES[extname(file).toLowerCase()] || (extname(file) ? 'application/octet-stream' : 'text/plain; charset=utf-8'),
        'cache-control': 'no-store',
      }).end(body);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });
}

// Run directly: node tools/serve.mjs [port]
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.argv[2] || process.env.PORT || 8080);
  createStaticServer().listen(port, () => {
    console.log(`\n  Serving ${root}\n  → http://localhost:${port}\n`);
  });
}
