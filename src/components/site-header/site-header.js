import { icon } from '../ui/icon.js';

export function siteHeader() {
  return `<header class="site-header">
    <a class="brand" href="#top" aria-label="Intrigue, back to top">
      <img src="assets/images/intrigue-wordmark-teal.png" width="2000" height="680" alt="Intrigue">
      <span>Real Estate &amp; Property Management</span>
    </a>
    <button class="menu-toggle" type="button" aria-controls="site-navigation" aria-expanded="false" aria-label="Open navigation">${icon('menu')}</button>
    <nav class="site-navigation" id="site-navigation" aria-label="Main navigation">
      <a href="#how-it-works">How it works</a>
      <a href="#calculator">The calculator</a>
      <a class="button button--small button--dark" href="#contact">Let's talk ${icon('arrow')}</a>
    </nav>
  </header>`;
}

export function initializeHeader() {
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-navigation');
  const desktop = window.matchMedia('(min-width: 56rem)');
  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    button.innerHTML = icon(open ? 'close' : 'menu');
    nav.classList.toggle('is-open', open);
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setOpen(false);
  });
  desktop.addEventListener('change', () => {
    const focusWouldHide = !desktop.matches && nav.contains(document.activeElement);
    const toggleWouldHide = desktop.matches && document.activeElement === button;
    setOpen(false);
    if (focusWouldHide) button.focus();
    if (toggleWouldHide) nav.querySelector('a').focus();
  });
}
