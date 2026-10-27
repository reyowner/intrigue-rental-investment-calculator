import { icon } from '../../../components/ui/icon.js';
import { exampleDeal, additionalAssumptions } from '../constants/example-deal.js';

export function calculatorPreview() {
  return `<div class="calculator-preview">
    <div class="preview-deal">
      <div class="preview-deal-title"><h3>The example duplex</h3><span>Starting assumptions</span></div>
      <p class="preview-explanation">A look at the numbers you will be able to change. This preview is not interactive yet.</p>
      <dl class="deal-values">${exampleDeal.map(field => `<div><dt>${field.label}</dt><dd>${field.value}</dd></div>`).join('')}</dl>
      <details class="assumptions-preview"><summary>See more example assumptions ${icon('chevron')}</summary><dl>${additionalAssumptions.map(field => `<div><dt>${field.label}</dt><dd>${field.value}</dd></div>`).join('')}</dl><p>The full calculator will also include utilities, miscellaneous costs, closing costs, and annual growth assumptions.</p></details>
      <p class="preview-notice">${icon('info')}<span>Calculations and projections will be added in the next development phase. No results are calculated in this preview.</span></p>
    </div>
    <aside class="preview-outlook" aria-labelledby="outlook-heading"><p class="outlook-label">What the calculator will show</p><h3 id="outlook-heading">The year-one picture.<br>And the longer view.</h3>
      <ul class="outlook-list">
        <li>${icon('wallet')}<div><h4>Your starting investment</h4><p>Total cash required to buy and prepare the property.</p></div></li>
        <li>${icon('home')}<div><h4>How the rent stacks up</h4><p>Estimated monthly cash flow, cap rate, and cash-on-cash return.</p></div></li>
        <li>${icon('chart')}<div><h4>A view beyond year one</h4><p>Year 5 equity and a detailed 30-year projection of income, costs, and returns.</p></div></li>
      </ul>
      <p class="outlook-note">A projection helps you ask better questions. It cannot guarantee how a property will perform.</p>
    </aside>
  </div>`;
}
