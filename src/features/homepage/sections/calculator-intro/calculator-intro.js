import { calculator } from '../../../calculator/components/calculator.js';

export function calculatorIntro() {
  return `<section class="calculator-section" id="calculator" aria-labelledby="calculator-heading">
    <div class="calculator-section-heading"><div><p class="section-label">The calculator</p><h2 id="calculator-heading" tabindex="-1">Start with the property.<br>See the bigger picture.</h2></div><div class="calculator-introduction"><p>Bring purchase costs, financing, rental income, and operating expenses together. Change the example numbers and see how your estimates respond.</p></div></div>
    ${calculator()}
    <p class="estimate-note">Estimates are calculated from the numbers and assumptions entered in this form. The calculator adapts Intrigue's rental-property analysis spreadsheet, with the calculation updates specified for this tool. Adjust the example duplex values to reflect your property; actual results may vary.</p>
  </section>`;
}
