/** Static shell: controller owns data and lazy chart lifecycle. One widget per results scope. */
export function projectionCharts() {
  return `<section class="projection-charts" data-projection-charts data-chart-state="idle" aria-labelledby="projection-chart-heading">
    <div class="projection-chart-header">
      <h4 id="projection-chart-heading">30-year outlook</h4>
      <div class="projection-chart-metrics" role="group" aria-label="Chart metric">
        <button type="button" data-chart-metric="annualCashFlow" aria-pressed="true">Annual cash flow</button>
        <button type="button" data-chart-metric="equity" aria-pressed="false">Equity</button>
      </div>
    </div>
    <p id="projection-chart-description">Annual cash flow or end-of-year equity in dollars, years 1–30. Inspect any year below, or use the full equivalent projection table. Amounts are rounded for display.</p>
    <p data-chart-status role="status" aria-live="polite">Chart will load when you view results.</p>
    <button type="button" data-chart-retry hidden>Retry chart</button>
    <div class="projection-chart-plot"><canvas data-chart-canvas data-projection-canvas role="img" aria-label="Annual cash flow, years 1–30" aria-describedby="projection-chart-description projection-table-heading">Use the full equivalent projection table for all yearly values.</canvas></div>
    <div class="projection-chart-inspector">
      <label>Inspect year <select data-chart-year>${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">Year ${i + 1}</option>`).join('')}</select></label>
      <p data-chart-selection aria-live="polite"><span data-chart-selection-label>Annual cash flow · Year 1</span> <strong data-chart-value data-chart-selected-value>N/A</strong></p>
    </div>
    <p class="projection-chart-table-link"><a href="#projection-table-heading">View the full equivalent projection table</a></p>
  </section>`;
}
