import { buildProjectionView } from '../utils/projection-view.js';
import { buildResultView } from '../utils/result-view.js';
import { projectionCharts } from './projection-charts.js';

const rowId = key => key.replaceAll('.', '-');

/** Only trusted presenter text is interpolated. No raw form strings reach this template. */
export function projectionNotes(view) {
  return (view.notes || []).map(note => `<li id="projection-note-${note.number}" value="${note.number}">${note.reason}</li>`).join('');
}

function projectionTable(view) {
  if (!view.valid) return '';
  return `<table class="projection-table" data-projection-table>
    <caption class="sr-only">Full 30-year property investment projection. Annual amounts in US dollars, except monthly cash flow and percentage returns. Each column assumes the property is held through that year; sale rows show a separate hypothetical sale at that year end.</caption>
    <colgroup><col class="projection-label-column"><col span="30" class="projection-year-column"></colgroup>
    <thead><tr><th scope="col" class="projection-table-corner">Financial measure</th>${view.years.map(year => `<th scope="col" id="projection-year-${year}" data-projection-year-heading="${year}">Year ${year}</th>`).join('')}</tr></thead>
    ${view.groups.map(group => `<tbody><tr class="projection-group-row"><th scope="rowgroup" id="projection-group-${group.id}" tabindex="-1">${group.label}</th><td colspan="30" aria-hidden="true"></td></tr>${group.rows.map(row => {
      const id = rowId(row.key);
      return `<tr data-projection-row="${row.key}" data-source-row="${row.sourceRow ?? ''}"${row.emphasis ? ' class="projection-emphasis"' : ''}><th scope="row" id="projection-row-${id}" aria-describedby="projection-help-${id}" title="${row.help}">${row.label}</th>${row.cells.map(cell => `<td data-projection-cell="${cell.year}" headers="projection-row-${id} projection-year-${cell.year} projection-group-${group.id}"${cell.reason ? ` aria-describedby="projection-note-${cell.note}"` : ''}><span data-projection-value>${cell.value}</span><sup data-projection-note${cell.note ? '' : ' hidden'} aria-hidden="true">${cell.note || ''}</sup></td>`).join('')}</tr>`;
    }).join('')}</tbody>`).join('')}
  </table>`;
}

export function projectionResults(model) {
  const view = buildProjectionView(model);
  const summary = buildResultView(model).headline;
  return `<section class="projection-results" id="projection" aria-labelledby="projection-heading" data-projection hidden>
    <div class="projection-heading"><div><p class="section-label">The longer view</p><h3 id="projection-heading" tabindex="-1">Your property over 30 years.</h3><p>See how rental cash flow and equity could change with the numbers and growth assumptions in this form. These are estimates, not guaranteed outcomes.</p></div><a class="text-link" href="#deal-inputs-heading" data-edit-property>Edit property numbers</a></div>
    <p class="projection-invalid" data-projection-invalid${view.valid ? ' hidden' : ''}>The 30-year projection is unavailable. Correct the highlighted inputs above to see the table and charts.</p>
    <div data-projection-valid${view.valid ? '' : ' hidden'}>
      <dl class="projection-overview" aria-label="Deal summary">${summary.map(metric => `<div class="projection-overview-metric" data-overview="${metric.key}"><dt>${metric.label}</dt><dd><span data-result-value>${metric.value}</span><p class="calculator-unavailable" data-result-reason${metric.unavailable ? '' : ' hidden'}>${metric.unavailable}</p></dd></div>`).join('')}</dl>
      ${projectionCharts()}
      <div class="projection-table-heading"><div><h4 id="projection-table-heading" tabindex="-1">Full 30-year projection</h4><p id="projection-table-instructions">Annual amounts in US dollars, except monthly cash flow and percentage returns. Scroll inside the table to compare years and rows. Row labels and year headings stay in view. Use the year selector to jump across the table, or focus the table and use the arrow keys.</p></div><div class="projection-table-controls"><label for="projection-year-jump">Jump to year</label><select id="projection-year-jump" data-projection-year>${view.years.map(year => `<option value="${year}">Year ${year}</option>`).join('')}</select></div></div>
      <details class="projection-group-navigation"><summary>Jump to a table section</summary><nav aria-label="Projection table sections"><ul>${view.groups.map(group => `<li><a href="#projection-group-${group.id}">${group.label}</a></li>`).join('')}</ul></nav></details>
      <div class="projection-scroll" role="region" tabindex="0" aria-labelledby="projection-table-heading" aria-describedby="projection-table-instructions" data-projection-scroll>${projectionTable(view)}</div>
      <div class="projection-unavailable-notes" data-projection-notes${view.notes?.length ? '' : ' hidden'}><p>N/A means this return cannot be stated reliably for these inputs:</p><ol data-projection-note-list>${projectionNotes(view)}</ol></div>
      <p class="projection-sale-note">Sale proceeds are a separate what-if for each year, not repeated sales or extra recurring income. Depreciation and mortgage interest are informational. Effective cash flow includes noncash gains; annualized ending-wealth return and total ROI are not IRR.</p>
      <details class="projection-glossary"><summary>Understand these numbers</summary><dl>${view.groups.flatMap(group => group.rows).map(row => `<div><dt>${row.label}</dt><dd id="projection-help-${rowId(row.key)}">${row.help}</dd></div>`).join('')}</dl></details>
      <div class="projection-next-step"><div><h4>Talk through your next step.</h4><p>Have questions about the property or the assumptions? Discuss the deal with Intrigue.</p></div><a class="button button--lime" href="#contact">Talk to an Intrigue agent</a></div>
    </div>
  </section>`;
}
