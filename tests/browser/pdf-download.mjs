const require = (condition, message) => { if (!condition) throw new Error(message); };

/** Lets the real anchor download run. Enable test-owned downloads in the browser first. */
export async function runPdfDownloadChecks() {
  document.querySelector('[data-view-results]').click();
  const checks=[]; const check=(value,text)=>{require(value,text);checks.push(text);};
  const values=JSON.stringify([...document.querySelectorAll('[data-calculator-form] input[name]')].map(e=>[e.name,e.value]));
  const oldCreate=URL.createObjectURL, oldOpen=window.open, oldPrint=window.print;
  let blob, filename='', popups=0, prints=0;
  URL.createObjectURL=function(value){if(value.type==='application/pdf')blob=value;return oldCreate.call(URL,value);};
  window.open=()=>{popups++;return null;};window.print=()=>{prints++;};
  const capture=event=>{const anchor=event.target.closest?.('a[download]');if(anchor)filename=anchor.download;};
  document.addEventListener('click',capture,true);
  try {
    const button=document.querySelector('[data-save-report]');button.focus();button.click();button.click();
    for(let i=0;i<1200&&!blob;i++)await new Promise(resolve=>setTimeout(resolve,25));
    check(blob?.type==='application/pdf' && blob.size>10000,'Save report generates an actual PDF blob');
    check(/^intrigue-rental-investment-report-\d{4}-\d{2}-\d{2}\.pdf$/.test(filename),'download has a meaningful brand/report/date filename');
    check(popups===0&&prints===0,'saving never opens a report popup or print dialog');
    const signature=new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()).slice(0,5));
    check(signature==='%PDF-','downloaded payload is a PDF, not an HTML page');
    check(JSON.stringify([...document.querySelectorAll('[data-calculator-form] input[name]')].map(e=>[e.name,e.value]))===values,'export preserves every financial input');
    check(!button.disabled && button.getAttribute('aria-busy')==='false','save action recovers from its busy state');
    window.__lastDownloadedPdf={blob,filename};
    return{passed:checks.length,checks,filename,bytes:blob.size};
  } finally {URL.createObjectURL=oldCreate;window.open=oldOpen;window.print=oldPrint;document.removeEventListener('click',capture,true);}
}
