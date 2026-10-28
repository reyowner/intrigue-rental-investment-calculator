import { INPUT_GROUPS } from './constants/input-fields.js';
import { encodeDealLink, decodeDealLink } from './utils/share-link.js';
import { downloadInvestmentReport } from './report/download-report.js';

/** Optional output actions consume the same current model as every on-page result. */
export function initializeCalculatorTools(scope, calculator) {
  const root = scope.querySelector('[data-calculator-tools]');
  if (!root || !calculator) return;
  const form = scope.querySelector('[data-calculator-form]');
  const notice = scope.querySelector('[data-deal-link-notice]');
  const status = root.querySelector('[data-tools-status]');
  const fallback = root.querySelector('[data-share-fallback]');
  const field = root.querySelector('[data-share-url]');
  const share = root.querySelector('[data-share-deal]');
  const report = root.querySelector('[data-save-report]');
  let generation = 0;
  let restoring = false;
  const say = message => { status.textContent = message; status.hidden = false; };
  calculator.subscribe(() => {
    generation += 1; fallback.hidden = true; field.value = ''; status.hidden = true;
    if (!restoring) notice.hidden = true;
  });

  function restore() {
    const decoded = decodeDealLink(window.location.href);
    if (decoded.status === 'none') return;
    if (decoded.status === 'invalid') { notice.textContent = decoded.message; notice.hidden = false; return; }
    restoring = true;
    for (const group of INPUT_GROUPS) for (const definition of group.fields) {
      form.elements.namedItem(definition.name).value = definition.name.split('.').reduce((value, key) => value[key], decoded.inputs);
    }
    const valid = calculator.refresh().ok;
    restoring = false;
    notice.textContent = valid
      ? 'Loaded a shared deal. Edits are not saved automatically; copy a new link to share revised numbers.'
      : 'The shared inputs were restored, but some values need correction before results can be shown.';
    notice.hidden = false;
    if (valid) {
      calculator.revealResults({ focus: false });
      const scroll = () => {
        if (document.activeElement !== document.body) return;
        const heading = scope.querySelector('#projection-heading');
        heading.focus({ preventScroll: true });
        const scroller = document.scrollingElement, behavior = scroller.style.scrollBehavior;
        scroller.style.scrollBehavior = 'auto'; heading.scrollIntoView({ block: 'start', behavior: 'auto' }); scroller.style.scrollBehavior = behavior;
      };
      if (document.readyState === 'complete') requestAnimationFrame(scroll);
      else window.addEventListener('load', () => requestAnimationFrame(scroll), { once: true });
    }
  }

  share.addEventListener('click', async () => {
    if (!calculator.refresh({ focusError: true }).ok) { say('Correct the highlighted inputs before sharing this deal.'); return; }
    const epoch = generation;
    let link;
    try { link = encodeDealLink(calculator.getSnapshot().inputs, window.location.href); }
    catch { say('These inputs cannot be encoded in a share link. Review their numeric values and try again.'); return; }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(link);
      if (generation === epoch) say('Deal link copied. Anyone with it can view these assumptions and results.');
    } catch {
      if (generation !== epoch) return;
      field.value = link; fallback.hidden = false;
      say('Automatic copying is unavailable. Copy the selected link below.');
      if (document.activeElement === share) { field.focus(); field.select(); }
    }
  });

  let exporting = false;
  report.addEventListener('click', async () => {
    if (exporting) return;
    if (!calculator.refresh({ focusError: true }).ok) { say('Correct the highlighted inputs before saving a report.'); return; }
    const snapshot = calculator.getSnapshot(), epoch = generation;
    const hadFocus = document.activeElement === report, label = report.textContent;
    exporting = true; report.disabled = true; report.setAttribute('aria-busy', 'true');
    report.textContent = 'Preparing full PDF...';
    say('Preparing your complete PDF, including both graphs and all 30 projection years.');
    try {
      const saved = await downloadInvestmentReport(snapshot);
      say(generation === epoch
        ? `PDF download started: ${saved.filename}. Check your browser downloads.`
        : `PDF download started: ${saved.filename}. It contains the numbers from when you selected Save, before your latest edits.`);
    } catch {
      say('The PDF could not be created. Check your connection and try again; your entered values have not been changed by the export.');
    } finally {
      exporting = false; report.disabled = false; report.setAttribute('aria-busy', 'false'); report.textContent = label;
      if (hadFocus && generation === epoch && document.activeElement === document.body && report.getClientRects().length) report.focus({ preventScroll: true });
    }
  });
  window.addEventListener('hashchange', restore);
  restore();
}
