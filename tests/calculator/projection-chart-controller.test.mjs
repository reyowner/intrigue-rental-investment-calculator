import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvestment } from '../../src/features/calculator/engine.js';

function fixture() {
  const node = () => ({textContent:'', hidden:false, value:'1', dataset:{}, listeners:{}, setAttribute(k,v){this[k]=v;}, addEventListener(k, fn){this.listeners[k]=fn;}});
  const hooks = Object.fromEntries(['canvas','year','status','retry','selection-label','value'].map(k => [k, node()]));
  hooks.canvas.width = 600;
  hooks.canvas.getContext = () => ({clearRect(){}});
  const buttons = ['annualCashFlow','equity'].map(metric => Object.assign(node(), {dataset:{chartMetric:metric}}));
  const root = {attributes:{}, querySelector: s => hooks[s.match(/data-chart-([^\]]+)/)?.[1]], querySelectorAll: () => buttons, setAttribute(k,v){this.attributes[k]=v;}};
  const scope = {querySelector: () => root};
  const instances = [];
  class Chart {
    constructor(canvas, config) {this.canvas=canvas; this.config=config; this.data=config.data; this.options=config.options; this.updates=0; instances.push(this);}
    update(){this.updates++;} destroy(){this.destroyed=true;} resize(){}
  }
  return {scope, hooks, buttons, instances, Chart};
}

test('invalid updates destroy and clear immediately, including pending-load races; recovery uses latest data', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  const f=fixture(); let resolve;
  const controller=initializeProjectionChart(f.scope,{loadLibrary:()=>new Promise(r=>{resolve=r;})});
  const model=calculateInvestment(); controller.update(model);
  const pending=controller.reveal();
  controller.update({ok:false});
  resolve(f.Chart); await pending;
  assert.equal(f.instances.length,0);
  assert.equal(f.hooks.value.textContent,'N/A');
  assert.equal(f.hooks.status.hidden,false);
  assert.equal(f.hooks.retry.hidden,true);
  const next=structuredClone(model); next.years[0].annualCashFlow=-765.4321;
  await controller.update(next);
  assert.deepEqual(f.instances[0].data.datasets[0].rawValues,next.years.map(y=>y.annualCashFlow));
  await controller.update({ok:false});
  assert.equal(f.instances[0].destroyed,true);
  assert.equal(f.instances[0].data.datasets.length,0);
  await controller.update(next);
  assert.equal(f.instances.length,2);
});

test('partially constructed chart is unregistered and cleared after construction throws', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  const f=fixture(); let registered;
  class Chart extends f.Chart {
    constructor(...args) { super(...args); registered=this; throw new Error('after registering'); }
    static getChart(){return registered;}
    destroy(){super.destroy(); registered=undefined;}
  }
  const controller=initializeProjectionChart(f.scope,{loadLibrary:async()=>Chart});
  controller.update(calculateInvestment()); await controller.reveal();
  assert.equal(registered,undefined);
  assert.equal(f.instances[0].destroyed,true);
  assert.equal(f.instances[0].data.datasets.length,0);
});

test('load/constructor/update failures stay local with retry and no stale chart', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  for (const failure of ['load','construct','update']) {
    const f=fixture(); let broken=true;
    const Base=f.Chart;
    class Chart extends Base {
      constructor(...args) { if (broken && failure==='construct') throw new Error('construction'); super(...args); }
      update() { if (broken && failure==='update') throw new Error('update'); super.update(); }
    }
    const controller=initializeProjectionChart(f.scope,{loadLibrary:()=>{if(broken && failure==='load') throw new Error('network'); return Promise.resolve(Chart);}});
    controller.update(calculateInvestment());
    await assert.doesNotReject(async()=>{await controller.reveal(); if(failure==='update') await controller.update(calculateInvestment());});
    assert.equal(f.hooks.retry.hidden,false);
    assert.match(f.hooks.status.textContent,/table/);
    broken=false;
    await controller.reveal();
    assert.equal(f.hooks.retry.hidden,true);
    assert.equal(f.hooks.status.hidden,true);
  }
});

test('QA state follows loading, ready, error and invalid without stale asynchronous completion', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  const f=fixture(); const root=f.scope.querySelector(); let reject;
  const controller=initializeProjectionChart(f.scope,{loadLibrary:()=>new Promise((_,r)=>{reject=r;})});
  controller.update(calculateInvestment()); const pending=controller.reveal();
  assert.equal(root.attributes['data-chart-state'],'loading');
  reject(new Error('network')); await pending;
  assert.equal(root.attributes['data-chart-state'],'error');
  controller.update({ok:false});
  assert.equal(root.attributes['data-chart-state'],'invalid');
});

