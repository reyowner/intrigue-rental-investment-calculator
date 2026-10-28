import { icon } from '../../../../components/ui/icon.js';

export function hero() {
  return `<section class="hero" aria-labelledby="hero-heading">
    <div class="hero-copy">
      <p class="hero-location">${icon('pin')} For Indianapolis-area rental investors</p>
      <p class="hero-product">Rental Property Investment Calculator</p>
      <h1 id="hero-heading">Know the numbers behind your next Indianapolis rental.</h1>
      <p class="hero-description">Estimate the cash needed to buy and prepare a rental property, then explore how rent, operating costs, and financing shape its projected performance over 30 years.</p>
      <div class="hero-actions"><a class="button button--lime" href="#calculator">Run the numbers ${icon('arrow')}</a><a class="hero-secondary" href="#how-it-works">How it works ${icon('chevron')}</a></div>
      <p class="hero-reassurance">Free to use. No sign-up. Your numbers stay in your browser.</p>
    </div>
    <div class="hero-visual">
      <img class="hero-photo" src="assets/images/indianapolis-bungalow.webp" width="1132" height="1416" alt="A craftsman bungalow with a covered front porch and rocking chairs" fetchpriority="high">
      <div class="hero-photo-caption">${icon('home')}<span>A property is more than its purchase price.<br><strong>Start with the whole picture.</strong></span></div>
    </div>
  </section>
  <div class="principles-strip" aria-label="About this tool">
    <p>Your deal. Your assumptions.</p>
    <ul><li>${icon('check')} Free to explore</li><li>${icon('check')} No email gate</li><li>${icon('check')} A local perspective</li></ul>
  </div>`;
}
