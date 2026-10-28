const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const E=require('../scenario-engine.js');
// DOM adapter exercises real event handlers and rendering without opening a browser or desktop app.
function setup(){
 const nodes=new Map();class Element{
  constructor(id){this.id=id;this.value='';this.dataset={};this.listeners={};this.children=[];this.innerHTML='';this.textContent='';this.classList={toggle(){}};}
  click(){}
  setAttribute(k,v){this[k]=v;}
  focus(){this.focused=true;}
  scrollIntoView(){}
  dispatchEvent(e){this.listeners[e.type]?.({target:this});}
  appendChild(n){this.children.push(n);nodes.set(n.id,n);}
  querySelectorAll(){return [];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  querySelector(sel){if(sel==='.scenario-results'){if(!this.result)this.result=new Element('result');return this.result;}return null;}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
 const ctx={console,FinSightScenario:E,secWorkspace:null,diagEsc:x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),updateContextBars(){},diagReset(){},dupont(){},quality(){},opcalc(){},dcf(){},applySECInputs(){},diagRender(){},diagState:{path:'earnings',answers:{},step:0},diagFlows:{earnings:Array(6)},document:{getElementById:get,createElement:()=>new Element(''),},setTimeout,URL,Blob,Date,fetch:async()=>{throw new Error('No external network in tests');}};
 ctx.Event=Event;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../workspace-v7.js'),'utf8'),ctx);
 return {ctx,get,click(id,dataset){get('scenario-'+id).listeners.click({target:{closest:()=>({dataset})}});},input(id,dataset,value){get('scenario-'+id).listeners.input({target:{dataset,value,classList:{toggle(){}}}});}};
}
function fixture(ticker='DAL',ni=12){const fact=(value,tag)=>({value:value*1e6,tag,periodEnd:'2025-12-31',filed:'2026-02-01',accession:'sample'});return {company:ticker,ticker,cik:ticker,year:2025,retrievedAt:'test-'+ticker,history:[{year:2025,periods:{current:'2025-12-31',prior:'2024-12-31'},current:{ni:fact(ni,'NetIncomeLoss'),revenue:fact(100,'Revenues'),cfo:fact(9,'CFO'),assets:fact(120,'Assets'),equity:fact(60,'Equity'),ar:fact(8,'AR')},prior:{assets:fact(80,'Assets'),equity:fact(40,'Equity'),ar:fact(6,'AR')},results:{arGrowth:33,revenueGrowth:10}}]};}
test('all nine modules mount and both branches render',()=>{const a=setup();for(const id of ['home','library','ratios','operating','quality','valuation','explorer','cases','diagnosis']){a.click(id,{mode:'forecast'});assert.match(a.get('scenario-'+id).innerHTML,/Editable copy/);assert.match(a.get('scenario-'+id).result.innerHTML,/No SEC company/);a.click(id,{mode:'historical'});assert.match(a.get('scenario-'+id).innerHTML,/cash-flow bridge/);}});
test('company load clears stale defaults, copies all supported facts and resets scenarios on company change',()=>{const a=setup();a.get('qcapex').value='85';a.ctx.secWorkspace=fixture();a.ctx.updateContextBars();assert.equal(a.get('qni').value,12);assert.equal(a.get('qrev').value,100);assert.equal(a.get('qcapex').value,'');assert.equal(a.get('ab').value,80);a.click('quality',{mode:'historical'});a.input('quality',{field:'ni'},'20');assert.match(a.get('scenario-quality').result.innerHTML,/Net income changes by 8/);assert.equal(a.ctx.secWorkspace.history[0].current.ni.value,12e6);a.ctx.secWorkspace=fixture('UAL',5);a.ctx.updateContextBars();assert.equal(a.get('qni').value,5);assert.match(a.get('scenario-quality').innerHTML,/<div hidden>/);assert.doesNotMatch(a.get('scenario-quality').innerHTML,/aria-pressed="true"/);});
test('missing beginning balances and invalid legacy calculator inputs never become zero',()=>{const a=setup(),f=fixture();f.history[0].periods.prior='2020-12-31';a.ctx.secWorkspace=f;a.ctx.updateContextBars();assert.equal(a.get('ab').value,'');a.ctx.dupont();assert.match(a.get('dupInsight').innerHTML,/Missing facts are not zero/);assert.equal(a.get('dupResults').innerHTML,'');});
test('manual valuation baseline remains separate from SEC and scenario edits',()=>{const a=setup();a.click('valuation',{mode:'forecast'});for(const [k,v] of Object.entries({fcff:100,growth:5,wacc:10,terminal:2,netDebt:200,shares:50}))a.input('valuation',{base:k},String(v));assert.doesNotMatch(a.get('scenario-valuation').result.innerHTML,/Supply FCFF/);a.input('valuation',{field:'wacc'},'12');assert.match(a.get('scenario-valuation').result.innerHTML,/Value per share/);a.click('valuation',{action:'export'});});
test('peer fetch exposes missing coverage and excludes incomparable fiscal dates',async()=>{
 const a=setup();a.ctx.secWorkspace=fixture();a.ctx.updateContextBars();a.click('quality',{mode:'historical'});a.input('quality',{config:'peerList'},'DAL UAL AAL');
 let calls=0;a.ctx.fetch=async url=>{calls++;const ticker=url.includes('UAL')?'UAL':'AAL';return {ok:true,json:async()=>({ticker,year:2025,periodValidated:true,periods:{current:ticker==='UAL'?'2025-12-31':'2025-06-30'},results:{margin:10,roe:20,roa:5,currentRatio:1,cfo:10,netIncome:5},current:{equity:{value:10}},prior:{equity:{value:10}},secUrl:'https://www.sec.gov/',retrievedAt:'test'})};};
 a.click('quality',{action:'peers'});await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);assert.match(a.get('scenario-quality').innerHTML,/1 comparable peers loaded/);assert.match(a.get('scenario-quality').innerHTML,/more than 45 days/);assert.match(a.get('scenario-quality').innerHTML,/n=1 comparable peers/);
});
test('peer response cannot repopulate a newly selected company workspace',async()=>{
 const a=setup();a.ctx.secWorkspace=fixture();a.ctx.updateContextBars();a.click('quality',{mode:'historical'});a.input('quality',{config:'peerList'},'UAL');let release;a.ctx.fetch=()=>new Promise(r=>release=r);a.click('quality',{action:'peers'});a.ctx.secWorkspace=fixture('AAL');a.ctx.updateContextBars();release({ok:true,json:async()=>({ticker:'UAL',periodValidated:true,periods:{current:'2025-12-31'},results:{},current:{},prior:{}})});await new Promise(resolve=>setImmediate(resolve));assert.doesNotMatch(a.get('scenario-quality').innerHTML,/1 comparable peers loaded/);assert.match(a.get('scenario-quality').innerHTML,/AAL/);
});
test('calculator status names the company and year and identifies the exact missing field',()=>{
 const a=setup(),f=fixture('UAL');f.company='United Airlines Holdings, Inc.';a.ctx.secWorkspace=f;a.ctx.updateContextBars();
 assert.match(a.get('dupInsight').innerHTML,/United Airlines Holdings, Inc\. \(UAL\) · FY2025/);
 assert.match(a.get('dupInsight').innerHTML,/All required inputs are present/);
 assert.match(a.get('qInsight').innerHTML,/Missing inputs \(1\)/);assert.match(a.get('qInsight').innerHTML,/<li>Capital expenditures<\/li>/);
 a.get('ni').value='4000';a.get('ni').listeners.input();assert.equal(a.get('dupResults').innerHTML,'');assert.match(a.get('dupInsight').innerHTML,/Inputs changed/);
 a.ctx.dupont();assert.match(a.get('dupInsight').innerHTML,/your edited inputs/);
 a.get('ni').value='';a.get('ni').listeners.input();assert.match(a.get('dupInsight').innerHTML,/<li>Net income<\/li>/);
});
test('Analyze operations click identifies all six missing inputs and focuses the first',()=>{
 const a=setup();a.ctx.secWorkspace=fixture('UAL');a.ctx.updateContextBars();a.ctx.opcalc(true);
 assert.match(a.get('calc-feedback-opcalc').innerHTML,/UAL/);assert.match(a.get('calc-feedback-opcalc').innerHTML,/Missing 6/);
 for(const label of ['Interest expense','Interest revenue','Assumed tax rate','Operating liabilities','Non-operating assets','Interest-bearing debt'])assert.ok(a.get('calc-feedback-opcalc').innerHTML.includes(label));
 assert.equal(a.get('iex').focused,true);assert.equal(a.get('iex')['aria-invalid'],'true');
 for(const k of ['iex','irev','tax','ol','noaasset','debt'])a.get(k).value='0';a.ctx.opcalc(true);
 assert.match(a.get('calc-feedback-opcalc').innerHTML,/All required inputs are present/);assert.equal(a.get('iex')['aria-invalid'],'false');
});
test('cash quality computes available metrics without CapEx or receivables',()=>{
 const a=setup();a.ctx.secWorkspace=fixture('UAL');a.ctx.updateContextBars();
 for(const [k,v] of Object.entries({qni:3353,qocf:8431,qrev:59070,qcapex:'',qarb:'',qare:''}))a.get(k).value=v;
 a.ctx.quality(true);assert.match(a.get('calc-feedback-quality').innerHTML,/3 of 5 indicators updated/);
 assert.match(a.get('qResults').innerHTML,/-5,078/);assert.match(a.get('qResults').innerHTML,/2.51/);assert.match(a.get('qResults').innerHTML,/-8.6/);
 assert.match(a.get('qInsight').innerHTML,/Missing inputs \(3\)/);
 a.get('qcapex').value=5874;a.ctx.quality(true);assert.match(a.get('qResults').innerHTML,/2,557/);assert.match(a.get('calc-feedback-quality').innerHTML,/4 of 5/);
 a.get('qarb').value=2163;a.get('qare').value=2391;a.ctx.quality(true);assert.match(a.get('calc-feedback-quality').innerHTML,/5 of 5/);assert.match(a.get('qResults').innerHTML,/228/);
});
test('valuation synchronizes historical shares and exposes reviewed bridges separately from assumptions',()=>{
 const a=setup(),f=fixture('UAL'),c=f.history[0].current;
 for(const [k,v] of Object.entries({shares:300,capex:5,interest:2,taxExpense:3,debtCurrent:4,debtNoncurrent:20,cash:6}))c[k]={value:v*1e6,tag:k,periodEnd:'2025-12-31'};
 a.ctx.secWorkspace=f;a.ctx.updateContextBars();assert.equal(a.get('shares').value,300);assert.equal(a.get('qcapex').value,5);assert.equal(a.get('iex').value,2);
 assert.equal(a.get('fcff').value,'');assert.equal(a.get('netdebt').value,'');assert.equal(a.get('wacc').value,'');
 assert.match(a.get('valuation-linked-evidence').innerHTML,/not reported financial facts/);
 a.get('use-fcff-bridge').onclick();assert.equal(a.get('fcff').value,5.6);
 a.get('use-debt-bridge').onclick();assert.equal(a.get('netdebt').value,18);
 a.get('use-demo-assumptions').onclick();assert.equal(a.get('wacc').value,10);assert.match(a.get('calc-feedback-dcf').textContent,/Illustrative assumptions/);
});
