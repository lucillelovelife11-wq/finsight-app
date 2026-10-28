const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../scenario-engine.js');
test('DuPont uses comparable opening and closing balances and does not mutate facts',()=>{
 const b=Object.freeze({ni:12,revenue:100,assets:120,beginAssets:80,equity:60,beginEquity:40,cfo:9});
 const r=E.metrics(b);assert.equal(r.roe,24);assert.equal(r.margin,12);assert.equal(r.turnover,1);assert.equal(r.leverage,2);assert.equal(r.accruals,3);
 const edited={...b,ni:20};assert.equal(E.metrics(edited).roe,40);assert.equal(b.ni,12);
});
test('missing input and explicit zero are different',()=>{
 assert.equal(E.metrics({ni:10,revenue:null}).margin,null);
 assert.equal(E.metrics({ni:0,revenue:100}).margin,0);
 assert.equal(E.metrics({ni:10,revenue:0}).margin,null);
 assert.equal(E.metrics({cfo:10,capex:null}).fcf,null);
});
test('forecasts compound revenue and apply explicit margin and cash conversion',()=>{
 const rows=E.project({revenue:100,growth:10,forecastMargin:20,forecastConversion:.5,capex:2},2);
 assert.ok(Math.abs(rows[1].revenue-121)<1e-10);assert.ok(Math.abs(rows[1].ni-24.2)<1e-10);assert.ok(Math.abs(rows[1].cfo-12.1)<1e-10);
 assert.equal(E.project({revenue:100,growth:0,forecastMargin:10,forecastConversion:null},1)[0].cfo,null);
 assert.equal(E.project({revenue:100,growth:-100},1)[0].revenue,null);
});
test('credit revenue reversal need not change cash; cash expense changes it',()=>{
 const b={cfo:30};const adj={enabled:true,deltaNI:-10,nonCash:0,receivables:-10,inventory:0,liabilities:0};
 assert.equal(E.historical(b,adj).cfo,30);assert.equal(E.historical(b,{...adj,receivables:0}).cfo,20);assert.equal(b.cfo,30);
});
test('cash bridge never treats a missing working-capital adjustment as zero',()=>{
 const a={enabled:true,deltaNI:1,nonCash:0,receivables:null,inventory:0,liabilities:0};
 assert.equal(E.historical({cfo:30},a).cfo,null);
});
test('peer mean median and coverage exclude missing values but retain zero',()=>{
 assert.deepEqual(E.aggregate([{metrics:{roe:10}},{metrics:{roe:null}},{metrics:{roe:0}},{metrics:{roe:20}}],'roe'),{n:3,mean:10,median:10});
 assert.deepEqual(E.aggregate([],'roe'),{n:0,mean:null,median:null});
});
test('DCF requires all assumptions and discount rates have the correct direction',()=>{
 const b={fcff:100,growth:5,wacc:10,terminal:2,netDebt:200,shares:50};
 const first=E.valuation(b),higher=E.valuation({...b,wacc:12});assert.ok(first.perShare>higher.perShare);
 assert.ok(E.valuation({...b,wacc:2}).error);assert.ok(E.valuation({...b,shares:0}).error);assert.ok(E.valuation({...b,fcff:null}).error);
});
test('required equity return flows through weighted capital cost',()=>{
 assert.equal(E.wacc({re:10,rd:5,debtWeight:40,tax:25}),7.5);
 assert.equal(E.wacc({re:12,rd:5,debtWeight:40,tax:25}),8.7);
 assert.equal(E.wacc({re:10,rd:5,debtWeight:101,tax:25}),null);
 assert.equal(E.wacc({re:null,rd:5,debtWeight:40,tax:25}),null);
});
