import { loadPdfLibrary } from '../services/pdf-library.js';
import { buildPdfDocument } from './pdf-document.js';
import { assertReportSnapshot } from './investment-report.js';

/** A download, not window.print(): destination/printer settings are never involved. */
export function savePdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.hidden = true;
  document.body.append(anchor);
  try { anchor.click(); } finally {
    anchor.remove();
    // Keep the object URL alive while the browser consumes a large report.
    const timer = setTimeout(() => URL.revokeObjectURL(url), 60000);
    timer?.unref?.();
  }
}

export async function downloadInvestmentReport(snapshot, { loadDependencies = loadPdfLibrary, save = savePdfBlob, date = new Date() } = {}) {
  assertReportSnapshot(snapshot);
  const assets = await loadDependencies();
  // Paint the progress state even when dependencies are already cached.
  await new Promise(resolve => setTimeout(resolve, 0));
  const { document, filename } = buildPdfDocument(snapshot, assets, { date });
  const blob = document.output('blob');
  await save(blob, filename);
  return { filename, bytes: blob.size, pages: document.getNumberOfPages() };
}
