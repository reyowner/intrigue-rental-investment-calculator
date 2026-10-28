import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvestment } from '../src/features/calculator/engine.js';
import { buildProjectionChartConfig } from '../src/features/calculator/utils/projection-chart-view.js';
import { initializeProjectionChart } from '../src/features/calculator/projection-chart-controller.js';

test('theme palette redraw preserves raw amounts, metric and year without animation', async () => {
  const model=calculateInvestment();
  const light=buildProjectionChartConfig(model,'equity',30,'light');
  const dark=buildProjectionChartConfig(model,'equity',30,'dark');
  assert.notEqual(light.options.color,dark.options.color);
  assert.notEqual(light.data.datasets[0].borderColor,dark.data.datasets[0].borderColor);
  assert.deepEqual(light.data.datasets[0].rawValues,dark.data.datasets[0].rawValues);
  assert.equal(dark.options.animation,false);
  const events=new EventTarget();
  const document={documentElement:{dataset:{theme:'light'}},defaultView:events};
  const node=()=>({textContent:'', value:'1', dataset:{}, listeners:{}, ownerDocument:document, setAttribute(k,v){this[k]=v;},addEventListener(k,f){this.listeners[k]=f;}});
  const hooks=Object.fromEntries(['canvas','year','status','retry','selection-label','value'].map(k=>[k,node()]));
  hooks.canvas.getContext=()=>({clearRect(){}});
  const buttons=['annualCashFlow','equity'].map(metric=>Object.assign(node(),{dataset:{chartMetric:metric}}));
  const root={ownerDocument:document,querySelector:s=>hooks[s.match(/data-chart-([^\]]+)/)?.[1]],querySelectorAll:()=>buttons,setAttribute(){}};
  let chart;
  class Chart { constructor(canvas,config){chart=this;this.data=config.data;this.options=config.options;this.modes=[];} update(mode){this.modes.push(mode);} }
  const controller=initializeProjectionChart({querySelector:()=>root},{loadLibrary:async()=>Chart});
  controller.update(model); await controller.reveal();
  buttons[1].listeners.click(); hooks.year.value='30'; hooks.year.listeners.change();
  document.documentElement.dataset.theme='dark';
  const event=new Event('intrigue:theme-change'); event.detail={theme:'dark'}; events.dispatchEvent(event);
  assert.equal(chart.options.color,dark.options.color);
  assert.equal(chart.options.projectionMetric,'equity');
  assert.equal(hooks.year.value,'30');
  assert.equal(chart.data.datasets[0].pointRadius[29],5);
  assert.deepEqual(chart.data.datasets[0].rawValues,model.years.map(y=>y.equity));
  assert.equal(chart.modes.at(-1),'none');
});
