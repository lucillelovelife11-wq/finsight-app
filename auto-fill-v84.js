(function(){
'use strict';
// FinSight V8.4: after Overview loads an issuer, map every remaining blank Operating ROA and
// Valuation input from the loaded SEC data (or a labeled fallback), so no red field is left
// empty. Only blank fields are filled; anything the user typed is never overwritten.
const $=id=>document.getElementById(id),f=Number.isFinite;
const read=id=>{const el=$(id);if(!el)return null;const raw=String(el.value).trim();return raw!==''&&f(Number(raw))?Number(raw):null;};
const fact=(h,k)=>f(h?.current?.[k]?.value)?h.current[k].value/1e6:null;
const first=(...xs)=>{for(const x of xs)if(f(x))return x;return null;};
const r2=x=>Number(x.toFixed(2));
const ILLUSTRATIVE={growth:5,wacc:10,terminal:2},STATUTORY_TAX=21;

// Pure mapping: SEC history + current page values -> {inputId:{value,how}}
function plan(h,page){
 const b=globalThis.FinSightBridges?FinSightBridges.bridges(h):{inputs:{}},x=b.inputs||{},out={};
 const put=(id,value,how)=>{if(f(value))out[id]={value:r2(value),how};};
 // Debt: reviewed pair, then any single side / combined total tag, then what is already on the page.
 const dc=first(x.debtCurrent,fact(h,'debtCurrentAlt')),dn=first(x.debtNoncurrent,fact(h,'debtNoncurrentAlt')),dt=fact(h,'debtTotal');
 let debt=null,debtHow='';
 if(f(b.debt)){debt=b.debt;debtHow='current + noncurrent debt (SEC)';}
 else if(f(dc)&&f(dn)){debt=dc+dn;debtHow='current + noncurrent debt (SEC)';}
 else if(f(dt)){debt=dt;debtHow='total long-term debt tag (SEC)';}
 else if(f(dc)||f(dn)){debt=(dc||0)+(dn||0);debtHow='only one debt component reported in SEC data; review';}
 else if(f(page.debt)){debt=page.debt;debtHow='value already on page';}
 if(f(debt)&&!f(page.debt))put('debt',debt,debtHow);
 const debtUsed=first(page.debt,debt);
 // Total liabilities: Liabilities tag, else assets − equity (SEC or page values).
 const assets=first(x.assets,page.oa),equity=first(x.equity,page.ose);
 const liabilities=first(fact(h,'liabilities'),f(assets)&&f(equity)?assets-equity:null);
 // Operating liabilities = total liabilities − interest-bearing debt.
 if(f(liabilities)){
  if(f(debtUsed))put('ol',liabilities-debtUsed,'total liabilities − interest-bearing debt');
  else put('ol',liabilities,'total liabilities (no debt found, so none removed); enter debt to refine');
 }
 // Non-operating assets = cash and equivalents (cash-only policy); securities used only if cash is absent.
 const cash=x.cash,sec=x.securities;
 if(f(cash))put('noaasset',cash,'cash and cash equivalents');else if(f(sec))put('noaasset',sec,'short-term investments (cash not reported)');
 const noa=first(page.noaasset,out.noaasset?.value);
 // Tax rate: page value, effective-rate proxy, else statutory 21%.
 const tax=first(page.tax,x.tax);
 if(!f(page.tax))put('tax',f(x.tax)?x.tax:STATUTORY_TAX,f(x.tax)?'income tax expense / pre-tax income':'U.S. statutory 21% (effective rate unavailable)');
 const t=first(tax,STATUTORY_TAX);
 // Base FCFF = CFO − CapEx + net interest × (1 − t); falls back to CFO − CapEx when interest is unknown.
 const cfo=first(x.cfo,page.qocf),capex=first(x.capex,page.qcapex);
 const netInt=first(page.netInterest,b.netInterest,f(page.iex)&&f(page.irev)?page.iex-page.irev:null,page.iex,x.interest);
 if(f(b.fcff))put('fcff',b.fcff,'CFO − CapEx + net interest × (1 − tax)');
 else if(f(cfo)&&f(capex))put('fcff',cfo-capex+(f(netInt)?netInt*(1-t/100):0),f(netInt)?'CFO − CapEx + net interest × (1 − tax)':'CFO − CapEx (interest not found)');
 else if(f(cfo))put('fcff',cfo,'CFO only (CapEx not found); review');
 // Net debt = debt − non-operating assets.
 if(f(debtUsed)&&f(noa))put('netdebt',debtUsed-noa,'interest-bearing debt − non-operating assets');
 else if(f(debtUsed))put('netdebt',debtUsed,'interest-bearing debt (no cash found)');
 // Forecast assumptions are not in any filing: fill with the labeled illustrative starter.
 for(const [id,v]of Object.entries(ILLUSTRATIVE))put(id,v,'illustrative assumption, not an issuer forecast');
 const shares=fact(h,'shares');if(f(shares))put('shares',shares,'diluted weighted-average shares (SEC)');
 return out;
}

const TARGETS={operating:['ol','noaasset','debt','tax'],valuation:['fcff','growth','wacc','terminal','netdebt','shares']};
const LABELS={ol:'Operating liabilities',noaasset:'Non-operating assets',debt:'Interest-bearing debt',tax:'Tax rate',fcff:'Base FCFF',growth:'Growth',wacc:'WACC',terminal:'Terminal growth',netdebt:'Net debt',shares:'Diluted shares'};

function fill(){
 const h=secWorkspace?.history?.at(-1);if(!h)return {};
 const page={};for(const id of ['oa','ose','debt','tax','netInterest','iex','irev','qocf','qcapex','noaasset'])page[id]=read(id);
 const p=plan(h,page),filled={};
 for(const group of Object.values(TARGETS))for(const id of group){
  const el=$(id),m=p[id];if(!el||!m||read(id)!==null)continue;
  el.value=String(m.value);el.dataset.origin='auto-mapped';el.dataset.syncedValue=String(m.value);el.title='Auto-filled: '+m.how;
  el.classList.add('provisional-input');el.classList.remove('missing-input');el.setAttribute('aria-invalid','false');filled[id]=m;
 }
 // Values already on the page but derived by earlier modules also get an explanation.
 for(const id of ['ol','noaasset','fcff','netdebt'])if(!filled[id]&&p[id]&&$(id)&&!$(id).title)$(id).title='Auto-filled: '+p[id].how;
 if(typeof opcalc==='function')opcalc();
 if(typeof dcf==='function')dcf();
 const note=(id,group,lead)=>{const el=$(id);if(!el)return;const rows=group.filter(k=>p[k]&&read(k)!==null).map(k=>LABELS[k]+' = '+read(k)+' ('+(filled[k]?.how||p[k].how)+')');
  el.textContent=lead+(rows.length?' Auto-mapped from Overview data: '+rows.join('; ')+'. Highlighted fields are editable provisional values.':'');};
 const who=secWorkspace.company+' ('+secWorkspace.ticker+') · FY'+secWorkspace.year+' —';
 note('automatic-operating-status',['ol','noaasset','debt','tax'],who);
 note('automatic-valuation-status',['fcff','netdebt','shares','growth','wacc','terminal'],who+' growth 5%, WACC 10% and terminal 2% are illustrative teaching assumptions, not an issuer forecast; replace them with your own.');
 return filled;
}

const sync=updateContextBars;
updateContextBars=function(){sync();fill();};
globalThis.FinSightAutoFill={plan,fill};
// Editing a highlighted value turns it into a user value.
for(const id of [...TARGETS.operating,...TARGETS.valuation])$(id)?.addEventListener('input',()=>{$(id).classList.remove('provisional-input');$(id).dataset.origin='user';});
const status=$('v8BuildStatus');if(status)status.textContent='FinSight V8.4 · page ready · SEC backend '+(secWorkspace?.version||'not loaded');
})();
