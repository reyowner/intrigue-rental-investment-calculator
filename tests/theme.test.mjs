import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const themeModule = () => import('../src/features/theme/theme.js');

test('blocking theme bootstrap resolves before styles and never forces a white ready body', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const script=html.match(/<script id="theme-bootstrap">([\s\S]*?)<\/script>/);
  assert.ok(script, 'early blocking theme bootstrap exists');
  assert.ok(html.indexOf(script[0]) < html.indexOf('rel="stylesheet"'));
  for (const [saved,dark,expected] of [['dark',false,'dark'],['light',true,'light'],[null,true,'dark'],['invalid',false,'light']]) {
    const document={documentElement:{dataset:{}}};
    vm.runInNewContext(script[1],{document,matchMedia:()=>({matches:dark}),localStorage:{getItem:()=>saved}});
    assert.equal(document.documentElement.dataset.theme,expected);
  }
  const document={documentElement:{dataset:{}}};
  vm.runInNewContext(script[1],{document,matchMedia:()=>({matches:true}),get localStorage(){throw Error('blocked');}});
  assert.equal(document.documentElement.dataset.theme,'dark');
  assert.doesNotMatch(html, /body:has[^}]+background:\s*#fff/);
  assert.match(html,/assets\/images\/intrigue-map-pin-favicon.png/);
});

test('theme selection accepts only explicit light/dark and otherwise follows the OS', async () => {
  const { resolveTheme } = await themeModule();
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  for (const value of [null, undefined, '', 'auto', 'DARK']) {
    assert.equal(resolveTheme(value, true), 'dark');
    assert.equal(resolveTheme(value, false), 'light');
  }
});

function fixture(saved = null, dark = false, blocked = false) {
  const writes = [], events = [], listeners = {};
  const button = { innerHTML: '', attributes: {}, setAttribute(k,v) { this.attributes[k]=v; }, addEventListener(k,fn) { listeners[k]=fn; } };
  const media = { matches: dark, addEventListener(k, fn) { this.change=fn; } };
  const document = { documentElement: { dataset: {} }, querySelector: () => button };
  const window = { matchMedia: () => media, get localStorage() { if (blocked) throw Error('blocked'); return { getItem: () => saved, setItem: (k,v) => writes.push([k,v]) }; }, CustomEvent: class { constructor(type, options) { this.type=type; this.detail=options.detail; } }, dispatchEvent: event => events.push(event) };
  return { window, document, media, button, writes, events, click: () => listeners.click() };
}

test('toggle shows current mode, labels the action, emits changes and persists only an explicit choice', async () => {
  const { initializeTheme } = await themeModule();
  const f = fixture(null, true);
  const api = initializeTheme(f.document, f.window);
  assert.equal(f.document.documentElement.dataset.theme, 'dark');
  assert.equal(f.button.attributes['aria-label'], 'Switch to light mode');
  assert.match(f.button.innerHTML, /data-theme-icon="moon"/);
  assert.equal(f.writes.length, 0);
  f.media.matches=false; f.media.change();
  assert.equal(f.document.documentElement.dataset.theme, 'light');
  assert.match(f.button.innerHTML, /data-theme-icon="sun"/);
  f.click();
  assert.deepEqual(f.writes, [['intrigue-theme','dark']]);
  assert.deepEqual(f.events.at(-1).detail, { theme: 'dark' });
  assert.equal(f.events.at(-1).type, 'intrigue:theme-change');
  f.media.change();
  assert.equal(f.document.documentElement.dataset.theme, 'dark');
  assert.equal(initializeTheme(f.document, f.window), api, 'mount once');
});

test('storage denial never blocks initial theme or the in-memory explicit choice', async () => {
  const { initializeTheme } = await themeModule();
  const f=fixture(null, false, true);
  initializeTheme(f.document,f.window);
  assert.doesNotThrow(f.click);
  f.media.change();
  assert.equal(f.document.documentElement.dataset.theme,'dark');
});

test('header exposes a theme action and the shared tool icons remain decorative', async () => {
  const { siteHeader } = await import('../src/components/site-header/site-header.js');
  const { icon } = await import('../src/components/ui/icon.js');
  assert.match(siteHeader(), /<button[^>]*data-theme-toggle[^>]*type="button"/);
  for (const name of ['sun','moon','download','link']) {
    assert.match(icon(name), /aria-hidden="true" focusable="false"/);
  }
});



test('startup retry rebinds the theme action after the header is replaced', async () => {
  const { initializeTheme } = await themeModule();
  const f=fixture('dark',false);const api=initializeTheme(f.document,f.window);
  let click;
  const replacement={innerHTML:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(type,fn){click=fn;}};
  f.document.querySelector=()=>replacement;
  assert.equal(initializeTheme(f.document,f.window),api);
  assert.match(replacement.innerHTML,/data-theme-icon="moon"/);
  click();
  assert.equal(api.theme,'light');
  assert.match(replacement.innerHTML,/data-theme-icon="sun"/);
});
