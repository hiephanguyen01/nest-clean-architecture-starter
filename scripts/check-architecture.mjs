import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');
const files = walk(srcRoot).filter(
  (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.includes(`${join('src', 'generated')}`),
);
const fileSet = new Set(files.map((file) => normalize(file)));
const graph = new Map();
const violations = [];

for (const file of files) {
  const imports = extractImports(readFileSync(file, 'utf8'));
  const relativeDependencies = [];

  for (const specifier of imports) {
    const isRelative = specifier.startsWith('.');
    const normalizedFile = file.replaceAll('\\', '/');

    if (normalizedFile.includes('/domain/')) {
      if (!isRelative) {
        violations.push(`${display(file)}: Domain imports external package "${specifier}"`);
      }
    }

    if (normalizedFile.includes('/application/')) {
      if (!isRelative) {
        violations.push(`${display(file)}: Application imports external package "${specifier}"`);
      }
    }

    if (!isRelative) continue;
    const target = resolveImport(file, specifier);
    if (!target) continue;
    relativeDependencies.push(target);
    const normalizedTarget = target.replaceAll('\\', '/');

    if (normalizedFile.includes('/domain/') && /\/(application|infrastructure|presentation)\//.test(normalizedTarget)) {
      violations.push(`${display(file)}: Domain depends on outer layer ${display(target)}`);
    }
    if (normalizedFile.includes('/application/') && /\/(infrastructure|presentation)\//.test(normalizedTarget)) {
      violations.push(`${display(file)}: Application depends on outer layer ${display(target)}`);
    }
    if (normalizedFile.includes('/presentation/') && normalizedTarget.includes('/infrastructure/')) {
      violations.push(`${display(file)}: Presentation imports infrastructure ${display(target)}`);
    }
    if (normalizedFile.includes('/modules/users/') && normalizedTarget.includes('/modules/auth/')) {
      violations.push(`${display(file)}: Users must not depend on Auth (${display(target)})`);
    }
  }

  graph.set(normalize(file), relativeDependencies.map(normalize));
}

for (const cycle of findCycles(graph)) {
  violations.push(`Circular dependency: ${cycle.map(display).join(' -> ')}`);
}

if (violations.length > 0) {
  console.error('Architecture check failed:\n');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Architecture check passed (${files.length} production TypeScript files).`);

function walk(directory) {
  const entries = readdirSync(directory);
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) result.push(...walk(path));
    else result.push(path);
  }
  return result;
}

function extractImports(source) {
  const imports = [];
  const pattern = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) imports.push(match[1]);
  return imports;
}

function resolveImport(fromFile, specifier) {
  const candidate = normalize(resolve(dirname(fromFile), specifier));
  const options = [candidate];
  if (extname(candidate) === '.js') options.push(candidate.slice(0, -3) + '.ts');
  if (!extname(candidate)) options.push(`${candidate}.ts`, join(candidate, 'index.ts'));
  for (const option of options) {
    if (fileSet.has(normalize(option))) return normalize(option);
  }
  if (candidate.replaceAll('\\', '/').includes('/src/generated/prisma/')) return null;
  violations.push(`${display(fromFile)}: unresolved relative import "${specifier}"`);
  return null;
}

function findCycles(dependencies) {
  const state = new Map();
  const stack = [];
  const cycles = [];
  const seen = new Set();

  function visit(node) {
    const status = state.get(node) ?? 0;
    if (status === 2) return;
    if (status === 1) {
      const start = stack.indexOf(node);
      const cycle = [...stack.slice(start), node];
      const key = [...new Set(cycle)].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push(cycle);
      }
      return;
    }
    state.set(node, 1);
    stack.push(node);
    for (const dependency of dependencies.get(node) ?? []) {
      if (dependencies.has(dependency)) visit(dependency);
    }
    stack.pop();
    state.set(node, 2);
  }

  for (const node of dependencies.keys()) visit(node);
  return cycles;
}

function display(path) {
  return relative(root, path).replaceAll('\\', '/');
}
