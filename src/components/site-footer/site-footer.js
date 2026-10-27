import { icon } from '../ui/icon.js';

export function siteFooter() {
  return `<footer class="site-footer">
    <div class="footer-main">
      <div><a class="footer-name" href="#top">Intrigue</a><p>Real Estate &amp; Property Management</p></div>
      <div class="footer-location">${icon('pin')}<span>Local perspective.<br>Indianapolis-area rental investing.</span></div>
      <a class="text-link" href="https://www.intriguepm.com/" target="_blank" rel="noopener noreferrer">Visit Intrigue <span class="sr-only">(opens in a new tab)</span>${icon('arrow')}</a>
    </div>
    <div class="footer-bottom"><p>Rental Property Investment Calculator</p><p>Estimates, not guarantees. Your assumptions shape the outlook.</p><a href="#top">Back to top</a></div>
  </footer>`;
}
