// Read only consolidated, matching-entity Inline XBRL facts. Never execute filing content.
const finite=Number.isFinite;
function decode(s){return String(s).replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,h,d)=>String.fromCodePoint(parseInt(h||d,h?16:10))).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"');}
function plain(s){return decode(s.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();}
function attrs(s){const out={};for(const m of s.matchAll(/([\w:.-]+)\s*=\s*["']([^"']*)["']/g))out[m[1].toLowerCase()]=decode(m[2]);return out;}
function element(s,tag){return s.match(new RegExp('<(?:[\\w.-]+:)?'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','i'))?.[1]||null;}
// Row-label rules, tested first against the lightly cleaned label, then against a normalized label
// (allowance / accumulated-depreciation / "net of" qualifiers, parentheticals and dashes removed).
// scope: 'current' = accept only outside the noncurrent part of a balance sheet; 'noncurrent' = the reverse.
const R=(key,re,instant,opts={})=>({key,re,instant,...opts});
const ALLOWANCE=/ValuationReserve|Allowance|Obsolescence|AccumulatedDepreciation|AccumulatedAmortization/i;
const rules=[
 R('netInterest',/^(?:interest expense,? net|interest expense, net of interest income|net interest expense)$/,false),
 R('interest',/^interest expense$/,false),
 R('interestIncome',/^(?:interest income|interest and dividend income|interest and investment income)$/,false),
 R('taxExpense',/^(?:income tax expense|provision for income taxes|income tax provision|provision for taxes on income|income tax expense \(benefit\)|provision for \(benefit from\) income taxes)$/,false),
 R('operatingIncome',/^operating income(?: \(loss\))?$/,false),
 R('capexFlight',/^flight equipment,? including advance payments$/,false),R('capexGround',/^ground property and equipment,? including technology$/,false),
 R('capex',/^(?:capital expenditures(?: for property,? plant,? and equipment)?|(?:purchases?|payments?|additions?|acquisitions?|expenditures?)(?: related)?(?: (?:to|of|for|in))?(?: (?:the )?acquisitions? of)? (?:operating )?property,?(?: plant,?)? and equipment(?:,? (?:and|including) (?:intangible assets|capitalized software|technology|software))?|property,? plant,? and equipment expenditures)$/,false),
 R('reportedDebtCurrent',/^(?:current maturities of (?:long.term )?debt(?:(?:,?| and) finance leases)?(?:,? and other financial liabilities)?|current (?:portion|installments|maturities) of (?:long.term )?debt(?: and finance leases?)?|debt due within one year|long.term debt due within one year)$/,true,{scope:'current'}),
 R('shortDebt',/^(?:short.term debt|short.term borrowings|notes payable|loans and notes payable|notes and loans payable|commercial paper)$/,true,{scope:'current'}),
 R('reportedDebtNoncurrent',/^(?:long.term )?debt(?:(?:,?| and) finance leases)?(?:,? and other financial liabilities)?$/,true,{scope:'noncurrent'}),
 R('leaseCurrent',/^current (?:maturities|portion) of operating leases?(?: liabilities)?$/,true,{scope:'current'}),R('leaseNoncurrent',/^(?:long.term obligations under|noncurrent) operating leases$/,true,{scope:'noncurrent'}),
 R('cash',/^cash and (?:cash )?equivalents$/,true,{scope:'current'}),
 R('securities',/^(?:short.term investments|marketable securities|short.term marketable securities|short.term investments and marketable securities)$/,true,{scope:'current'}),
 R('ar',/^(?:(?:trade )?(?:notes and )?accounts receivable(?:,? trade)?|receivables(?:,? | - )?(?:trade and other)?|trade receivables|accounts receivable,? net and other)$/,true,{scope:'current',exclude:ALLOWANCE}),
 R('inventory',/^(?:inventories|inventory|merchandise inventor(?:y|ies)|product inventories|fuel, expendable parts and supplies inventories|(?:aircraft )?fuel, spare parts and supplies)$/,true,{scope:'current',exclude:ALLOWANCE}),
 R('invEnergy',/^crude oil, products and merchandise$/,true,{scope:'current'}),R('invSupplies',/^materials and supplies$/,true,{scope:'current'}),
 R('prepaid',/^(?:prepaid expenses?|prepayments)(?: and other(?: current)?(?: assets)?)?$/,true,{scope:'current'}),
 R('ppe',/^(?:operating )?property,?(?: plant,?)? and equipment$/,true,{netOnly:true,exclude:ALLOWANCE}),
 R('ppeBare',/^(?:operating )?property,?(?: plant,?)? and equipment$/,true,{exclude:ALLOWANCE}),
 R('accruedWages',/^(?:accrued (?:salaries|wages|compensation|payroll|employee compensation)|employee compensation|salaries and wages payable|employee.related liabilities)(?:(?:,| and| related| other| benefits| costs| expenses| taxes| items| wages| commissions| withholdings))*$/,true,{scope:'current'}),
 R('deferred',/^(?:deferred revenues?|(?:short.term )?unearned revenues?|contract liabilit(?:y|ies)|air traffic liability|advance ticket sales|deferred membership fees)$/,true,{scope:'current'}),
 R('deferredLoyalty',/^(?:frequent flyer|loyalty program) deferred revenue$/,true,{scope:'current'})
];
function cleanLabel(label){return String(label).toLowerCase().replace(/[–—−]/g,'-').replace(/’/g,"'").replace(/\s+/g,' ').replace(/[\s$(:*,]+$/,'').trim();}
function normalizeLabel(label){let s=cleanLabel(label);
 const accumulatedNet=/(?:net of|less) (?:the )?accumulated (?:depreciation|amortization)/.test(s);
 s=s.replace(/\([^)]*\)?/g,' ').replace(/\s+/g,' ');
 s=s.replace(/(?:,|\s-)?\s(?:less|net of|excluding|including|at)\s(?:an?\s)?(?:allowances?|reserves?|accumulated|obsolescence|doubtful|credit|amounts|current|finance|flight|sales|proceeds|non-cash|average|cost|equipment)\b.*$/,'');
 const net=accumulatedNet||/(?:^net |,? net$| - net$)/.test(s.trim());
 s=s.replace(/^(?:total |net )+/,'').replace(/(?:,? net| - net)$/,'').replace(/\s-\s/g,', ').replace(/[\s$(:*,-]+$/,'').replace(/\s+/g,' ').trim();
 return {text:s,net};}
const RANK={current:2,unknown:1,noncurrent:2};
function parseFiling(html,meta){
 const contexts=new Map(),units=new Map();
 for(const m of html.matchAll(/<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/gi)){
  const a=attrs(m[1]),body=m[2],entity=plain(element(body,'identifier')||'');
  if(Number(entity)!==Number(meta.cik)||/\b(?:explicitMember|typedMember)\b/i.test(body))continue;
  const instant=element(body,'instant'),start=element(body,'startDate'),end=element(body,'endDate');
  if(instant||start&&end)contexts.set(a.id,{start:plain(start||''),end:plain(instant||end),instant:!!instant});
 }
 for(const m of html.matchAll(/<(?:[\w.-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?unit>/gi))units.set(attrs(m[1]).id,plain(m[2]));
 const found={};let section='unknown';
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const body=row[1],first=body.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)?.[1];if(first===undefined)continue;
  const label=plain(body.split(/<ix:nonFraction/i)[0]).replace(/[\s$(:*]+$/,'').trim(),raw=cleanLabel(label),norm=normalizeLabel(label);
  // Track the balance-sheet section so current and noncurrent rows with the same label do not collide.
  if(/^current (?:assets|liabilities)$/.test(raw)){section='current';continue;}
  if(/^(?:non-?current|long-term|other) (?:assets|liabilities)(?: and deferred credits)?$/.test(norm.text))section='noncurrent';
  const rowSection=section;
  if(/^total current (?:assets|liabilities)$/.test(raw))section='noncurrent';
  if(/^total (?:liabilities and (?:stockholders'|shareholders'|share owners'|shareowners') equity|liabilities and equity|capitalization and liabilities)/.test(raw))section='unknown';
  if(/^total assets$/.test(raw))section='unknown';
  const rule=rules.find(r=>r.re.test(raw)&&(!r.netOnly||norm.net))||rules.find(r=>r.re.test(norm.text)&&(!r.netOnly||norm.net));if(!rule)continue;
  if(rule.scope==='current'&&rowSection==='noncurrent'||rule.scope==='noncurrent'&&rowSection==='current')continue;
  for(const f of body.matchAll(/<ix:nonFraction\b([^>]*)>([\s\S]*?)<\/ix:nonFraction>/gi)){
   const a=attrs(f[1]),c=contexts.get(a.contextref);if(rule.exclude&&rule.exclude.test(String(a.name||'')))continue;if(!c||c.instant!==rule.instant||!/^\d{4}-\d{2}-\d{2}$/.test(c.end))continue;
   if(!c.instant){const days=(Date.parse(c.end)-Date.parse(c.start))/86400000;if(days<330||days>400)continue;}
   const unit=units.get(a.unitref);if(!unit||!/\bUSD\b/i.test(unit)||a['xsi:nil']==='true'||a['xsi:nil']==='1')continue;
   const txt=plain(f[2]).replace(/[,$\s()]/g,''),scale=Number(a.scale||0);if(!txt||!/^[-+]?\d*\.?\d+$/.test(txt)||!Number.isInteger(scale)||Math.abs(scale)>12)continue;
   let value=Number(txt)*10**scale;if(a.sign==='-')value=-Math.abs(value);if(!finite(value))continue;
   // CapEx is exposed as a positive outflow input, even when rendered as a deduction.
   const reportedSignedValue=value;
   if(rule.key==='netInterest'&&String(a.name).split(':').at(-1)==='InterestIncomeExpenseNonoperatingNet')value=-value;
   else if(['capex','capexFlight','capexGround','interest','netInterest'].includes(rule.key))value=Math.abs(value);
   const key=c.end+':'+rule.key,rank=RANK[rowSection]||1,record={value,reportedSignedValue,tag:a.name,periodStart:c.start||null,periodEnd:c.end,accession:meta.accession,filed:meta.filed,form:'10-K',unit:'USD',sourceMethod:'filing-inline-xbrl',sourceUrl:meta.url,definition:label,rank};
   const old=found[key];
   if(!old){found[key]=record;continue;}
   if(old.value===value)continue;
   // A value inside a classified balance-sheet section outranks the same label in an unclassified note table.
   if(rank>old.rank){found[key]=record;continue;}if(rank<old.rank)continue;
   old.conflict=true;
  }
 }
 for(const k of Object.keys(found))if(found[k].conflict)delete found[k];else delete found[k].rank;
 for(const end of [...new Set(Object.values(found).map(f=>f.periodEnd))]){const g=k=>found[end+':'+k],put=(k,v)=>{found[end+':'+k]=v;};
  const a=g('capexFlight'),b=g('capexGround');if(!g('capex')&&a&&b)put('capex',{...a,value:a.value+b.value,tag:a.tag+' + '+b.tag,sourceMethod:'derived-filing-components',definition:'Flight equipment additions plus ground property/equipment additions',components:[a,b]});
  if(!g('ppe')&&g('ppeBare'))put('ppe',g('ppeBare'));delete found[end+':ppeBare'];
  if(!g('inventory')&&g('invEnergy')){const p=[g('invEnergy'),g('invSupplies')].filter(Boolean);put('inventory',{...p[0],value:p.reduce((x,r)=>x+r.value,0),tag:p.map(r=>r.tag).join(' + '),sourceMethod:'derived-filing-components',definition:p.map(r=>r.definition).join(' + ')});}
  const sd=g('shortDebt'),cd=g('reportedDebtCurrent');if(sd){put('reportedDebtCurrent',cd?{...cd,value:cd.value+sd.value,tag:cd.tag+' + '+sd.tag,sourceMethod:'derived-filing-components',definition:cd.definition+' + '+sd.definition}:{...sd});}
  const dl=g('deferredLoyalty'),dd=g('deferred');if(dl)put('deferred',dd?{...dd,value:dd.value+dl.value,tag:dd.tag+' + '+dl.tag,sourceMethod:'derived-filing-components',definition:dd.definition+' + current '+dl.definition}:{...dl});
 }
 return found;
}
function enrich(history,records){for(const h of history){for(const [key,end]of [['current',h.periods.current],['prior',h.periods.prior],['prior2',h.periods.prior2]]){
 const out=h[key]||{};for(const [id,r]of Object.entries(records))if(id.startsWith(end+':')){const name=id.slice(end.length+1);if(!out[name])out[name]=r;}
 // Use the disclosed combined debt pair together; never mix scopes from different tag families.
 if(out.reportedDebtCurrent&&out.reportedDebtNoncurrent){out.debtCurrent=out.reportedDebtCurrent;out.debtNoncurrent=out.reportedDebtNoncurrent;}
 h[key]=out;
 }recompute(h);}return history;}
const val=(o,k)=>o?.[k]?.value??null,div=(a,b)=>finite(a)&&finite(b)&&b!==0?a/b:null;
function recompute(h){const c=h.current,p=h.prior,v=k=>val(c,k),b=k=>val(p,k),days=(Date.parse(h.periods.current)-Date.parse(h.periods.prior))/86400000,adj=days>=330&&days<=400,avg=k=>adj&&finite(v(k))&&finite(b(k))?(v(k)+b(k))/2:null,g=k=>adj&&finite(v(k))&&finite(b(k))&&b(k)>0?(v(k)/b(k)-1)*100:null,pct=x=>finite(x)?x*100:null;
 h.results={...h.results,niGrowth:g('ni'),cfoGrowth:g('cfo'),arGrowth:g('ar'),revenueGrowth:g('revenue'),roe:pct(div(v('ni'),avg('equity'))),roa:pct(div(v('ni'),avg('assets'))),margin:pct(div(v('ni'),v('revenue'))),currentRatio:div(v('ca'),v('cl')),quickRatio:[v('cash'),v('ar'),v('securities')].every(finite)?div(v('cash')+v('ar')+v('securities'),v('cl')):null,netIncome:v('ni'),cfo:v('cfo'),currentLiabilities:v('cl'),accruals:finite(v('ni'))&&finite(v('cfo'))?v('ni')-v('cfo'):null};
}
async function fallback(history,meta,secJson,secText){const summary=history.at(-1),missing=['ar','interest','interestIncome','capex','debtCurrent','debtNoncurrent','inventory','prepaid','ppe','accruedWages','deferred'].filter(k=>!summary.current[k]||k==='ar'&&!summary.prior[k]);if(!missing.length)return {status:'Standard facts cover the requested supplemental inputs.'};
 try{const submissions=await secJson('https://data.sec.gov/submissions/CIK'+meta.cik+'.json');let recent=submissions.filings?.recent||{},filing;
  const locate=r=>{for(let i=0;i<(r.form||[]).length;i++)if(r.form[i]==='10-K'&&r.reportDate?.[i]===summary.periods.current)return {accession:r.accessionNumber[i],filed:r.filingDate[i],document:r.primaryDocument[i]};};
  filing=locate(recent);
  if(!filing)for(const f of (submissions.filings?.files||[]).filter(f=>Number(String(f.filingFrom).slice(0,4))<=meta.year+1&&Number(String(f.filingTo).slice(0,4))>=meta.year).slice(0,2)){recent=await secJson('https://data.sec.gov/submissions/'+f.name);filing=locate(recent);if(filing)break;}
  if(!filing)return {status:'No matching consolidated 10-K primary document found for fallback.',missing};
  const url='https://www.sec.gov/Archives/edgar/data/'+Number(meta.cik)+'/'+filing.accession.replace(/-/g,'')+'/'+filing.document;
  const html=await secText(url),records=parseFiling(html,{...meta,...filing,url});enrich(history,records);return {status:'Consolidated Inline XBRL fallback checked.',sourceUrl:url,accession:filing.accession,matchedFacts:Object.keys(records).length,missing:['ar','interest','interestIncome','capex','debtCurrent','debtNoncurrent','inventory','prepaid','ppe','accruedWages','deferred'].filter(k=>!summary.current[k])};
 }catch(e){return {status:'Primary filing fallback unavailable: '+e.message,missing};}
}
module.exports={parseFiling,enrich,recompute,fallback,normalizeLabel,cleanLabel,rules};
