import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Test-only loader: execute the actual local domain modules without a second implementation.
const cache = new Map();
export function loadLocalTs(path) {
  path = resolve(path);
  if (cache.has(path)) return cache.get(path).exports;
  const loadedModule = { exports: {} };
  cache.set(path, loadedModule);
  const require = (specifier) => {
    if (!specifier.startsWith(".")) return createRequire(path)(specifier);
    const base = resolve(dirname(path), specifier);
    if (base.endsWith(".json")) return JSON.parse(readFileSync(base, "utf8"));
    return loadLocalTs(existsSync(base) ? base : `${base}.ts`);
  };
  const result = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  runInNewContext(result.outputText, { module: loadedModule, exports: loadedModule.exports, require, Date, console, Intl, URL, Map, Set }, { filename: path });
  return loadedModule.exports;
}
