// Check the actual document after cold load or deliberate module-load failure.
export function checkStartupState(expected) {
  const root = document.getElementById('app');
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  check(root.dataset.startupState === expected, `Expected startup state ${expected}, received ${root.dataset.startupState}`);
  if (expected === 'ready') {
    check(Boolean(root.querySelector('[data-calculator-form]')), 'Calculator must be mounted');
    check(root.getAttribute('aria-busy') === 'false', 'Ready application must not remain busy');
    check(!root.querySelector('[data-startup-screen]'), 'Loading screen must be removed');
    check(getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)', 'Ready page must regain its normal background');
  } else if (expected === 'error') {
    const screen = root.querySelector('[data-startup-screen]');
    check(Boolean(screen), 'Startup error screen must be visible');
    check(screen.querySelector('[data-startup-failure]').getAttribute('role') === 'alert', 'Startup failure must be announced');
    check(getComputedStyle(screen.querySelector('[data-startup-retry]')).display !== 'none', 'Retry must be available');
    check(getComputedStyle(screen.querySelector('[data-startup-failure]')).display !== 'none', 'Failure explanation must be visible');
    check(root.getAttribute('aria-busy') === 'false', 'Failed application must not stay busy');
    check(getComputedStyle(screen.querySelector('.startup-content')).visibility === 'visible', 'Errors must bypass the reveal delay');
    check(getComputedStyle(screen.querySelector('.startup-orbit')).animationName === 'none', 'A failed startup must stop the loading animation');
    check(!screen.textContent.includes('serve this folder over HTTP'), 'HTTP must not be misdiagnosed as file access');
  }
  return { state: expected, passed: true };
}


export function checkStartupAppearance(reducedMotion = false) {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const root = document.getElementById('app');
  check(root.dataset.startupState === 'loading', 'Inspect appearance during a real pending startup');
  const screen = root.querySelector('[data-startup-screen]');
  const content = getComputedStyle(screen.querySelector('.startup-content'));
  const orbit = getComputedStyle(screen.querySelector('.startup-orbit'));
  check(getComputedStyle(screen).backgroundColor === 'rgb(18, 58, 72)', 'Use the Intrigue dark teal');
  check(screen.querySelector('.startup-indicator').getAttribute('aria-hidden') === 'true', 'Decorative animation must not add screen-reader noise');
  check(getComputedStyle(screen).getPropertyValue('--startup-reveal-delay').trim() === '180ms', 'Preserve the fast-load grace period');
  check(document.documentElement.scrollWidth <= document.documentElement.clientWidth, 'Loader must not overflow the phone viewport');
  if (reducedMotion) {
    check(orbit.animationName === 'none', 'Reduced motion must stop the orbit');
    check(content.animationDuration === '0s', 'Reduced motion must not fade or move the content');
  } else check(orbit.animationName === 'startup-orbit', 'Animate the decorative orbit during a slower load');
  return { passed: true, reducedMotion };
}
