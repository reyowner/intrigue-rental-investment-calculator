import test from 'node:test';
import assert from 'node:assert/strict';
import { createPdfLoader } from '../../src/features/calculator/services/pdf-library.js';

function fixture(fail=false) {
  const world={}, scripts=[],fetches=[];let failing=fail;
  const document={createElement(){return {remove(){this.removed=true;}};},head:{append(script){scripts.push(script);queueMicrotask(()=>{
    if(failing){script.onerror();return;}
    if(script.src.includes('autotable'))world.applyPlugin=ctor=>{ctor.API.autoTable=()=>{};};
    else world.jspdf={jsPDF:Object.assign(function(){},{version:'4.2.1',API:{}})};
    script.onload();
  });}}};
  const fetch=async url=>{fetches.push(url);return{ok:true,arrayBuffer:async()=>new Uint8Array([0,1,0,0,1,2,3,4]).buffer};};
  return{load:createPdfLoader({document,global:world,fetch}),scripts,fetches,recover(){failing=false;}};
}
test('PDF dependencies are lazy, local and coalesced until explicitly requested',async()=>{
  const f=fixture();assert.equal(f.scripts.length,0);assert.equal(f.fetches.length,0);
  const a=f.load(),b=f.load();assert.equal(a,b);
  const assets=await a;
  assert.equal(assets.jsPDF.version,'4.2.1');assert.ok(assets.regularFont&&assets.boldFont&&assets.logo);
  assert.equal(f.scripts.length,2);assert.equal(f.fetches.length,3);
  assert.ok(f.scripts.every(script=>script.src.includes('/assets/vendor/')));
  assert.ok(f.fetches.every(url=>String(url).includes('/assets/')));
  assert.equal(await f.load(),assets);assert.equal(f.scripts.length,2);
});
test('a blocked PDF dependency rejects cleanly and can be retried',async()=>{
  const f=fixture(true);await assert.rejects(f.load(),/PDF|load/i);
  assert.equal(f.scripts[0].removed,true);
  f.recover();assert.equal((await f.load()).jsPDF.version,'4.2.1');
});
