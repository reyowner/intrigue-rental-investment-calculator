const asset = path => new URL(`../../../../assets/${path}`, import.meta.url).href;
const encoded = buffer => {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
};

/** Native scripts and font bytes load only after a requested export; no CDN or input payload. */
export function createPdfLoader({ document = globalThis.document, global = globalThis, fetch = globalThis.fetch } = {}) {
  let pending, pluginLoaded = false;
  function script(url, ready) {
    if (ready()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const node = document.createElement('script'); node.src = url; node.async = true;
      const timer = setTimeout(() => fail(), 15000);
      function fail() { clearTimeout(timer); node.remove(); reject(new Error('PDF library could not load. Check your connection and try again.')); }
      node.onerror = fail;
      node.onload = () => { clearTimeout(timer); if (!ready()) { fail(); return; } resolve(); };
      document.head.append(node);
    });
  }
  async function bytes(url) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'force-cache', signal: controller.signal });
      if (!response.ok) throw new Error('PDF asset could not load. Please try again.');
      return encoded(await response.arrayBuffer());
    } finally { clearTimeout(timer); }
  }
  return function load() {
    if (!pending) pending = (async () => {
      await script(asset('vendor/jspdf/jspdf.umd.min.js'), () => global.jspdf?.jsPDF?.version === '4.2.1');
      if (!pluginLoaded) {
        await script(asset('vendor/jspdf-autotable/jspdf.plugin.autotable.min.js'), () => typeof global.applyPlugin === 'function');
        global.applyPlugin(global.jspdf.jsPDF); pluginLoaded = true;
      }
      const [regularFont, boldFont, logo] = await Promise.all([
        bytes(asset('vendor/raleway/Raleway-Regular.ttf')),
        bytes(asset('vendor/raleway/Raleway-Bold.ttf')),
        bytes(asset('images/intrigue-wordmark-teal.png')),
      ]);
      return Object.freeze({ jsPDF: global.jspdf.jsPDF, regularFont, boldFont, logo: `data:image/png;base64,${logo}` });
    })().catch(error => { pending = null; throw error; });
    return pending;
  };
}

let loader;
export function loadPdfLibrary() { loader ??= createPdfLoader(); return loader(); }
