let pending;

/** DOM access is deferred until reveal; failed requests are retryable. */
export function loadChartLibrary() {
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../../../../assets/vendor/chartjs/chart.umd.min.js', import.meta.url).href;
    script.async = true;
    const timeout = setTimeout(() => fail(), 15000);
    const cleanup = () => { clearTimeout(timeout); script.onload = null; script.onerror = null; };
    const fail = () => { cleanup(); script.remove(); reject(new Error('Chart library unavailable')); };
    script.onerror = fail;
    script.onload = () => {
      if (globalThis.Chart?.version !== '4.6.1') { fail(); return; }
      cleanup(); resolve(globalThis.Chart);
    };
    document.head.append(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
