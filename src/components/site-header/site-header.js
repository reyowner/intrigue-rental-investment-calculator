import { initializeTheme } from '../../features/theme/theme.js';
import { icon } from '../ui/icon.js';
import { navigationLinks, contactLink } from './navigation.js';

function brand() {
  return `<a class="brand" href="#top" aria-label="Intrigue, back to top">
    <img class="header-logo" src="assets/images/intrigue-lettering.png" width="377" height="132" alt="Intrigue Real Estate &amp; Property Management">
    <img class="header-mark" src="assets/images/intrigue-brand-mark.svg" width="51" height="43" alt="" aria-hidden="true">
  </a>`;
}

export function siteHeader() {
  return `<header class="site-header">
    <nav class="header-bar" aria-label="Main navigation">
      ${brand()}
      <div class="site-navigation" id="site-navigation">
        ${navigationLinks.map(link => `<a href="${link.href}">${link.label}</a>`).join('')}
      </div>
      <div class="header-actions">
        <button class="theme-toggle" data-theme-toggle type="button" aria-label="Switch color mode"></button>
        <a class="button button--small button--lime header-contact" href="${contactLink.href}">${contactLink.label} ${icon('arrow')}</a>
        <button class="menu-toggle" type="button" aria-controls="mobile-navigation" aria-expanded="false" aria-label="Open navigation">${icon('menu')}</button>
      </div>
    </nav>
    <dialog class="mobile-navigation" id="mobile-navigation" aria-modal="true" aria-labelledby="mobile-navigation-heading">
      <div class="mobile-navigation-panel">
        <div class="mobile-navigation-top">
          ${brand()}
          <button class="menu-close" type="button" aria-label="Close navigation" autofocus>${icon('close')}</button>
        </div>
        <h2 id="mobile-navigation-heading">Explore the calculator.</h2>
        <nav class="mobile-navigation-links" aria-label="Mobile navigation">
          ${navigationLinks.map(link => `<a href="${link.href}">${link.label} ${icon('arrow')}</a>`).join('')}
          <a class="button button--lime mobile-contact" href="${contactLink.href}">${contactLink.label} ${icon('arrow')}</a>
        </nav>
        <p class="mobile-navigation-note">A local perspective on your next Indianapolis rental.</p>
      </div>
    </dialog>
  </header>`;
}

export function initializeHeader() {
  initializeTheme();
  const button = document.querySelector('.menu-toggle');
  const closeButton = document.querySelector('.menu-close');
  const dialog = document.querySelector('#mobile-navigation');
  const nav = document.querySelector('#site-navigation');
  const desktop = window.matchMedia('(min-width: 56rem)');

  function synchronizeClosedState() {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    document.documentElement.classList.remove('navigation-open');
    document.documentElement.style.removeProperty('--navigation-scrollbar');
  }

  function closeMenu(restoreFocus = true) {
    if (!dialog.open) return;
    dialog.close();
    synchronizeClosedState();
    if (restoreFocus) button.focus({ preventScroll: true });
  }

  button.addEventListener('click', () => {
    if (desktop.matches || dialog.open) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--navigation-scrollbar', `${scrollbarWidth}px`);
    dialog.showModal();
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close navigation');
    document.documentElement.classList.add('navigation-open');
    closeButton.focus({ preventScroll: true });
  });
  closeButton.addEventListener('click', () => closeMenu());
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeMenu();
  });
  dialog.addEventListener('close', () => {
    // A queued close event must not reset a menu that was immediately reopened.
    if (!dialog.open) synchronizeClosedState();
  });
  dialog.addEventListener('click', event => {
    // Page composition handles the anchor's destination and heading focus.
    if (event.target.closest('a')) closeMenu(false);
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button')]
      .filter(element => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  desktop.addEventListener('change', () => {
    const focusWasInDialog = dialog.contains(document.activeElement);
    const toggleWouldHide = desktop.matches && document.activeElement === button;
    const desktopLinkWouldHide = !desktop.matches && (
      nav.contains(document.activeElement) || document.activeElement.matches('.header-contact')
    );
    closeMenu(false);
    if (desktop.matches && (focusWasInDialog || toggleWouldHide)) nav.querySelector('a').focus({ preventScroll: true });
    if (desktopLinkWouldHide) button.focus({ preventScroll: true });
  });
}
