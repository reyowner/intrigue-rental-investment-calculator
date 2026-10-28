import { icon } from '../../../components/ui/icon.js';
import { INPUT_GROUPS } from '../constants/input-fields.js';
import { calculateInvestment } from '../engine.js';
import { buildResultView } from '../utils/result-view.js';

export const fieldId = name => `deal-${name.replaceAll('.', '-')}`;
const units = { currency: '$', monthly: '$/mo', annual: '$/yr', percent: '%', years: 'years' };
const spokenUnits = { currency: 'in US dollars', monthly: 'in US dollars per month', annual: 'in US dollars per year', percent: 'as a percentage', years: 'in years' };

function inputField(field) {
  const id = fieldId(field.name);
  return `<div class="calculator-field">
    <label for="${id}">${field.label}<span class="sr-only">, ${spokenUnits[field.unit]}</span></label>
    <div class="calculator-input-wrap"><input id="${id}" name="${field.name}" type="text" inputmode="${field.name.endsWith('GrowthPercent') || field.name === 'appreciationPercent' ? 'text' : 'decimal'}" value="${field.value}" required autocomplete="off" spellcheck="false" aria-describedby="${id}-help ${id}-error" aria-invalid="false"><span class="calculator-unit" aria-hidden="true">${units[field.unit]}</span></div>
    <p class="calculator-field-help" id="${id}-help">${field.help}</p>
    <p class="calculator-field-error" id="${id}-error" hidden></p>
  </div>`;
}

function inputGroup(group) {
  return `<fieldset class="calculator-group"><legend${group.advanced ? ` id="assumptions-${group.id}" tabindex="-1"` : ''}>${group.title}</legend>${group.help ? `<p class="calculator-group-help">${group.help}</p>` : ''}<div class="calculator-fields">${group.fields.map(inputField).join('')}</div></fieldset>`;
}

function resultMetric(metric, group) {
  return `<div class="calculator-metric calculator-metric--${metric.key}" data-${group}="${metric.key}">
    <dt>${metric.label}</dt><dd><span data-result-value>${metric.value}</span><p class="calculator-metric-help">${metric.help}</p><p class="calculator-unavailable" data-result-reason${metric.unavailable ? '' : ' hidden'}>${metric.unavailable}</p></dd>
  </div>`;
}

/** Static templates contain developer-authored metadata and formatted engine values only. */
export function calculator() {
  const view = buildResultView(calculateInvestment());
  const advancedGroups = INPUT_GROUPS.filter(group => group.advanced);
  const advancedCount = advancedGroups.reduce((count, group) => count + group.fields.length, 0);
  return `<div class="calculator-workspace" data-calculator>
    <form class="calculator-form" data-calculator-form novalidate aria-labelledby="deal-inputs-heading">
      <div class="calculator-form-heading"><div><h3 id="deal-inputs-heading" tabindex="-1">Your property numbers</h3><p>Start with Intrigue's example duplex or enter your own deal. Enter amounts in US dollars without commas. Results are formatted automatically.</p></div><div class="calculator-form-actions"><button type="reset" class="calculator-reset">Reset to example</button><a class="text-link" href="#deal-results-heading">View estimates ${icon('chevron')}</a></div></div>
      <div class="calculator-errors" data-calculator-errors hidden><p>Check these inputs to see your estimates.</p><ul data-calculator-error-list></ul></div>
      ${INPUT_GROUPS.filter(group => !group.advanced).map(inputGroup).join('')}
      <section class="calculator-derived" aria-labelledby="financing-totals-heading"><h4 id="financing-totals-heading">Purchase and financing totals</h4><p>Calculated from your inputs, not additional amounts to enter.</p><dl>${view.derived.map(metric => resultMetric(metric, 'derived')).join('')}</dl></section>
      <details class="calculator-advanced" data-advanced-assumptions><summary><span>Advanced assumptions<small>${advancedCount} pre-filled, editable assumptions</small></span>${icon('chevron')}</summary><div class="calculator-advanced-content"><nav class="calculator-group-navigation" aria-label="Advanced assumption groups"><p>Jump to a group</p><ul>${advancedGroups.map(group => `<li><a href="#assumptions-${group.id}">${group.title}</a></li>`).join('')}</ul></nav><p class="calculator-group-help">Refine the assumptions to fit your property. Use 0 for costs that do not apply. Growth rates may be negative, but cannot be below -100%.</p>${advancedGroups.map(inputGroup).join('')}<a class="text-link" href="#deal-results-heading">View updated estimates ${icon('arrow')}</a></div></details>
    </form>
    <aside class="calculator-results" aria-labelledby="deal-results-heading"><div class="calculator-results-inner"><p class="calculator-results-kicker">Your deal at a glance</p><h3 id="deal-results-heading" tabindex="-1">The numbers behind<br>your next step.</h3><p class="calculator-results-intro">Estimates update as you type. No sign-up required.</p><p class="calculator-result-state" data-result-state>Showing estimates for the example duplex.</p><dl class="calculator-headlines">${view.headline.map(metric => resultMetric(metric, 'headline')).join('')}</dl><p class="calculator-results-note">These results reflect the inputs in this form. Review the property's costs and your assumptions before making an investment decision.</p><a class="button button--lime" href="#contact">Talk to an Intrigue agent ${icon('arrow')}</a><a class="calculator-edit-link" href="#deal-inputs-heading">Edit property numbers</a><p class="calculator-next-phase">The full 30-year projection table and chart are planned for the next development phase.</p></div></aside>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-calculator-announcement></p>
  </div>`;
}
