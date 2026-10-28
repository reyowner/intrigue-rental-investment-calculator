import { calculateInvestment } from './engine.js';
import { readInputValues } from './utils/input-values.js';
import { buildResultView } from './utils/result-view.js';
import { fieldId } from './components/calculator.js';

/** Connect existing native controls to the engine; never replace focused inputs. */
export function initializeCalculator(scope = document) {
  const workspace = scope.querySelector('[data-calculator]');
  if (!workspace) return;
  const form = workspace.querySelector('[data-calculator-form]');
  const inputs = [...form.querySelectorAll('input[name]')];
  const errorBox = form.querySelector('[data-calculator-errors]');
  const errorList = form.querySelector('[data-calculator-error-list]');
  const state = workspace.querySelector('[data-result-state]');
  const announcement = workspace.querySelector('[data-calculator-announcement]');
  // Reveal a directly linked advanced group before the page honors its fragment.
  const initialTarget = document.getElementById(window.location.hash.slice(1));
  if (initialTarget && workspace.contains(initialTarget)) {
    const disclosure = initialTarget.closest('details');
    if (disclosure) disclosure.open = true;
  }

  function update({ focusError = false } = {}) {
    const result = calculateInvestment(readInputValues(new FormData(form).entries()));
    const view = buildResultView(result);
    for (const input of inputs) {
      input.setAttribute('aria-invalid', 'false');
      const message = document.getElementById(`${input.id}-error`);
      message.textContent = '';
      message.hidden = true;
    }
    errorList.replaceChildren();
    errorBox.hidden = result.ok;
    if (!result.ok) {
      for (const error of result.errors) {
        const control = form.elements.namedItem(error.field);
        const item = document.createElement('li');
        if (control) {
          control.setAttribute('aria-invalid', 'true');
          const message = document.getElementById(`${control.id}-error`);
          message.textContent = error.message;
          message.hidden = false;
          const link = document.createElement('a');
          link.href = `#${fieldId(error.field)}`;
          link.textContent = `${control.labels[0].textContent}: ${error.message}`;
          link.addEventListener('click', event => {
            event.preventDefault();
            const details = control.closest('details');
            if (details) details.open = true;
            control.focus();
          });
          item.append(link);
        } else item.textContent = error.message;
        errorList.append(item);
      }
    }
    for (const [group, metrics] of [['headline', view.headline], ['derived', view.derived]]) {
      for (const metric of metrics) {
        const row = workspace.querySelector(`[data-${group}="${metric.key}"]`);
        row.querySelector('[data-result-value]').textContent = metric.value;
        const reason = row.querySelector('[data-result-reason]');
        reason.textContent = metric.unavailable;
        reason.hidden = !view.valid || !metric.unavailable;
      }
    }
    state.textContent = view.valid
      ? 'Showing estimates based on your current inputs.'
      : 'Estimates are unavailable. Correct the input errors to calculate this deal.';
    workspace.dataset.calculationState = view.valid ? 'valid' : 'invalid';
    announcement.textContent = view.valid
      ? `Estimates updated. ${view.headline.map(metric => `${metric.label}: ${metric.value}${metric.unavailable ? `. ${metric.unavailable}` : ''}`).join('. ')}.`
      : `Estimates unavailable. ${result.errors.map(error => error.message).join(' ')}`;
    if (focusError && !result.ok) {
      const control = inputs.find(input => input.getAttribute('aria-invalid') === 'true');
      if (control) {
        const details = control.closest('details');
        if (details) details.open = true;
        control.focus();
      } else errorBox.scrollIntoView({ block: 'nearest' });
    }
  }

  form.addEventListener('input', () => update());
  form.addEventListener('change', () => update());
  form.addEventListener('reset', event => {
    // Trusted reset events can checkpoint microtasks before native values reset.
    // Own this reset synchronously so restored inputs and estimates stay in sync.
    event.preventDefault();
    for (const input of inputs) input.value = input.defaultValue;
    update();
  });
  form.addEventListener('submit', event => { event.preventDefault(); update({ focusError: true }); });
  update();
}
