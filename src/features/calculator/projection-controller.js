import { buildProjectionView } from './utils/projection-view.js';
import { projectionNotes } from './components/projection-results.js';
import { initializeProjectionChart } from './projection-chart-controller.js';

/** Keep table nodes and viewing controls stable while the same live model drives Chart.js. */
export function initializeProjection(scope) {
  const root = scope.querySelector('[data-projection]');
  if (!root) return { update() {}, reveal() {} };
  const valid = root.querySelector('[data-projection-valid]');
  const invalid = root.querySelector('[data-projection-invalid]');
  const scroll = root.querySelector('[data-projection-scroll]');
  const select = root.querySelector('[data-projection-year]');
  const chart = initializeProjectionChart(root);
  const notes = root.querySelector('[data-projection-notes]');
  const noteList = root.querySelector('[data-projection-note-list]');
  const rows = new Map([...root.querySelectorAll('[data-projection-row]')].map(row => [
    row.dataset.projectionRow,
    [...row.querySelectorAll('[data-projection-cell]')].map(cell => ({
      cell, value: cell.querySelector('[data-projection-value]'), note: cell.querySelector('[data-projection-note]'),
    })),
  ]));
  let lastPosition = { left: 0, top: 0 };
  let wasValid = true;

  select.addEventListener('change', () => {
    const heading = root.querySelector(`[data-projection-year-heading="${select.value}"]`);
    if (!heading) return;
    const labelWidth = root.querySelector('.projection-table-corner').getBoundingClientRect().width;
    const left = scroll.scrollLeft + heading.getBoundingClientRect().left - scroll.getBoundingClientRect().left - scroll.clientLeft - labelWidth;
    scroll.scrollTo({ left: Math.max(0, left), top: scroll.scrollTop, behavior: 'auto' });
  });

  return {
    reveal() {
      root.hidden = false;
      void chart.reveal();
    },
    update(model) {
      const view = buildProjectionView(model);
      if (wasValid) lastPosition = { left: scroll.scrollLeft, top: scroll.scrollTop };
      valid.hidden = !view.valid;
      invalid.hidden = view.valid;
      if (view.valid) {
        for (const group of view.groups) for (const row of group.rows) {
          const cells = rows.get(row.key);
          row.cells.forEach((cell, i) => {
            const node = cells[i];
            if (node.value.textContent !== cell.value) node.value.textContent = cell.value;
            node.note.textContent = cell.note || '';
            node.note.hidden = !cell.note;
            if (cell.note) node.cell.setAttribute('aria-describedby', `projection-note-${cell.note}`);
            else node.cell.removeAttribute('aria-describedby');
          });
        }
        noteList.innerHTML = projectionNotes(view);
        notes.hidden = !view.notes.length;
        if (!wasValid) scroll.scrollTo({ ...lastPosition, behavior: 'auto' });
      } else {
        for (const cells of rows.values()) for (const node of cells) {
          node.value.textContent = 'N/A';
          node.note.textContent = '';
          node.note.hidden = true;
          node.cell.removeAttribute('aria-describedby');
        }
        noteList.replaceChildren();
        notes.hidden = true;
      }
      void chart.update(model);
      wasValid = view.valid;
    },
  };
}
