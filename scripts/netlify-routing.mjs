import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function netlifyRouting(backendOrigin) {
  if (!backendOrigin) throw new Error('Set BACKEND_URL to your deployed backend HTTPS origin in Netlify before building.');
  const backend = new URL(backendOrigin);
  if (backend.protocol !== 'https:' || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) {
    throw new Error('BACKEND_URL must be an HTTPS origin, such as https://api.example.com, without credentials, paths, or query strings.');
  }
  // Keep API requests ahead of the SPA fallback, including private admin routes.
  return `/api/* ${backend.origin}/api/:splat 200!\n/* /index.html 200\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeFile(new URL('../dist/_redirects', import.meta.url), netlifyRouting(process.env.BACKEND_URL));
  console.log('Netlify API proxy and frontend routing generated.');
}
