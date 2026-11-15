// Rebuilds edit/shell.html and index.html from the files in src/ and content.json.
// Run from the repository root:  node tools/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const require = createRequire(import.meta.url);
const SiteRender = require(path.join(root, 'edit/render.js'));

const css = read('src/fonts.css') + '\n' + read('src/site.css');
const shell = read('src/page.html').replace('/*CSS*/', () => css).replace('/*JS*/', () => read('src/site.js'));
writeFileSync(path.join(root, 'edit/shell.html'), shell);

const content = JSON.parse(read('content.json'));
const problems = SiteRender.check(content);
if (problems.length) { console.error('Problems in content.json:\n- ' + problems.join('\n- ')); process.exit(1); }
const page = SiteRender.buildPage(content, shell);

const ids = [...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) { console.error('Duplicate ids: ' + dup.join(', ')); process.exit(1); }
const missing = SiteRender.assetRefs(content).filter((f) => !existsSync(path.join(root, f)));
if (missing.length) { console.error('Files named in content.json but missing from the repository:\n- ' + missing.join('\n- ')); process.exit(1); }

writeFileSync(path.join(root, 'index.html'), page);
console.log(`index.html ${Math.round(page.length / 1024)} KB, ${content.projects.length} projects, ${SiteRender.assetRefs(content).length} asset files`);
