import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('initial document presents an intentional loading state, not HTTP troubleshooting as normal content', () => {
  assert.ok(html.includes('data-startup-state="loading"'));
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes('Loading the calculator'));
  assert.ok(html.includes('.startup-screen'));
  assert.ok(!html.includes('If it does not appear, serve this folder over HTTP'));
  assert.ok(!html.includes('The calculator is not implemented yet'));
});


test('branded loader uses the original mark, restrained motion, and a fast-load display grace period', () => {
  const artwork = readFileSync(new URL('../assets/images/intrigue-brand-mark.svg', import.meta.url), 'utf8');
  const path = artwork.match(/ d="([^"]+)"/)[1];
  assert.ok(html.includes(path), 'Preserve the original lime mark geometry');
  assert.ok(html.includes('startup-indicator'));
  assert.ok(html.includes('@keyframes startup-orbit'));
  assert.ok(html.includes('--startup-reveal-delay: 180ms'));
  assert.ok(html.includes('prefers-reduced-motion: reduce'));
  const bootstrap = readFileSync(new URL('../src/bootstrap.js', import.meta.url), 'utf8');
  assert.ok(!bootstrap.includes('setTimeout'), 'Do not hold a ready page to play the loader');
});
