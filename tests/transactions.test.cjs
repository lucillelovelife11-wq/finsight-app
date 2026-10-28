const test=require('node:test'),assert=require('node:assert/strict'),T=require('../transaction-engine.js');
const b=Object.freeze({revenue:59070,ni:3353,cfo:8431,assets:76448,equity:15282,cash:5942,ar:2391,ppe:null,prepaid:null,debt:100,cfi:null,cff:null,ap:null,deferred:null});
test('reported income statement initializes with actual baseline, not zero',()=>{const r=T.rows(b,T.empty());assert.equal(r.income[0].baseline,59070);assert.equal(r.income[2].baseline,3353);assert.equal(r.income[2].change,0);});
test('prepayment leaves income unchanged and moves cash and CFO equally',()=>{const d=T.apply(b,T.empty(),'prepay',111).delta,r=T.rows(b,d);assert.equal(r.income[2].adjusted,3353);assert.equal(r.balance[0].adjusted,5831);assert.equal(r.balance[2].baseline,null);assert.equal(r.balance[2].change,111);assert.equal(r.balance[2].adjusted,null);assert.equal(r.cashflow[2].adjusted,8320);assert.deepEqual(r.checks,{balance:0,cash:0,indirect:0});assert.equal(b.cash,5942);});
test('insurance recognition following prepayment reduces income without another cash outflow',()=>{let d=T.apply(b,T.empty(),'prepay',111).delta;d=T.apply(b,d,'insurance',20).delta;const r=T.rows(b,d);assert.equal(r.income[2].adjusted,3333);assert.equal(d.cash,-111);assert.equal(d.cfo,-111);assert.deepEqual(r.checks,{balance:0,cash:0,indirect:0});});
test('credit sale and subsequent collection link all three statements',()=>{let d=T.apply(b,T.empty(),'credit',100).delta;assert.equal(d.cfo,0);d=T.apply(b,d,'collect',100).delta;assert.equal(d.revenue,100);assert.equal(d.ar,0);assert.equal(d.cfo,100);assert.deepEqual(T.rows(b,d).checks,{balance:0,cash:0,indirect:0});});
test('unknown opening accounts cannot fund unsupported settlements',()=>{assert.ok(T.apply(b,T.empty(),'insurance',10).error);assert.ok(T.apply(b,T.empty(),'depreciation',10).error);assert.ok(T.apply(b,T.empty(),'prepay',6000).error);});
test('linked statement UI loads reported baseline, applies prepayment and resets on reload',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),nodes=new Map();
 const get=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:''});return nodes.get(id);};
 const ctx={FinSightTransactions:T,FinSightScenario:require('../scenario-engine.js'),diagEsc:String,secWorkspace:null,applyTx(){},renderTx(){},resetTx(){},exportTx(){},updateContextBars(){},document:{getElementById:get}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../linked-transactions.js'),'utf8'),ctx);
 const current={};for(const [key,value] of Object.entries(b))if(typeof value==='number')current[key]={value:value*1e6};
 ctx.secWorkspace={company:'United Airlines Holdings',ticker:'UAL',year:2025,history:[{current}]};ctx.updateContextBars();
 assert.match(get('txIS').innerHTML,/59,070/);assert.match(get('txIS').innerHTML,/3,353/);assert.match(get('txExplain').textContent,/UAL/);assert.equal(get('txAmountLabel').textContent,'Amount (USD millions)');
 get('txType').value='prepay';get('txAmount').value='111';ctx.applyTx();assert.match(get('txBS').innerHTML,/5,831/);assert.match(get('txCF').innerHTML,/8,320/);assert.match(get('txExplain').textContent,/no immediate effect/);assert.match(get('txIS').innerHTML,/3,353/);
 ctx.updateContextBars();assert.match(get('txBS').innerHTML,/5,942/);assert.equal(get('txAmount').value,'');assert.match(get('txExplain').textContent,/No simulated transactions yet/);
});