test('valid recovery before first reveal returns to idle without loading the library', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  const f=fixture(); let loads=0;
  const controller=initializeProjectionChart(f.scope,{loadLibrary:async()=>{loads++;return f.Chart;}});
  controller.update({ok:false}); controller.update(calculateInvestment());
  assert.equal(loads,0);
  assert.equal(f.scope.querySelector().attributes['data-chart-state'],'idle');
  assert.match(f.hooks.status.textContent,/view results/);
});

test('controller mounts once, stays lazy, reuses chart and retains metric/year', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  const f = fixture(); let loads=0;
  const controller = initializeProjectionChart(f.scope, {loadLibrary: async () => {loads++; return f.Chart;}});
  assert.equal(initializeProjectionChart(f.scope), controller);
  const model=calculateInvestment();
  controller.update(model);
  assert.equal(loads,0); assert.equal(f.instances.length,0);
  await controller.reveal();
  assert.equal(loads,1); assert.equal(f.instances.length,1);
  f.buttons[1].listeners.click();
  f.hooks.year.value='30'; f.hooks.year.listeners.change();
  const next=structuredClone(model); next.years[29].equity=123456.789;
  controller.update(next);
  assert.equal(f.instances.length,1);
  assert.equal(f.instances[0].options.projectionMetric,'equity');
  assert.deepEqual(f.instances[0].data.datasets[0].rawValues,next.years.map(y=>y.equity));
  assert.match(f.hooks['selection-label'].textContent,/Year 30/);
  assert.match(f.hooks.value.textContent,/123,457/);
});


test('correcting an input during a pending library load restores loading status and then the latest model', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  const f = fixture(); let resolve;
  const controller = initializeProjectionChart(f.scope, { loadLibrary: () => new Promise(r => { resolve = r; }) });
  controller.update(calculateInvestment());
  const pending = controller.reveal();
  controller.update({ ok: false });
  const latest = calculateInvestment({ monthlyRent: 2800 });
  controller.update(latest);
  assert.equal(f.scope.querySelector().attributes['data-chart-state'], 'loading');
  assert.equal(f.scope.querySelector().attributes['aria-busy'], 'true');
  assert.match(f.hooks.status.textContent, /Loading chart/);
  resolve(f.Chart); await pending;
  assert.equal(f.scope.querySelector().attributes['data-chart-state'], 'ready');
  assert.deepEqual(f.instances[0].data.datasets[0].rawValues, latest.years.map(year => year.annualCashFlow));
});


test('successful retry restores focus to the selected metric only if retry still owns focus', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  for (const ownsFocus of [true, false]) {
    const f = fixture(); const document = { activeElement: null }; let focusedMetric = null; let broken = true;
    f.hooks.retry.ownerDocument = document;
    f.hooks.retry.focus = () => { document.activeElement = f.hooks.retry; };
    for (const button of f.buttons) button.focus = () => { focusedMetric = button.dataset.chartMetric; document.activeElement = button; };
    const controller = initializeProjectionChart(f.scope, { loadLibrary: () => broken ? Promise.reject(new Error('blocked')) : Promise.resolve(f.Chart) });
    controller.update(calculateInvestment()); await controller.reveal();
    document.activeElement = ownsFocus ? f.hooks.retry : {};
    broken = false; await controller.reveal();
    assert.equal(focusedMetric, ownsFocus ? 'annualCashFlow' : null);
  }
});


test('late webfonts redraw only the still-current chart', async () => {
  const { initializeProjectionChart } = await import('../../src/features/calculator/projection-chart-controller.js');
  for (const invalidate of [false, true]) {
    const f = fixture(); let loaded;
    f.hooks.canvas.ownerDocument = { fonts: { ready: new Promise(resolve => { loaded = resolve; }) } };
    const controller = initializeProjectionChart(f.scope, { loadLibrary: async () => f.Chart });
    controller.update(calculateInvestment()); await controller.reveal();
    if (invalidate) controller.update({ ok: false });
    loaded(); await Promise.resolve();
    assert.equal(f.instances[0].updates, invalidate ? 0 : 1);
  }
});
