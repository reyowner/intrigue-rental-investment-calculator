import { icon } from '../../../../components/ui/icon.js';
import { howItWorksSteps } from '../../constants/content.js';

export function howItWorks() {
  return `<section class="how-it-works" id="how-it-works" aria-labelledby="how-heading">
    <div class="how-heading"><div><p class="section-label">How it works</p><h2 id="how-heading" tabindex="-1">A little clarity.<br>Before a big decision.</h2></div><p>Bring the deal you are considering. Work through the costs, question the assumptions, and see the bigger picture.</p></div>
    <ol class="how-steps">${howItWorksSteps.map(step => `<li class="how-step"><div class="step-top">${icon(step.icon)}<span aria-hidden="true">${step.number}</span></div><h3>${step.title}</h3><p>${step.description}</p></li>`).join('')}</ol>
    <p class="how-note">Start with the example duplex numbers or enter your own. The example is a starting point, not a set of market assumptions.</p>
  </section>`;
}
