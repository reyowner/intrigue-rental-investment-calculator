import { calculatorPreview } from '../../../calculator/components/calculator-preview.js';

export function calculatorIntro() {
  return `<section class="calculator-section" id="calculator" aria-labelledby="calculator-heading">
    <div class="calculator-section-heading"><div><p class="section-label">The calculator</p><h2 id="calculator-heading" tabindex="-1">Start with the property.<br>See the bigger picture.</h2></div><div class="calculator-introduction"><span class="preview-badge">Landing-page preview</span><p>The full tool will bring purchase costs, financing, rental income, and operating expenses into one place. Here is a preview of where you will start.</p></div></div>
    ${calculatorPreview()}
    <p class="estimate-note">These figures are example inputs, not calculated results or universal market assumptions. Future projections will be estimates based on the information entered. Actual costs, property performance, and sale proceeds can vary.</p>
  </section>`;
}
