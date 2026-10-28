import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { INPUT_GROUPS } from '../../src/features/calculator/constants/input-fields.js';
import { readInputValues } from '../../src/features/calculator/utils/input-values.js';
import { calculateInvestment } from '../../src/features/calculator/engine.js';
import { buildProjectionView } from '../../src/features/calculator/utils/projection-view.js';
import { buildResultView } from '../../src/features/calculator/utils/result-view.js';
import { buildPdfDocument, reportFilename } from '../../src/features/calculator/report/pdf-document.js';

const require = createRequire(import.meta.url);
const { jsPDF } = require('../../assets/vendor/jspdf/jspdf.umd.min.js');
require('../../assets/vendor/jspdf-autotable/jspdf.plugin.autotable.min.js').applyPlugin(jsPDF);
const file = name => readFileSync(new URL(`../../assets/vendor/raleway/${name}`, import.meta.url)).toString('base64');
const assets = { jsPDF, regularFont: file('Raleway-Regular.ttf'), boldFont: file('Raleway-Bold.ttf'), logo: 'data:image/png;base64,' + readFileSync(new URL('../../assets/images/intrigue-wordmark-teal.png',import.meta.url)).toString('base64') };
function snapshot(overrides={}) {
  const entries=INPUT_GROUPS.flatMap(group=>group.fields.map(field=>[field.name,String(overrides[field.name]??field.value)]));
  const inputs=readInputValues(entries);return {inputs,model:calculateInvestment(inputs)};
}

test('direct PDF filename identifies Intrigue, the investment report and the local export date',()=>{
  assert.equal(reportFilename(new Date(2026,9,28,23,59)), 'intrigue-rental-investment-report-2026-10-28.pdf');
  assert.throws(()=>reportFilename(new Date('invalid')), /date/i);
});

test('real PDF generation preserves every table cell, both graphs, all inputs and every summary',()=>{
  const source=snapshot();const before=JSON.stringify(source);const tables=[],texts=[],points=[],positions=[];
  function RecordingPdf(options){
    const doc=new jsPDF(options);const table=doc.autoTable,text=doc.text,circle=doc.circle;
    doc.autoTable=function(options){tables.push(options);return table.call(doc,options);};
    doc.text=function(value,...args){positions.push([value,args[1]]);texts.push(...(Array.isArray(value)?value:[value]));return text.call(doc,value,...args);};
    doc.circle=function(...args){points.push(args);return circle.apply(doc,args);};return doc;
  }
  const {document:doc,filename}=buildPdfDocument(source,{...assets,jsPDF:RecordingPdf},{date:new Date(2026,9,28)});
  assert.equal(filename,'intrigue-rental-investment-report-2026-10-28.pdf');
  assert.match(doc.output(), /^%PDF-/);
  assert.ok(doc.getNumberOfPages()>5);
  const projection=tables.filter(table=>table.head[0][0]==='Financial measure / source');
  assert.equal(projection.length,6);
  const cells=projection.flatMap(table=>table.body.filter(row=>typeof row[0]==='string').flatMap(row=>row.slice(1)));
  const expected=buildProjectionView(source.model).groups.flatMap(group=>group.rows.flatMap(row=>row.cells.map(cell=>cell.value+(cell.note?` [${cell.note}]`:''))));
  assert.equal(cells.length,1530);assert.deepEqual([...cells].sort(),expected.sort());
  assert.equal(points.length,60);
  assert.ok(positions.find(([text])=>text==='Investment at a glance')[1] >= positions.find(([text])=>text==='Investment summary')[1]+20,'cover title clears the running section header');
  const assumptions=tables.filter(table=>table.head[0][0]==='Assumption');
  assert.equal(assumptions.flatMap(table=>table.body).length,40);
  const display=buildResultView(source.model);const allText=texts.join(' ');
  for(const metric of [...display.headline,...display.derived])assert.ok(allText.includes(metric.value),metric.label);
  assert.ok(allText.includes('Annual cash flow')&&allText.includes('End-of-year equity'));
  assert.equal(JSON.stringify(source),before);
});

test('invalid and stale snapshots cannot produce a PDF',()=>{
  assert.throws(()=>buildPdfDocument({inputs:{},model:{ok:false}},assets),/snapshot/i);
  const stale=snapshot();stale.inputs.monthlyRent='999';
  assert.throws(()=>buildPdfDocument(stale,assets),/snapshot/i);
});


test('the default export produces PDF bytes and downloads with a dated filename, without printing', async()=>{
  const { downloadInvestmentReport }=await import('../../src/features/calculator/report/download-report.js');
  let saved;
  const result=await downloadInvestmentReport(snapshot(),{date:new Date(2026,9,28),loadDependencies:async()=>assets,save:async(blob,filename)=>{saved={blob,filename};}});
  assert.equal(saved.filename,'intrigue-rental-investment-report-2026-10-28.pdf');
  assert.equal(saved.blob.type,'application/pdf');
  const bytes=new Uint8Array(await saved.blob.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0,5)),'%PDF-');
  assert.equal(result.filename,saved.filename);assert.ok(bytes.length>10000);
});
