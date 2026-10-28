import { loadChartLibrary } from './services/chart-library.js';
import { buildProjectionChartConfig, CHART_METRICS, chartDollars, isProjectionChartModel } from './utils/projection-chart-view.js';

const mounted = new WeakMap();

/** Call reveal only after the results ancestors are visible. Dependencies are injectable for isolated tests. */
export function initializeProjectionChart(scope, { loadLibrary = loadChartLibrary } = {}) {
  const root = scope.matches?.('[data-projection-charts]') ? scope : scope.querySelector('[data-projection-charts]');
  if (!root) return { update() {}, reveal() {} };
  if (mounted.has(root)) return mounted.get(root);
  const find = hook => root.querySelector(`[data-chart-${hook}]`);
  const canvas = find('canvas');
  const year = find('year');
  const status = find('status');
  const retry = find('retry');
  const buttons = [...root.querySelectorAll('[data-chart-metric]')];
  let model, metric = 'annualCashFlow', chart, Chart, revealed = false, loading;

  function clear() {
    const previous = chart || Chart?.getChart?.(canvas);
    if (previous) { previous.destroy(); previous.data.datasets = []; }
    chart = undefined;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    find('value').textContent = 'N/A';
    root.setAttribute('data-chart-state', 'invalid');
    status.textContent = 'Enter valid assumptions to see the chart.';
    status.hidden = false;
    retry.hidden = true;
    root.setAttribute('aria-busy', 'false');
  }

  function render() {
    if (!isProjectionChartModel(model)) { clear(); return; }
    const retryHadFocus = retry.ownerDocument?.activeElement === retry;
    const selectedYear = Number(year.value);
    const config = buildProjectionChartConfig(model, metric, selectedYear);
    find('selection-label').textContent = `${CHART_METRICS[metric]} · Year ${selectedYear}`;
    find('value').textContent = chartDollars(model.years[selectedYear - 1][metric]);
    canvas.setAttribute('aria-label', `${CHART_METRICS[metric]}, years 1–30`);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chartMetric === metric)));
    if (chart) {
      chart.data = config.data;
      chart.options = config.options;
      chart.update('none');
    } else {
      chart = new Chart(canvas, config);
      const created = chart;
      const fontsReady = canvas.ownerDocument?.fonts?.ready;
      if (fontsReady) void fontsReady.then(() => {
        if (chart === created) { chart.resize(); chart.update('none'); }
      }).catch(() => {});
    }
    root.setAttribute('data-chart-state', 'ready');
    status.textContent = '';
    status.hidden = true;
    retry.hidden = true;
    if (retryHadFocus) buttons.find(button => button.dataset.chartMetric === metric).focus({ preventScroll: true });
    root.setAttribute('aria-busy', 'false');
  }

  function showError() {
    const retryHadFocus = retry.ownerDocument?.activeElement === retry;
    clear();
    if (!isProjectionChartModel(model)) return;
    root.setAttribute('data-chart-state', 'error');
    status.textContent = 'The chart could not load. Use the full projection table below, or retry.';
    retry.hidden = false;
    if (retryHadFocus) retry.focus({ preventScroll: true });
  }

  async function reveal() {
    revealed = true;
    if (!isProjectionChartModel(model)) { clear(); return; }
    if (Chart) { try { render(); } catch { showError(); } return; }
    status.hidden = false;
    root.setAttribute('data-chart-state', 'loading');
    status.textContent = 'Loading chart… The full projection table is available below.';
    root.setAttribute('aria-busy', 'true');
    if (loading) return loading;
    let request;
    try { request = loadLibrary(); } catch { showError(); return; }
    loading = Promise.resolve(request).then(library => { Chart = library; render(); })
      .catch(showError).finally(() => { loading = undefined; });
    return loading;
  }
  const api = {
    update(next) {
      model = next;
      if (!isProjectionChartModel(model)) { clear(); return; }
      if (revealed) return reveal();
      root.setAttribute('data-chart-state', 'idle');
      status.textContent = 'Chart will load when you view results.';
      status.hidden = false;
      retry.hidden = true;
    },
    reveal,
  };
  buttons.forEach(button => button.addEventListener('click', () => { metric = button.dataset.chartMetric; if (revealed) void reveal(); }));
  year.addEventListener('change', () => { if (revealed) void reveal(); });
  retry.addEventListener('click', () => void reveal());
  mounted.set(root, api);
  return api;
}
