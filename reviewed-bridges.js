(function(root){
'use strict';const f=Number.isFinite,v=(h,k)=>f(h?.current?.[k]?.value)?h.current[k].value/1e6:null;
function bridges(h,policy={investments:true,leases:false,excludeInterestIncome:true}){
 const keys=['ni','cfo','capex','interest','interestIncome','taxExpense','assets','equity','cash','securities','leaseCurrent','leaseNoncurrent'];const x=Object.fromEntries(keys.map(k=>[k,v(h,k)]));
 const pair=h?.current?.reportedDebtCurrent&&h?.current?.reportedDebtNoncurrent?['reportedDebtCurrent','reportedDebtNoncurrent']:['debtCurrent','debtNoncurrent'];
 x.debtCurrent=v(h,pair[0]);x.debtNoncurrent=v(h,pair[1]);x.liabilities=v(h,'liabilities');if(!f(x.liabilities)&&f(x.assets)&&f(x.equity))x.liabilities=x.assets-x.equity;
 const taxBase=f(x.ni)&&f(x.taxExpense)?x.ni+x.taxExpense:null;x.tax=f(taxBase)&&taxBase>0&&x.taxExpense>=0&&x.taxExpense<=taxBase?x.taxExpense/taxBase*100:null;
 const missing=[],requireValue=(key,reason)=>{if(!f(x[key]))missing.push(reason);};
 for(const key of ['debtCurrent','debtNoncurrent','cash','liabilities'])requireValue(key,key);
 if(policy.investments)requireValue('securities','short-term investments');if(policy.leases){requireValue('leaseCurrent','current operating lease liabilities');requireValue('leaseNoncurrent','noncurrent operating lease liabilities');}
 const debt=f(x.debtCurrent)&&f(x.debtNoncurrent)&&(!policy.leases||f(x.leaseCurrent)&&f(x.leaseNoncurrent))?x.debtCurrent+x.debtNoncurrent+(policy.leases?x.leaseCurrent+x.leaseNoncurrent:0):null;
 const nonOpAssets=f(x.cash)&&(!policy.investments||f(x.securities))?x.cash+(policy.investments?x.securities:0):null;
 const opLiabilities=f(x.liabilities)&&f(debt)?x.liabilities-debt:null,netDebt=f(debt)&&f(nonOpAssets)?debt-nonOpAssets:null;
 const fcffMissing=['cfo','capex','interest','tax'].filter(k=>!f(x[k]));if(policy.excludeInterestIncome&&!f(x.interestIncome))fcffMissing.push('interestIncome');
 const fcff=fcffMissing.length?null:x.cfo-x.capex+(x.interest-(policy.excludeInterestIncome?x.interestIncome:0))*(1-x.tax/100);
 return {inputs:x,debt,nonOpAssets,opLiabilities,netDebt,fcff,missing:[...new Set(missing)],fcffMissing,policy};
}
if(typeof module!=='undefined'&&module.exports)module.exports={bridges};else root.FinSightBridges={bridges};
})(typeof globalThis!=='undefined'?globalThis:this);
