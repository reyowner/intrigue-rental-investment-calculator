import test from 'node:test';
import assert from 'node:assert/strict';
import { contact, initializeContact } from '../../src/features/homepage/sections/contact/contact.js';
import { INPUT_GROUPS } from '../../src/features/calculator/constants/input-fields.js';
import { readInputValues } from '../../src/features/calculator/utils/input-values.js';
import { calculateInvestment } from '../../src/features/calculator/engine.js';
import { buildResultView } from '../../src/features/calculator/utils/result-view.js';

const definitions = INPUT_GROUPS.flatMap(group=>group.fields);
const raw = () => readInputValues(definitions.map(field=>[field.name,String(field.value)]));
function node(extra={}) {
  return {hidden:false,textContent:'',value:'',checked:false,listeners:{},attributes:{},
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},
    removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]??[]).filter(f=>f!==fn);},
    emit(type){for(const fn of this.listeners[type]??[])fn({preventDefault(){}});},
    setAttribute(name,value){this.attributes[name]=value;}, focus(){this.focused=true;}, ...extra};
}
function fixture(t, initial={inputs:raw(),model:calculateInvestment()}) {
  const fields = ['name','email','phone','property','message'].map(name=>node({id:`contact-${name}`,name,required:['name','email','message'].includes(name),maxLength:name==='message'?2000:254,validity:{typeMismatch:false},value:({name:'Visitor Name',email:'visitor@example.com',message:'Please review my property.'})[name]??''}));
  const hooks=Object.fromEntries(['feedback','include-deal','deal-review','deal-error'].map(name=>[`#contact-${name}`,node({hidden:name!=='include-deal'})]));
  const assumptions=definitions.map(field=>node({dataset:{contactAssumption:field.name}}));
  const summaries=[...buildResultView(initial.model).headline,...buildResultView(initial.model).derived].map((field,index)=>node({dataset:{contactSummary:String(index)}}));
  const errors=Object.fromEntries(fields.map(field=>[`#${field.id}-error`,node()]));
  const form=node({querySelectorAll(selector){return selector==='input, textarea'?[...fields,hooks['#contact-include-deal']]:selector==='[data-contact-assumption]'?assumptions:selector==='[data-contact-summary]'?summaries:fields;}});
  const all={'#deal-contact-form':form,...hooks,...errors};
  const previous=globalThis.document;
  globalThis.document={querySelector:selector=>all[selector],querySelectorAll:selector=>form.querySelectorAll(selector)};
  t.after(()=>{globalThis.document=previous;});
  let snapshot=initial, listener, unsubscribed=false;
  const controller=initializeContact({getSnapshot:()=>snapshot,subscribe(fn){listener=fn;return()=>{unsubscribed=true;};}});
  return {fields,form,hooks,errors,assumptions,summaries,controller,update(next){snapshot=next;listener?.(next);},get unsubscribed(){return unsubscribed;}};
}

test('contact opt-in starts unchecked with all 40 labeled readonly assumptions outside contact text fields',()=>{
  const html=contact();
  const checkbox=html.match(/<input[^>]*id="contact-include-deal"[^>]*>/)?.[0];
  assert.ok(checkbox,'Explicit opt-in checkbox exists');
  assert.match(checkbox,/type="checkbox"/);
  assert.doesNotMatch(checkbox,/\bchecked\b/);
  assert.match(html,/Include my current deal numbers/);
  assert.equal((html.match(/data-contact-assumption=/g)??[]).length,40);
  for(const field of definitions) assert.ok(html.includes(field.label));
  assert.match(html,/id="contact-deal-review"[^>]*hidden/);
  assert.match(html,/Nothing is sent or stored/);
});

test('opting in reviews all live raw assumptions and engine summaries without changing visitor text',t=>{
  const f=fixture(t);
  const visitor=f.fields.map(field=>field.value);
  f.hooks['#contact-include-deal'].checked=true;
  f.hooks['#contact-include-deal'].emit('change');
  assert.equal(f.hooks['#contact-deal-review'].hidden,false);
  assert.deepEqual(f.assumptions.map(node=>node.textContent),definitions.map(field=>String(field.value)));
  const expected=buildResultView(calculateInvestment());
  assert.deepEqual(f.summaries.map(node=>node.textContent),[...expected.headline,...expected.derived].map(field=>field.value));
  const inputs=raw(); inputs.monthlyRent='0003000.123456789'; inputs.rentGrowthPercent='-2.123456789';
  f.update({inputs,model:calculateInvestment(inputs)});
  assert.equal(f.assumptions.find(node=>node.dataset.contactAssumption==='monthlyRent').textContent,inputs.monthlyRent);
  assert.deepEqual(f.fields.map(field=>field.value),visitor);
  f.form.emit('submit');
  assert.equal(f.hooks['#contact-feedback'].hidden,false);
  assert.match(f.hooks['#contact-feedback'].textContent,/current deal numbers/);
  assert.match(f.hooks['#contact-feedback'].textContent,/nothing has been sent/i);
});


test('invalid opted-in deals clear stale attachments and block only the local confirmation', t => {
  const f = fixture(t);
  const choice = f.hooks['#contact-include-deal'];
  choice.checked = true; choice.emit('change'); f.form.emit('submit');
  assert.equal(f.hooks['#contact-feedback'].hidden, false);
  const inputs = raw(); inputs.monthlyRent = '';
  f.update({ inputs, model: calculateInvestment(inputs) });
  assert.equal(f.hooks['#contact-feedback'].hidden, true);
  assert.equal(f.hooks['#contact-deal-review'].hidden, true);
  assert.ok(f.assumptions.every(node => node.textContent === ''));
  assert.ok(f.summaries.every(node => node.textContent === ''));
  assert.equal(f.hooks['#contact-deal-error'].hidden, false);
  f.form.emit('submit');
  assert.equal(f.hooks['#contact-feedback'].hidden, true);
  assert.equal(choice.focused, true);
  choice.checked = false; choice.emit('change'); f.form.emit('submit');
  assert.equal(f.hooks['#contact-feedback'].hidden, false);
  assert.match(f.hooks['#contact-feedback'].textContent, /nothing has been sent/i);
  choice.checked = true; choice.emit('change');
  f.update({ inputs: raw(), model: calculateInvestment() });
  assert.equal(f.hooks['#contact-deal-review'].hidden, false);
  assert.equal(f.hooks['#contact-deal-error'].hidden, true);
});
