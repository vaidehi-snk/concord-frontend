// After the client build: keep an empty shell for the app routes (app.html,
// 404.html) and write the pre-rendered home page into index.html.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const shell = readFileSync(join(dist, 'index.html'), 'utf8');
if (!shell.includes('<!--app-html-->')) throw new Error('index.html is missing the <!--app-html--> marker');

writeFileSync(join(dist, 'app.html'), shell);
writeFileSync(join(dist, '404.html'), shell);

const { render } = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href);
const html = render('/');
writeFileSync(join(dist, 'index.html'), shell.replace('<!--app-html-->', html));
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
console.log(`prerendered / (${Math.round(html.length / 1024)} KB of HTML)`);
