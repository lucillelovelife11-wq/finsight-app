/* Pure calculations shared by the interface and regression tests. No network or DOM. */
(function(root){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const div=(a,b)=>finite(a)&&finite(b)&&b!==0?a/b:null;
 const sum=(...xs)=>xs.every(finite)?xs.reduce((a,b)=>a+b,0):null;
 function metrics(v){
  const aa=sum(v.assets,v.beginAssets), ae=sum(v.equity,v.beginEquity);
  const avgAssets=aa===null?null:aa/2,avgEquity=ae===null?null:ae/2;
  const noa=sum(v.assets,finite(v.opLiabilities)?-v.opLiabilities:null,finite(v.nonOpAssets)?-v.nonOpAssets:null);
  const interest=sum(v.interest,finite(v.interestIncome)?-v.interestIncome:null);
  const nopat=finite(interest)&&finite(v.tax)&&finite(v.ni)?v.ni+interest*(1-v.tax/100):null;
  return {revenue:v.revenue,ni:v.ni,cfo:v.cfo,assets:v.assets,equity:v.equity,
   margin:scale(div(v.ni,v.revenue),100),roe:scale(div(v.ni,avgEquity),100),
   roa:scale(div(v.ni,avgAssets),100),turnover:div(v.revenue,avgAssets),leverage:div(avgAssets,avgEquity),
   accruals:sum(v.ni,finite(v.cfo)?-v.cfo:null),cashConversion:div(v.cfo,v.ni),
   fcf:sum(v.cfo,finite(v.capex)?-v.capex:null),currentRatio:div(v.ca,v.cl),
   nopat,noa,opRoa:scale(div(nopat,noa),100)};
 }
 const scale=(x,n)=>finite(x)?x*n:null;
 function valuation(v){
  if(![v.fcff,v.growth,v.wacc,v.terminal,v.netDebt,v.shares].every(finite))return {error:'Supply FCFF, growth, WACC, terminal growth, net debt and shares. Missing inputs are not zero.'};
  if(v.wacc<=v.terminal||v.wacc<=-100||v.growth<=-100||v.shares<=0)return {error:'WACC must exceed terminal growth; growth and WACC must exceed −100%; shares must be positive.'};
  let pv=0,cash=[];for(let y=1;y<=5;y++){let f=v.fcff*(1+v.growth/100)**y;cash.push(f);pv+=f/(1+v.wacc/100)**y;}
  let terminal=cash[4]*(1+v.terminal/100)/(v.wacc/100-v.terminal/100)/(1+v.wacc/100)**5,ev=pv+terminal;
  const result={ev,equityValue:ev-v.netDebt,perShare:(ev-v.netDebt)/v.shares,terminalShare:scale(div(terminal,ev),100),cash};
  return [ev,result.equityValue,result.perShare].every(finite)?result:{error:'The assumptions exceed the supported numeric range.'};
 }
 function project(v,horizon){
  const n=Math.max(1,Math.min(5,Math.trunc(horizon)||5)),rows=[];
  for(let y=1;y<=n;y++){
   const revenue=finite(v.revenue)&&finite(v.growth)&&v.growth>-100?v.revenue*(1+v.growth/100)**y:null;
   const ni=finite(revenue)&&finite(v.forecastMargin)?revenue*v.forecastMargin/100:null;
   const cfo=finite(ni)&&finite(v.forecastConversion)?ni*v.forecastConversion:null;
   rows.push({year:y,revenue,ni,cfo,fcf:sum(cfo,finite(v.capex)?-v.capex:null)});
  }return rows;
 }
 function historical(v,bridge){
  const result={...v};
  if(bridge.enabled){
   // Changes relative to reported CFO; every adjustment must be explicitly supplied.
   result.cfo=sum(v.cfo,bridge.deltaNI,bridge.nonCash,finite(bridge.receivables)?-bridge.receivables:null,finite(bridge.inventory)?-bridge.inventory:null,bridge.liabilities);
  }
  return result;
 }
 function aggregate(records,key){
  const xs=records.map(r=>r.metrics[key]).filter(finite).sort((a,b)=>a-b),n=xs.length;
  return {n,mean:n?xs.reduce((a,b)=>a+b,0)/n:null,median:n?(n%2?xs[(n-1)/2]:(xs[n/2-1]+xs[n/2])/2):null};
 }
 function wacc(v){return [v.re,v.rd,v.debtWeight,v.tax].every(finite)&&v.re>=0&&v.rd>=0&&v.debtWeight>=0&&v.debtWeight<=100&&v.tax>=0&&v.tax<=100?v.re*(1-v.debtWeight/100)+v.rd*(1-v.tax/100)*v.debtWeight/100:null;}
 const api={finite,div,metrics,valuation,project,historical,aggregate,wacc};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FinSightScenario=api;
})(typeof globalThis!=='undefined'?globalThis:this);
