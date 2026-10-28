export const CHART_METRICS = Object.freeze({ annualCashFlow: 'Annual cash flow', equity: 'End-of-year equity' });

export function isProjectionChartModel(model) {
  return model?.ok === true && model.years?.length === 30 && model.years.every((row, index) =>
    row.year === index + 1 && Object.keys(CHART_METRICS).every(key => Number.isFinite(row[key])));
}

export function chartDollars(value, compact = false) {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e15 || (magnitude > 0 && magnitude < .01)) {
    return `${value < 0 ? '-' : ''}$${magnitude.toExponential(2).replace('e+', 'e')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
    ...(compact ? { notation: 'compact', maximumFractionDigits: magnitude < 1 ? 2 : 1 } : { maximumFractionDigits: 0 }) }).format(Object.is(value, -0) ? 0 : value);
}

/** Display scaling only. Raw engine amounts remain intact for inspection/tooltips. */
export function buildProjectionChartConfig(model, metric = 'annualCashFlow', selectedYear = 1, theme = 'light') {
  if (!isProjectionChartModel(model) || !CHART_METRICS[metric]) throw new TypeError('Invalid projection chart model or metric');
  const palette = theme === 'dark'
    ? { ink: '#E7F1F5', line: '#9DC31B', tick: '#CCE5ED', grid: '#355763' }
    : { ink: '#123A48', line: '#1B5063', tick: '#1B5063', grid: '#CCE5ED' };
  const rawValues = model.years.map(row => row[metric]);
  const magnitude = Math.max(...rawValues.map(Math.abs));
  const scale = magnitude > 1e100 || (magnitude > 0 && magnitude < 1e-100) ? magnitude : 1;
  const data = rawValues.map(value => value / scale);
  const allZero = magnitude === 0;
  const low = allZero ? -1 : Math.min(0, ...data);
  const high = allZero ? 1 : Math.max(0, ...data);
  const font = { family: 'Raleway, sans-serif', size: 12 };
  return {
    type: 'line',
    data: { labels: model.years.map(row => row.year), datasets: [{
      label: CHART_METRICS[metric], rawValues, data, borderColor: palette.line, borderWidth: 2.5,
      pointBackgroundColor: '#9DC31B', pointBorderColor: '#123A48',
      pointRadius: data.map((_, i) => i === selectedYear - 1 ? 5 : 0),
      pointHoverRadius: 6, pointHitRadius: 12, tension: .18, fill: false, clip: false,
    }] },
    options: {
      projectionMetric: metric, projectionScale: scale, animation: false, responsive: true,
      maintainAspectRatio: false, color: palette.ink, font,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#123A48', titleFont: font, bodyFont: font,
        callbacks: { title: items => `Year ${items[0]?.label ?? ''}`,
          label: context => `${CHART_METRICS[metric]}: ${chartDollars(context.dataset.rawValues[context.dataIndex])}` },
      } },
      scales: {
        x: { title: { display: true, text: 'Year', color: palette.ink, font }, grid: { display: false },
          ticks: { font, color: palette.tick, autoSkip: false, maxRotation: 0,
            callback: (_, index) => [0, 4, 9, 14, 19, 24, 29].includes(index) ? index + 1 : null } },
        y: { min: low, max: high, title: { display: true, text: 'Dollars ($)', color: palette.ink, font },
          grid: { color: context => context.tick.value === 0 ? palette.tick : palette.grid,
            lineWidth: context => context.tick.value === 0 ? 1.5 : 1 },
          ticks: { font, color: palette.tick, maxTicksLimit: 6,
            callback: value => value !== 0 && value * scale === 0 ? null : chartDollars(value * scale, true) } },
      },
    },
  };
}
