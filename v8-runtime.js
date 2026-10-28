(function(){
'use strict';const E=FinSightScenario,$=id=>document.getElementById(id),esc=diagEsc,finite=E.finite;
const read=id=>{const raw=$(id).value.trim();return raw!==''&&Number.isFinite(Number(raw))?Number(raw):null;};
const fmt=v=>finite(v)?v.toLocaleString('en-US',{maximumFractionDigits:2}):'Unavailable';
const identity=()=>secWorkspace?secWorkspace.company+' ('+secWorkspace.ticker+') · FY'+secWorkspace.year:'Teaching example · load an issuer in Overview';
const card=(label,value,unit,missing=[])=>`<div class="metric"><small>${esc(label)}</small><strong>${fmt(value)}${finite(value)?' '+unit:''}</strong>${!finite(value)?'<p class="small">Needs: '+missing.map(esc).join(', ')+'</p>':''}</div>`;
const operatingLabels={netInterest:'Reported net interest expense',oni:'Net income',iex:'Interest expense',irev:'Interest income',tax:'Tax rate',oa:'Total assets',ol:'Operating liabilities',noaasset:'Non-operating assets',orev:'Operating revenue',debt:'Debt in the selected scope',ose:'Equity'};
function missing(keys){return keys.filter(k=>read(k)===null).map(k=>operatingLabels[k]||k);}
function mark(ids){for(const id of ids){const empty=read(id)===null;$(id).classList.toggle('missing-input',empty);$(id).setAttribute('aria-invalid',empty?'true':'false');}}
opcalc=function(){const v=Object.fromEntries(Object.keys(operatingLabels).map(k=>[k,read(k)])),has=ks=>ks.every(k=>finite(v[k]));
 const validTax=finite(v.tax)&&v.tax>=0&&v.tax<=100;
 const net=finite(v.netInterest)?v.netInterest:has(['iex','irev'])?v.iex-v.irev:null;
 const nopat=has(['oni','tax'])&&finite(net)&&validTax?v.oni+net*(1-v.tax/100):null;
 const interestKeys=finite(v.netInterest)?['oni','netInterest','tax']:['oni','iex','irev','tax'];
 const noa=has(['oa','ol','noaasset'])?v.oa-v.ol-v.noaasset:null;
 const op=finite(nopat)&&finite(noa)&&noa!==0?nopat/noa*100:null,margin=finite(nopat)&&finite(v.orev)&&v.orev!==0?nopat/v.orev*100:null,turn=finite(noa)&&noa!==0&&finite(v.orev)?v.orev/noa:null,netDebt=has(['debt','noaasset'])?v.debt-v.noaasset:null;
 const specs=[['NOPAT',nopat,'USD m',interestKeys],['Net operating assets',noa,'USD m',['oa','ol','noaasset']],['Operating ROA ending-balance illustration',op,'%',[...interestKeys,'oa','ol','noaasset']],['Operating profit margin',margin,'%',[...interestKeys,'orev']],['Operating asset turnover',turn,'×',['oa','ol','noaasset','orev']],['Debt less classified non-operating assets',netDebt,'USD m',['debt','noaasset']]];
 $('opResults').innerHTML=specs.map(([l,x,u,ks])=>card(l,x,u,missing(ks).length?missing(ks):['a valid tax rate or nonzero denominator'])).join('');
 const count=specs.filter(s=>finite(s[1])).length,all=Object.keys(operatingLabels).filter(k=>finite(v.netInterest)?!['iex','irev'].includes(k):k!=='netInterest'),notFound=missing(all);mark(all);if(finite(v.netInterest))for(const id of ['iex','irev']){$(id).classList.remove('missing-input');$(id).setAttribute('aria-invalid','false');$(id).placeholder='Not needed: reported net interest is used';}
 $('opInsight').innerHTML=`<p><strong>${esc(identity())}</strong></p><p>${count} of 6 operating indicators calculated. Missing classifications affect only the indicators that depend on them.</p>${!validTax&&finite(v.tax)?'<p class="scenario-error">Tax rate must be between 0% and 100%.</p>':''}<p><strong>Why a field may be empty:</strong> operating liabilities and non-operating assets require a classification policy. SEC totals do not by themselves identify those categories. Review the relevant debt, lease, investment and working-capital notes; a blank is not zero.</p>${finite(noa)&&noa<=0?'<p class="scenario-error">NOA is nonpositive; conventional operating return interpretation is unreliable.</p>':''}<p>Net income, revenue, assets and equity are issuer facts when available. Tax proxies are labeled estimates. Debt and equity are not required for NOPAT/NOA itself. This formula uses ending NOA; average-NOA period returns require an independently matched opening classification.</p>`;
 $('calc-feedback-opcalc').textContent=identity()+' — '+count+'/6 indicators calculated. '+(notFound.length?'Still needed where relevant: '+notFound.join('; ')+'.':'All fields supplied.');
};
const dcfLabels={fcff:'Base FCFF',growth:'Forecast FCFF growth',wacc:'WACC',terminal:'Terminal growth',netdebt:'Net debt',shares:'Diluted shares'};
dcf=function(){const v=Object.fromEntries(Object.keys(dcfLabels).map(k=>[k,read(k)])),core=['fcff','growth','wacc','terminal'],absent=core.filter(k=>!finite(v[k]));mark(Object.keys(dcfLabels));
 let result=null,error='';
 if(!absent.length){result=E.valuation({...v,netDebt:0,shares:1});if(result.error){error=result.error;result=null;}}
 const ev=result?.ev??null,eq=finite(ev)&&finite(v.netdebt)?ev-v.netdebt:null,perShare=finite(eq)&&finite(v.shares)&&v.shares>0?eq/v.shares:null;
 $('dcfResults').innerHTML=card('Enterprise value',ev,'USD m',absent.length?absent.map(k=>dcfLabels[k]):[error||'valid discount assumptions'])+card('Equity value',eq,'USD m',[...(!finite(ev)?['enterprise value']:[]),...(!finite(v.netdebt)?['reviewed net debt']:[])])+card('Value per share',perShare,'USD',[...(!finite(eq)?['equity value']:[]),...(!finite(v.shares)||v.shares<=0?['positive diluted shares']:[])]);
 $('dcfChart').innerHTML=result?result.cash.map((x,i)=>`<div class="bar" style="height:${Math.max(5,Math.abs(x)/Math.max(1,...result.cash.map(Math.abs))*110)}px"><span>${fmt(x)}</span><em>Y${i+1}</em></div>`).join(''):'';
 const missingKeys=Object.keys(dcfLabels).filter(k=>!finite(v[k]));
 $('dcfInsight').innerHTML=`<p><strong>${esc(identity())}</strong></p>${error?'<p class="scenario-error">'+esc(error)+'</p>':''}<p>${finite(ev)?'Enterprise value calculated. Net debt and share count affect only the later equity and per-share steps.':'Supply the four FCFF and discount assumptions to calculate enterprise value.'}</p><ul>${missingKeys.map(k=>'<li>'+esc(dcfLabels[k])+': '+(['growth','wacc','terminal'].includes(k)?'forward-looking assumption; not a financial-statement fact.':k==='shares'?'requires a reported or reviewed share count; see linked evidence above.':'requires a reviewed cash-flow or capital-claims bridge; see linked evidence above.')+'</li>').join('')}</ul><p>Use the linked evidence and explicit bridge-review buttons above. The optional teaching assumption set is labeled illustrative and is not an issuer forecast.</p>`;
 $('calc-feedback-dcf').textContent=identity()+' — '+(finite(ev)?'Enterprise value updated.':'Enterprise value not yet available. ')+(missingKeys.length?'Missing: '+missingKeys.map(k=>dcfLabels[k]).join('; '):'All fields supplied.');
};
function status(){const el=$('v8BuildStatus');if(!el)return;el.textContent='FinSight V8 · page '+(globalThis.__FINSIGHT_V8_ERRORS?.length?'has a startup error':'ready')+' · SEC backend '+(secWorkspace?.version||'not loaded');
 $('v8BackendNotice').textContent=secWorkspace&&secWorkspace.version!=='8.0'?'The SEC backend is '+(secWorkspace.version||'unversioned')+'. Deploy the V8 function as well as index.html; newer source fields may otherwise remain unavailable.':'';
}
const sync=updateContextBars;updateContextBars=function(){sync();opcalc();dcf();status();};
for(const id of Object.keys(operatingLabels))$(id).addEventListener('input',opcalc);
for(const id of Object.keys(dcfLabels))$(id).addEventListener('input',dcf);
// Initial output is also rendered for empty inputs: a section must never silently stay blank.
opcalc();dcf();status();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw-v8.js').catch(()=>{$('v8BackendNotice').textContent+=' Offline caching could not initialize; the online page can still operate.';});
})();
