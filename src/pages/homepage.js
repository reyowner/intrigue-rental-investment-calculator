import { siteHeader, initializeHeader } from '../components/site-header/site-header.js';
import { siteFooter } from '../components/site-footer/site-footer.js';
import { hero } from '../features/homepage/sections/hero/hero.js';
import { howItWorks } from '../features/homepage/sections/how-it-works/how-it-works.js';
import { calculatorIntro } from '../features/homepage/sections/calculator-intro/calculator-intro.js';
import { initializeCalculator } from '../features/calculator/calculator-controller.js';
import { contact, initializeContact } from '../features/homepage/sections/contact/contact.js';

export function renderHomepage(root) {
  // All templates are developer-authored static content, never user-supplied HTML.
  root.innerHTML = `${siteHeader()}<main id="main" tabindex="-1">${hero()}${howItWorks()}${calculatorIntro()}${contact()}</main>${siteFooter()}`;
  initializeHeader();
  initializeContact();
  initializeCalculator(root);
  // Native anchors provide URL/history behavior. Transfer focus for keyboard users.
  root.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    const heading = target.querySelector('h2[tabindex]');
    // The native anchor action runs after this click handler. Focus afterward
    // so the browser cannot replace the heading focus with the section target.
    if (heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    else if (anchor.hash === '#top') requestAnimationFrame(() => document.querySelector('.brand').focus({ preventScroll: true }));
  });
}
