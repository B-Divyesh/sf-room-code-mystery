import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const host = option('--host', '127.0.0.1');
const port = Number(option('--port', '4173'));
const root = join(process.cwd(), 'dist');
const appRoutes = new Set(['/', '/index.html', '/demo', '/setup', '/play', '/privacy', '/terms']);
const contentTypes = new Map([
  ['.avif', 'image/avif'], ['.css', 'text/css; charset=utf-8'], ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'], ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'], ['.svg', 'image/svg+xml'], ['.txt', 'text/plain; charset=utf-8'], ['.webmanifest', 'application/manifest+json'],
  ['.webp', 'image/webp'], ['.xml', 'application/xml; charset=utf-8'],
]);

async function fileExists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${host}`).pathname);
  const requested = normalize(join(root, pathname));
  const safeFile = requested.startsWith(`${root}/`) && await fileExists(requested) ? requested : null;
  const status = appRoutes.has(pathname) || safeFile ? 200 : 404;
  const file = appRoutes.has(pathname) ? join(root, 'index.html') : safeFile ?? join(root, '404.html');
  try {
    const body = await readFile(file);
    response.writeHead(status, { 'Content-Type': contentTypes.get(extname(file)) ?? 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('The preview build is unavailable. Run npm run build first.');
  }
}).listen(port, host, () => console.log(`Preview: http://${host}:${port}`));
