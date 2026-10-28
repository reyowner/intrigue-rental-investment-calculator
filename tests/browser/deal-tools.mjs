const require = (condition, message) => { if (!condition) throw new Error(message); };
const settle = async predicate => { for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,30));}throw new Error('Timed out waiting for deal tools'); };
export async function runDealToolsChecks() {
  const checks=[];const check=(condition,text)=>{require(condition,text);checks.push(text);};
  document.querySelector('[data-view-results]').click();
  const rent=document.querySelector('[name="monthlyRent"]');rent.value='3100.125';rent.dispatchEvent(new Event('input',{bubbles:true}));
  const old=Object.getOwnPropertyDescriptor(navigator,'clipboard');let copied='';
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
  try {
    document.querySelector('[data-share-deal]').click();
    await settle(()=>copied.length>0);
    const { decodeDealLink }=await import('/src/features/calculator/utils/share-link.js');
    check(decodeDealLink(copied).inputs.monthlyRent==='3100.125','copied link preserves the exact current rent');
    check(!new URL(copied).search && new URL(copied).hash.startsWith('#deal='),'shared financial state is in a fragment, not server query parameters');
    rent.value='';rent.dispatchEvent(new Event('input',{bubbles:true}));
    const previous=copied;document.querySelector('[data-share-deal]').click();
    await new Promise(r=>setTimeout(r,50));
    check(copied===previous && document.activeElement===rent,'invalid deals block sharing and focus the invalid field');
    rent.value='3200';rent.dispatchEvent(new Event('input',{bubbles:true}));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}});
    const button=document.querySelector('[data-share-deal]');button.focus();button.click();
    await settle(()=>!document.querySelector('[data-share-fallback]').hidden);
    const field=document.querySelector('[data-share-url]');
    check(field.value.includes('#deal=') && document.activeElement===field,'clipboard denial exposes a selected manual-copy link');
    rent.value='3300';rent.dispatchEvent(new Event('input',{bubbles:true}));
    check(field.value==='' && document.querySelector('[data-share-fallback]').hidden,'editing clears a displayed stale share link');
  } finally { if(old)Object.defineProperty(navigator,'clipboard',old);else delete navigator.clipboard; }
  document.querySelector('[data-calculator-form]').reset();
  return {passed:checks.length,checks};
}

export async function runReportActionChecks() {
  const { runPdfDownloadChecks } = await import('./pdf-download.mjs');
  return runPdfDownloadChecks();
}

export function runContactDealChecks() {
  const checks=[]; const check=(v,t)=>{require(v,t);checks.push(t);};
  const form=document.querySelector('#deal-contact-form');
  for(const [name,value] of Object.entries({name:'Demo Visitor',email:'demo@example.com',message:'Please review this example rental property.'}))form.elements.namedItem(name).value=value;
  const checkbox=document.querySelector('#contact-include-deal');
  const feedback=document.querySelector('#contact-feedback');
  const rent=document.querySelector('[name="monthlyRent"]');
  check(!checkbox.checked,'deal numbers are excluded by default');
  checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  check(!document.querySelector('#contact-deal-review').hidden && document.querySelectorAll('[data-contact-assumption]').length===40,'contact opt-in exposes all forty readonly assumptions');
  const message=form.elements.namedItem('message').value;
  rent.value='2800.125';rent.dispatchEvent(new Event('input',{bubbles:true}));
  check(document.querySelector('[data-contact-assumption="monthlyRent"]').textContent==='2800.125','contact numbers follow the current deal');
  form.requestSubmit();
  check(!feedback.hidden && feedback.textContent.includes('nothing has been sent'),'valid attached deal receives an honest browser-only confirmation');
  rent.value='';rent.dispatchEvent(new Event('input',{bubbles:true}));
  form.requestSubmit();
  check(feedback.hidden && !document.querySelector('#contact-deal-error').hidden && document.querySelector('#contact-deal-review').hidden,'invalid opted-in deal clears stale review and blocks confirmation');
  checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));form.requestSubmit();
  check(!feedback.hidden,'contact demo remains usable without deal numbers when the calculator is invalid');
  check(form.elements.namedItem('message').value===message,'calculator changes never overwrite the visitor message');
  document.querySelector('[data-calculator-form]').reset();
  return {passed:checks.length,checks};
}
