import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvestment, DEFAULT_INPUTS } from '../../src/features/calculator/engine.js';
import { INPUT_GROUPS } from '../../src/features/calculator/constants/input-fields.js';
import { readInputValues } from '../../src/features/calculator/utils/input-values.js';
import { buildProjectionView } from '../../src/features/calculator/utils/projection-view.js';
import { buildResultView } from '../../src/features/calculator/utils/result-view.js';
const url = new URL('../../src/features/calculator/report/investment-report.js', import.meta.url);
const api = () => import(url).catch(() => ({}));
test('both independent SVG graphs preserve all 30 signed, zero and extreme raw values', async () => {
  const { buildInvestmentReport } = await api();
  for (const range of ['normal', 'signed', 'zero', 'extreme', 'tiny']) {
    const snapshot = fixture();
    for (const [i, year] of snapshot.model.years.entries()) for (const key of ['annualCashFlow', 'equity']) {
      if (range === 'signed') year[key] = (i - 15) * 100;
      if (range === 'zero') year[key] = 0;
      if (range === 'extreme') year[key] = i % 2 ? 1e308 : -1e308;
      if (range === 'tiny') year[key] = i % 2 ? 1e-308 : -1e-308;
    }
    const before = JSON.stringify(snapshot);
    const html = buildInvestmentReport(snapshot);
    assert.equal((html.match(/<svg /g) || []).length, 2);
    for (const key of ['annualCashFlow', 'equity']) {
      assert.ok(html.includes(`data-report-chart="${key}"`));
      for (const year of snapshot.model.years) assert.ok(html.includes(`data-chart-point="${key}:${year.year}" data-raw="${year[key]}"`));
    }
    assert.doesNotMatch(html, /NaN|Infinity/);
    assert.equal(JSON.stringify(snapshot), before);
  }
});
export const fixture = (overrides = {}) => {
  const numbers = { ...DEFAULT_INPUTS, ...overrides };
  const inputs = readInputValues(INPUT_GROUPS.flatMap(g => g.fields.map(f => [f.name, String(f.name.split('.').reduce((v, k) => v[k], numbers))])));
  return { inputs, model: calculateInvestment(inputs) };
};
test('complete standalone report includes all assumptions and shared result values', async () => {
  const { buildInvestmentReport } = await api();
  assert.equal(typeof buildInvestmentReport, 'function', 'report HTML API exists');
  const snapshot = fixture();
  const before = JSON.stringify(snapshot);
  const html = buildInvestmentReport(snapshot, { baseUrl: 'https://example.test/calculator/' });
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Intrigue/);
  assert.equal((html.match(/data-report-input=/g) || []).length, 40);
  for (const group of INPUT_GROUPS) for (const field of group.fields) {
    assert.ok(html.includes(`data-report-input="${field.name}"`));
    assert.ok(html.includes(field.help));
  }
  const result = buildResultView(snapshot.model);
  for (const kind of ['headline', 'derived']) for (const item of result[kind]) {
    assert.ok(html.includes(`data-report-${kind}="${item.key}"`));
    assert.ok(html.includes(item.value));
  }
  assert.match(html, /https:\/\/example.test\/calculator\/assets\/images\/intrigue-wordmark-teal.png/);
  assert.equal(JSON.stringify(snapshot), before);
});
test('six readable year bands include every shared projection cell, reasons and glossary', async () => {
  const { buildInvestmentReport } = await api();
  const snapshot = fixture({ purchasePrice: 0, afterRepairValue: 0, monthlyRent: 0, monthlyPropertyTaxes: 0, monthlyInsurance: 0 });
  const html = buildInvestmentReport(snapshot);
  const projection = buildProjectionView(snapshot.model);
  assert.equal((html.match(/data-report-band=/g) || []).length, 6);
  assert.equal((html.match(/data-report-cell=/g) || []).length, 1530);
  for (const group of projection.groups) for (const row of group.rows) {
    for (const cell of row.cells) assert.ok(html.includes(`data-report-cell="${row.key}:${cell.year}">${cell.value}`));
    assert.ok(html.includes(row.help.replaceAll('&', '&amp;').replaceAll("'", '&#39;')));
  }
  for (const note of projection.notes) assert.ok(html.includes(note.reason));
  assert.match(html, /hypothetical sale/i);
  assert.match(html, /thead\s*\{[^}]*table-header-group/);
  assert.match(html, /@page/);
  assert.doesNotMatch(html, /overflow:\s*(auto|scroll|hidden)/);
});
test('invalid, incomplete and stale snapshots cannot generate a misleading report', async () => {
  const { buildInvestmentReport } = await api();
  for (const invalid of [null, {}, { inputs: {}, model: { ok: false } }, { ...fixture(), inputs: {} }]) {
    assert.throws(() => buildInvestmentReport(invalid), /snapshot|input|model/i);
  }
  const stale = fixture(); stale.inputs.monthlyRent = '999';
  assert.throws(() => buildInvestmentReport(stale), /snapshot|input|model/i);
  const broken = fixture(); broken.model.years.pop();
  assert.throws(() => buildInvestmentReport(broken), /snapshot|input|model/i);
  const badCell = fixture(); delete badCell.model.years[0].expenses.utilities.water;
  assert.throws(() => buildInvestmentReport(badCell), /snapshot|input|model/i);
  const badRaw = fixture(); badRaw.inputs.monthlyRent = '<script>alert(1)</script>';
  assert.throws(() => buildInvestmentReport(badRaw), /snapshot|input|model/i);
  const html = buildInvestmentReport(fixture(), { baseUrl: 'https://example.test/\"<attack>/' });
  assert.doesNotMatch(html, /<attack>/);
  assert.doesNotMatch(html, /localStorage|sessionStorage|<script/);
});


test('a user-created report window prints only after readiness and keeps a manual print action', async () => {
  const { openInvestmentReport } = await api();
  assert.equal(typeof openInvestmentReport, 'function');
  let printed = 0, html = '', action;
  const button = { addEventListener(type, fn) { action = fn; } };
  const target = { document: { readyState: 'complete', fonts: { ready: Promise.resolve() }, open() {}, write(value) { html = value; }, close() {}, querySelector() { return button; } }, print() { printed++; }, close() {} };
  const result = openInvestmentReport(fixture(), { openWindow: () => target });
  assert.equal(result.ok, true);
  assert.equal(printed, 0);
  await result.ready;
  assert.equal(printed, 1);
  action(); assert.equal(printed, 2);
  assert.match(html, /data-print-report/);
  assert.equal((html.match(/data-report-cell=/g) || []).length, 1530);
  const blocked = openInvestmentReport(fixture(), { openWindow: () => null });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /pop-up/i);
  printed = 0;
  const manual = openInvestmentReport(fixture(), { openWindow: () => target, autoPrint: false });
  await manual.ready; assert.equal(printed, 0);
});


test('closing the report during load cancels printing without rejecting readiness', async () => {
  const { openInvestmentReport } = await api();
  let loaded, prints = 0;
  const target = { closed: false, document: { readyState: 'loading', open(){}, write(){}, close(){}, querySelector(){return {addEventListener(){}};} }, addEventListener(type, fn){loaded=fn;}, print(){prints++;}, close(){} };
  const report = openInvestmentReport(fixture(), {openWindow:()=>target});
  target.closed=true; target.document=undefined; loaded();
  await assert.doesNotReject(report.ready);
  assert.equal(prints,0);
});
