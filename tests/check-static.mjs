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

test('calculator renders actual engine-backed inputs/results while contact remains local-only', async () => {
  const { calculator } = await import('../src/features/calculator/components/calculator.js');
  const markup = calculator();
  const contact = readFileSync(resolve(root, 'src/features/homepage/sections/contact/contact.js'), 'utf8');
  assert.equal((markup.match(/<input /g) || []).length, 40);
  assert.match(markup, /7\.11%/);
  assert.match(markup, /5\.45%/);
  assert.match(markup, /data-projection-table/);
  assert.match(markup, /aria-controls="projection"/);
  assert.match(markup, /data-view-results/);
  assert.doesNotMatch(markup, /planned for the next development phase/);
  assert.doesNotMatch(markup, /preview is not interactive|No results are calculated/);
  assert.match(contact, /nothing has been sent to Intrigue/);
  assert.doesNotMatch(contact, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|console\.log/);
});

test('navigation retains only calculator-app section destinations', () => {
  const content = readFileSync(resolve(root, 'src/components/site-header/navigation.js'), 'utf8');
  const targets = [...content.matchAll(/href: '(#[^']+)'/g)].map(match => match[1]);
  assert.deepEqual(targets, ['#how-it-works', '#calculator', '#contact']);
  assert.doesNotMatch(content, /https?:/);
});

test('navigation combines white PNG lettering with the original lime SVG mark', () => {
  const header = readFileSync(resolve(root, 'src/components/site-header/site-header.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'src/components/site-header/site-header.css'), 'utf8');
  assert.match(header, /assets\/images\/intrigue-lettering\.png/);
  assert.match(header, /assets\/images\/intrigue-brand-mark\.svg/);
  assert.match(header, /<dialog/);
  assert.match(header, /dialog\.showModal\(\)/);
  assert.match(header, /aria-controls="mobile-navigation"/);
  assert.match(styles, /filter: brightness\(0\) invert\(1\)/);
  assert.match(styles, /\.site-header \.header-mark \{[^}]*filter: none/s);
  const mark = readFileSync(resolve(root, 'assets/images/intrigue-brand-mark.svg'), 'utf8');
  assert.match(mark, /fill="#9DC31B"/);
  assert.equal((mark.match(/<path /g) || []).length, 1);
  assert.match(styles, /position: sticky/);
  assert.match(header, /data-theme-toggle/);
});

test('floating navigation shares the hero backdrop without an opaque header strip', () => {
  const global = readFileSync(resolve(root, 'src/styles/global.css'), 'utf8');
  const header = readFileSync(resolve(root, 'src/components/site-header/site-header.css'), 'utf8');
  const hero = readFileSync(resolve(root, 'src/features/homepage/sections/hero/hero.css'), 'utf8');
  assert.match(global, /#app \{[^}]*display: grid/s);
  assert.match(global, /#app > \.site-header,[\s\S]*?#app > main \{[^}]*grid-row: 1/s);
  assert.match(header, /\.site-header \{[^}]*align-self: start[^}]*background: transparent/s);
  assert.match(hero, /\.hero \{[^}]*padding-top: var\(--navigation-offset\)/s);
});
