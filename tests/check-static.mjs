import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
function list(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? list(path) : [path];
  });
}
const source = list(resolve(root, 'src'));
const scripts = source.filter(path => extname(path) === '.js');
const styles = source.filter(path => extname(path) === '.css');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

test('all JavaScript modules pass Node syntax checking', () => {
  for (const path of scripts) execFileSync(process.execPath, ['--check', path]);
});

test('every relative module import resolves', () => {
  for (const path of scripts) {
    const content = readFileSync(path, 'utf8');
    for (const match of content.matchAll(/from ['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('.'), `Unexpected package import: ${match[1]}`);
      assert.ok(existsSync(resolve(dirname(path), match[1])), `${path}: ${match[1]}`);
    }
  }
});

test('every CSS import resolves', () => {
  for (const path of styles) {
    for (const match of readFileSync(path, 'utf8').matchAll(/@import ['"]([^'"]+)['"]/g)) {
      assert.ok(existsSync(resolve(dirname(path), match[1])), `${path}: ${match[1]}`);
    }
  }
});

test('document shell references existing local assets', () => {
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (match[1].startsWith('http')) continue;
    assert.ok(existsSync(resolve(root, match[1])), match[1]);
  }
  assert.match(html, /type="module"/);
  assert.match(html, /<noscript>/);
});

test('page templates reference existing local images', () => {
  for (const path of scripts) {
    for (const match of readFileSync(path, 'utf8').matchAll(/src="(assets\/images\/[^"$]+)"/g)) {
      assert.ok(existsSync(resolve(root, match[1])), match[1]);
    }
  }
});

test('assessment colors and button radius are preserved', () => {
  const tokens = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');
  for (const color of ['#123a48', '#1b5063', '#9dc31b', '#cce5ed']) assert.ok(tokens.includes(color));
  assert.match(tokens, /--button-radius: 8px/);
});

test('page templates avoid prohibited naming and em dashes', () => {
  const content = scripts.map(path => readFileSync(path, 'utf8')).join('\n');
  assert.ok(!content.includes(String.fromCharCode(8212)));
  for (const name of ['Intrigue PM', 'Intrigue Property Management', 'Rent Analysis']) assert.ok(!content.includes(name));
});

test('preview and form expose honest unimplemented states', () => {
  const preview = readFileSync(resolve(root, 'src/features/calculator/components/calculator-preview.js'), 'utf8');
  const contact = readFileSync(resolve(root, 'src/features/homepage/sections/contact/contact.js'), 'utf8');
  assert.match(preview, /No results are calculated in this preview/);
  assert.doesNotMatch(preview, /<input|<button/);
  assert.match(contact, /nothing has been sent to Intrigue/);
  assert.doesNotMatch(contact, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|console\.log/);
});
