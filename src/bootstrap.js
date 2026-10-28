// Keep the loading screen usable while the native application module graph loads.
// Dynamic import catches both dependency failures and startup-time exceptions.
const root = document.getElementById('app');
const startupScreen = root.querySelector('[data-startup-screen]');

try {
  await import('./main.js');
  root.dataset.startupState = 'ready';
  root.setAttribute('aria-busy', 'false');
} catch (error) {
  // Rendering may have replaced the loading screen before initialization failed.
  root.replaceChildren(startupScreen);
  root.dataset.startupState = 'error';
  root.setAttribute('aria-busy', 'false');
  console.error('Calculator startup failed.', error);
}
