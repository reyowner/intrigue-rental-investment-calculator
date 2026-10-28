/** Secondary actions, not additional financial inputs or a submit gate. */
export function calculatorTools() {
  return `<section class="calculator-tools" data-calculator-tools aria-labelledby="calculator-tools-heading">
    <div><h4 id="calculator-tools-heading">Keep this deal handy.</h4><p>The PDF includes your inputs, both graphs, and the full projection across all 30 years. It downloads directly as a dated PDF file, without opening a print dialog.</p></div>
    <div class="calculator-tools-actions"><button type="button" data-save-report>Save full report as PDF</button><button type="button" data-share-deal>Copy share link</button></div>
    <p class="calculator-tools-privacy">Share intentionally: anyone with the link can view these deal numbers. Your contact details are not included.</p>
    <p class="calculator-tools-status" data-tools-status role="status" aria-live="polite" hidden></p>
    <div data-share-fallback hidden><label for="calculator-share-url">Shareable deal link</label><textarea id="calculator-share-url" rows="3" readonly data-share-url aria-describedby="calculator-share-help"></textarea><p id="calculator-share-help">Copy this link manually if your browser cannot copy it automatically. Editing your inputs clears this displayed link; create another one for the updated deal.</p></div>
  </section>`;
}
