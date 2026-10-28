import { renderHomepage } from './pages/homepage.js';

renderHomepage(document.querySelector('#app'));
// Wait for document loading and layout before honoring a direct section link.
// Initial navigation should be immediate, not race a smooth-scroll animation.
function scrollToInitialSection() {
  const target = document.getElementById(window.location.hash.slice(1));
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
}
if (window.location.hash) {
  if (document.readyState === 'complete') scrollToInitialSection();
  else window.addEventListener('load', scrollToInitialSection, { once: true });
}
