(function(root){
'use strict';const finite=x=>typeof x==='number'&&Number.isFinite(x);
function empty(){return {cash:0,ar:0,ppe:0,prepaid:0,ap:0,deferred:0,debt:0,revenue:0,expense:0,depreciation:0,cfo:0,cfi:0,cff:0};}
function apply(base,delta,event,amount){
 if(!finite(amount)||amount<=0)return {error:'Enter a positive transaction amount in USD millions.'};
 const d={...delta},a=amount,available=k=>finite(base[k])?base[k]+d[k]:Math.max(0,d[k]);
 const need=(k)=>available(k)>=a;
 switch(event){
 case 'credit':d.ar+=a;d.revenue+=a;break;
 case 'collect':if(!need('ar'))return {error:'Insufficient verified receivables or simulated credit sales.'};d.ar-=a;d.cash+=a;d.cfo+=a;break;
 case 'cashsale':d.cash+=a;d.revenue+=a;d.cfo+=a;break;
 case 'equipment':if(!need('cash'))return {error:'Insufficient verified cash.'};d.cash-=a;d.ppe+=a;d.cfi-=a;break;
 case 'depreciation':if(!need('ppe'))return {error:'Verify PP&E or first simulate an equipment purchase.'};d.ppe-=a;d.expense+=a;d.depreciation+=a;break;
 case 'wage':d.ap+=a;d.expense+=a;break;
 case 'paywage':if(!need('ap')||!need('cash'))return {error:'Verify accrued wages and cash, or first accrue wages in this scenario.'};d.ap-=a;d.cash-=a;d.cfo-=a;break;
 case 'borrow':d.cash+=a;d.debt+=a;d.cff+=a;break;
 case 'repay':if(!need('debt')||!need('cash'))return {error:'Verify debt and cash, or first simulate borrowing.'};d.cash-=a;d.debt-=a;d.cff-=a;break;
 case 'prepay':if(!need('cash'))return {error:'Insufficient verified cash.'};d.cash-=a;d.prepaid+=a;d.cfo-=a;break;
 case 'insurance':if(!need('prepaid'))return {error:'Verify prepaid insurance or first simulate an insurance prepayment.'};d.prepaid-=a;d.expense+=a;break;
 case 'deferred':d.cash+=a;d.deferred+=a;d.cfo+=a;break;
 case 'earn':if(!need('deferred'))return {error:'Verify deferred revenue or first simulate a customer advance.'};d.deferred-=a;d.revenue+=a;break;
 default:return {error:'Select a supported business event.'};
 }return {delta:d};
}
function rows(b,d){const ni=d.revenue-d.expense,da=d.cash+d.ar+d.ppe+d.prepaid,dl=d.ap+d.deferred+d.debt;
 const row=(label,baseline,change)=>({label,baseline:finite(baseline)?baseline:null,change,adjusted:finite(baseline)?baseline+change:null});
 const niBase=b.ni,expenses=finite(b.revenue)&&finite(niBase)?b.revenue-niBase:null,liab=finite(b.assets)&&finite(b.equity)?b.assets-b.equity:null;
 return {income:[row('Revenue',b.revenue,d.revenue),row('Net expenses and other effects including tax',expenses,d.expense),row('Net income',niBase,ni)],
 balance:[row('Cash',b.cash,d.cash),row('Receivables',b.ar,d.ar),row('Prepaid assets',b.prepaid,d.prepaid),row('Net PP&E',b.ppe,d.ppe),row('Total assets',b.assets,da),row('Accrued wages',b.ap,d.ap),row('Deferred revenue',b.deferred,d.deferred),row('Debt in supported scope',b.debt,d.debt),row('Total liabilities derived as assets minus equity',liab,dl),row('Total equity including simulated earnings',b.equity,ni),row('Total liabilities and equity',b.assets,dl+ni)],
 cashflow:[row('Net income',b.ni,ni),row('Other net CFO reconciling adjustments',finite(b.cfo)&&finite(b.ni)?b.cfo-b.ni:null,d.depreciation-d.ar-d.prepaid+d.ap+d.deferred),row('Operating cash flow',b.cfo,d.cfo),row('Investing cash flow',b.cfi,d.cfi),row('Financing cash flow',b.cff,d.cff),row('Ending cash from balance sheet',b.cash,d.cash)],
 checks:{balance:da-dl-ni,cash:d.cash-d.cfo-d.cfi-d.cff,indirect:ni+d.depreciation-d.ar-d.prepaid+d.ap+d.deferred-d.cfo}};
}
const api={empty,apply,rows};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FinSightTransactions=api;
})(typeof globalThis!=='undefined'?globalThis:this);
