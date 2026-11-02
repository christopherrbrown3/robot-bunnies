// Minimal dependency-free loader for the pure TypeScript spelling modules.
// Transpiles a module and its relative imports into data: URLs so Node can
// import them without a bundler. Only for tests; not shipped.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const cache = new Map();

function compile(path) {
  if (cache.has(path)) return cache.get(path);
  let js = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  js = js.replace(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g, (_, spec) => {
    const target = resolve(dirname(path), spec.endsWith('.ts') ? spec : `${spec}.ts`);
    return `from '${compile(target)}'`;
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
  cache.set(path, url);
  return url;
}

/** Import a TypeScript module relative to the repository root, e.g. 'src/spelling/store.ts'. */
export async function loadTs(relativePath) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  return import(compile(resolve(root, relativePath)));
}
