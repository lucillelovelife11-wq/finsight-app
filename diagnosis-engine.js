(function(root){
'use strict';const finite=x=>typeof x==='number'&&Number.isFinite(x),ratio=(a,b)=>finite(a)&&finite(b)&&b!==0?a/b:null;
const questions=[
 ['operations','margin','Is profitability changing with revenue?',['revenueGrowth','margin','priorMargin']],
 ['operations','efficiency','How efficiently are assets generating sales?',['turnover','revenueGrowth','assetGrowth']],
 ['operations','growth','Are revenue and earnings growing together?',['revenueGrowth','niGrowth','margin']],
 ['shareholders','roe','What drives shareholder return?',['roe','margin','turnover','leverage']],
 ['shareholders','equity','Is the equity base changing the ROE interpretation?',['equity','priorEquity','equityGrowth','roe']],
 ['shareholders','returns','How do shareholder and asset returns differ?',['roe','roa','leverage']],
 ['cash','earnings','Are earnings changes supported by cash?',['niGrowth','cfoGrowth','arGrowth','revenueGrowth','ni','cfo']],
 ['cash','accruals','What explains the income to cash gap?',['ni','cfo','accruals','cashConversion']],
 ['cash','investment','Does operating cash cover reported capital expenditure?',['cfo','capex','fcf','capexCoverage']],
 ['liquidity','liquidity','Does the current ratio hide asset-quality questions?',['currentRatio','quickRatio','cash','ar']],
 ['liquidity','coverage','How does cash generation compare with current obligations?',['cl','cash','cfo','cfoCoverage']],
 ['liquidity','receivables','Are receivables keeping pace with sales?',['ar','priorAr','arGrowth','revenueGrowth']]
];
const categories={operations:'Operations and profitability',shareholders:'Shareholder returns and capital structure',cash:'Cash generation and earnings quality',liquidity:'Liquidity and working capital'};
const meta={revenueGrowth:['Revenue growth','%',['revenue']],niGrowth:['Net income growth','%',['ni']],cfoGrowth:['Operating cash flow growth','%',['cfo']],arGrowth:['Receivables growth','%',['ar']],assetGrowth:['Asset growth','%',['assets']],equityGrowth:['Equity growth','%',['equity']],margin:['Net margin','%',['ni','revenue']],priorMargin:['Prior-year net margin','%',['ni','revenue']],turnover:['Asset turnover','×',['revenue','assets']],leverage:['Equity multiplier','×',['assets','equity']],roe:['ROE','%',['ni','equity']],roa:['Simple ROA','%',['ni','assets']],revenue:['Revenue','USD m',['revenue']],ni:['Net income','USD m',['ni']],cfo:['Operating cash flow','USD m',['cfo']],ar:['Receivables','USD m',['ar']],priorAr:['Prior-year receivables','USD m',['ar']],equity:['Ending equity','USD m',['equity']],priorEquity:['Beginning equity','USD m',['equity']],cl:['Current liabilities','USD m',['cl']],cash:['Cash','USD m',['cash']],capex:['Capital expenditure outflow','USD m',['capex']],fcf:['Simple CFO less CapEx','USD m',['cfo','capex']],accruals:['Net income minus CFO','USD m',['ni','cfo']],cashConversion:['CFO / net income','×',['cfo','ni']],capexCoverage:['CFO / CapEx','×',['cfo','capex']],currentRatio:['Current ratio','×',['ca','cl']],quickRatio:['Quick ratio','×',['cash','securities','ar','cl']],cfoCoverage:['Annual CFO / ending current liabilities','×',['cfo','cl']]};
function metrics(data){const c=data?.current||{},p=data?.prior||{},value=(obj,k)=>finite(obj[k]?.value)?obj[k].value/1e6:null,v=k=>value(c,k),prior=k=>value(p,k);
 const gap=(Date.parse(data?.periods?.current)-Date.parse(data?.periods?.prior))/86400000,adjacent=gap>=330&&gap<=400;
 const growth=k=>adjacent&&finite(v(k))&&finite(prior(k))&&prior(k)>0?(v(k)/prior(k)-1)*100:null;
 const average=k=>adjacent&&finite(v(k))&&finite(prior(k))?(v(k)+prior(k))/2:null;
 const percent=x=>finite(x)?x*100:null;
 const avgAssets=average('assets'),avgEquity=average('equity');
 const result={revenue:v('revenue'),ni:v('ni'),cfo:v('cfo'),ar:v('ar'),priorAr:adjacent?prior('ar'):null,equity:v('equity'),priorEquity:adjacent?prior('equity'):null,cash:v('cash'),cl:v('cl'),capex:v('capex'),margin:percent(ratio(v('ni'),v('revenue'))),priorMargin:adjacent?percent(ratio(prior('ni'),prior('revenue'))):null,turnover:ratio(v('revenue'),avgAssets),leverage:ratio(avgAssets,avgEquity),roe:percent(ratio(v('ni'),avgEquity)),roa:percent(ratio(v('ni'),avgAssets)),currentRatio:ratio(v('ca'),v('cl')),quickRatio:[v('cash'),v('securities'),v('ar')].every(finite)?ratio(v('cash')+v('securities')+v('ar'),v('cl')):null,accruals:finite(v('ni'))&&finite(v('cfo'))?v('ni')-v('cfo'):null,cashConversion:ratio(v('cfo'),v('ni')),fcf:finite(v('cfo'))&&finite(v('capex'))?v('cfo')-v('capex'):null,capexCoverage:ratio(v('cfo'),v('capex')),cfoCoverage:ratio(v('cfo'),v('cl'))};
 for(const [key,tag] of [['revenueGrowth','revenue'],['niGrowth','ni'],['cfoGrowth','cfo'],['arGrowth','ar'],['assetGrowth','assets'],['equityGrowth','equity']])result[key]=growth(tag);
 return result;
}
function evidence(data,key,manual){const [label,unit,keys]=meta[key],values=metrics(data),sources=[];
 for(const k of keys)for(const [period,obj] of [['current',data?.current],['prior',data?.prior]]){const f=obj?.[k];if(f)sources.push({item:k,period,tag:f.tag,start:f.periodStart,end:f.periodEnd,filed:f.filed,accession:f.accession,value:f.value,unit:f.unit||'USD'});}
 if(manual&&finite(manual.value)&&String(manual.note||'').trim())return {key,label,unit,value:manual.value,source:'Manual supplement or adjustment',reason:manual.note,sources};
 return {key,label,unit,value:values[key],source:'SEC facts or derived from SEC facts',reason:finite(values[key])?'':'Missing source facts, a zero or negative growth denominator, a zero ratio denominator, or noncomparable fiscal periods. Missing data do not block the remaining evidence.',sources};
}
function explain(key,value){if(!finite(value))return 'This metric is unavailable. Continue with the other evidence and retain this limitation; supply a manual value only when you have a documented source.';
 const guides={roe:'ROE combines margin, asset efficiency and the equity multiplier. A positive or high ROE alone does not establish strong operations; inspect equity signs and the other drivers.',roa:'Simple ROA uses net income and average assets. It mixes operating and financing effects and is not Operating ROA.',leverage:'This is average assets divided by average equity, not a debt-to-equity ratio. Negative or very small equity makes conventional interpretation unreliable.',cashConversion:'Compare cash with income, then read the cash-flow reconciliation. Small or negative income makes this multiple difficult to interpret.',quickRatio:'This stricter liquidity lens requires cash, securities, receivables and current liabilities. No missing securities balance is treated as zero.',cfoCoverage:'This compares an annual flow with an ending liability balance; it is not a promise that liabilities can all be paid immediately.',fcf:'CFO less CapEx is a simple cash-generation measure, not automatically valuation FCFF.',capex:'Check the capital expenditure tag and whether deposit returns or asset-sale proceeds are included in the reported subtotal.'};
 if(guides[key])return guides[key];if(key.endsWith('Growth'))return 'Compare direction and magnitude with related growth rates. A single-year difference can reflect timing or a prior-year base effect; inspect multiple comparable years.';
 if(key==='accruals')return value<0?'CFO exceeds net income. Inspect noncash charges, customer advances and working-capital movements before treating that as recurring cash strength.':value>0?'Net income exceeds CFO. Investigate cash collection, working-capital investment and noncash gains; this gap alone is not evidence of manipulation.':'Net income equals CFO in the supplied period; the underlying reconciliation still matters.';
 return 'Read this figure alongside the next related metric, its prior-period definition and the filing notes. The value alone is not a good-or-bad classification.';
}
const api={questions,categories,meta,metrics,evidence,explain};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FinSightDiagnosis=api;
})(typeof globalThis!=='undefined'?globalThis:this);
