// Read only consolidated, matching-entity Inline XBRL facts. Never execute filing content.
const finite=Number.isFinite;
function decode(s){return String(s).replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,h,d)=>String.fromCodePoint(parseInt(h||d,h?16:10))).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"');}
function plain(s){return decode(s.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();}
function attrs(s){const out={};for(const m of s.matchAll(/([\w:.-]+)\s*=\s*["']([^"']*)["']/g))out[m[1].toLowerCase()]=decode(m[2]);return out;}
function element(s,tag){return s.match(new RegExp('<(?:[\\w.-]+:)?'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','i'))?.[1]||null;}
const rules=[
 ['ar',/^(?:accounts )?receivables(?:,? net)?(?: of.*)?$/i,true],
 ['netInterest',/^interest expense,? net$/i,false],['interest',/^interest expense$/i,false],['interestIncome',/^interest income$/i,false],
 ['capex',/^capital expenditures(?:,? net of.*)?$/i,false],['capexFlight',/^flight equipment,? including advance payments$/i,false],['capexGround',/^ground property and equipment,? including technology$/i,false],
 ['reportedDebtCurrent',/^current maturities of (?:long.term )?debt(?:(?:,?| and) finance leases)?(?:,? and other financial liabilities)?$/i,true],
 ['reportedDebtNoncurrent',/^(?:long.term )?debt(?:(?:,?| and) finance leases)?(?:,? and other financial liabilities)?(?:,? net)?$/i,true],
 ['leaseCurrent',/^current maturities of operating leases$/i,true],['leaseNoncurrent',/^(?:long.term obligations under|noncurrent) operating leases$/i,true],
 ['operatingIncome',/^operating income(?: \(loss\))?$/i,false],['taxExpense',/^income tax expense(?: \(benefit\))?$/i,false],
 ['cash',/^cash and cash equivalents$/i,true],['securities',/^short.term investments$/i,true]
];
function parseFiling(html,meta){
 const contexts=new Map(),units=new Map();
 for(const m of html.matchAll(/<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/gi)){
  const a=attrs(m[1]),body=m[2],entity=plain(element(body,'identifier')||'');
  if(Number(entity)!==Number(meta.cik)||/\b(?:explicitMember|typedMember)\b/i.test(body))continue;
  const instant=element(body,'instant'),start=element(body,'startDate'),end=element(body,'endDate');
  if(instant||start&&end)contexts.set(a.id,{start:plain(start||''),end:plain(instant||end),instant:!!instant});
 }
 for(const m of html.matchAll(/<(?:[\w.-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?unit>/gi))units.set(attrs(m[1]).id,plain(m[2]));
 const found={};
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const body=row[1],first=body.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)?.[1];if(first===undefined)continue;
  const label=plain(body.split(/<ix:nonFraction/i)[0]).replace(/[\s$(:*]+$/,'').trim(),rule=rules.find(r=>r[1].test(label));if(!rule)continue;
  for(const f of body.matchAll(/<ix:nonFraction\b([^>]*)>([\s\S]*?)<\/ix:nonFraction>/gi)){
   const a=attrs(f[1]),c=contexts.get(a.contextref);if(!c||c.instant!==rule[2]||!/^\d{4}-\d{2}-\d{2}$/.test(c.end))continue;
   if(!c.instant){const days=(Date.parse(c.end)-Date.parse(c.start))/86400000;if(days<330||days>400)continue;}
   const unit=units.get(a.unitref);if(!unit||!/\bUSD\b/i.test(unit)||a['xsi:nil']==='true'||a['xsi:nil']==='1')continue;
   const txt=plain(f[2]).replace(/[,$\s()]/g,''),scale=Number(a.scale||0);if(!txt||!/^[-+]?\d*\.?\d+$/.test(txt)||!Number.isInteger(scale)||Math.abs(scale)>12)continue;
   let value=Number(txt)*10**scale;if(a.sign==='-')value=-Math.abs(value);if(!finite(value))continue;
   // CapEx is exposed as a positive outflow input, even when rendered as a deduction.
   const reportedSignedValue=value;
   if(rule[0]==='netInterest'&&String(a.name).split(':').at(-1)==='InterestIncomeExpenseNonoperatingNet')value=-value;
   else if(['capex','capexFlight','capexGround','interest','netInterest'].includes(rule[0]))value=Math.abs(value);
   const key=c.end+':'+rule[0],record={value,reportedSignedValue,tag:a.name,periodStart:c.start||null,periodEnd:c.end,accession:meta.accession,filed:meta.filed,form:'10-K',unit:'USD',sourceMethod:'filing-inline-xbrl',sourceUrl:meta.url,definition:label};
   if(found[key]&&found[key].value!==value){found[key].conflict=true;continue;}
   if(!found[key])found[key]=record;
  }
 }
 for(const k of Object.keys(found))if(found[k].conflict)delete found[k];
 for(const end of [...new Set(Object.values(found).map(f=>f.periodEnd))]){const a=found[end+':capexFlight'],b=found[end+':capexGround'];if(!found[end+':capex']&&a&&b)found[end+':capex']={...a,value:a.value+b.value,tag:a.tag+' + '+b.tag,sourceMethod:'derived-filing-components',definition:'Flight equipment additions plus ground property/equipment additions',components:[a,b]};}
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
async function fallback(history,meta,secJson,secText){const summary=history.at(-1),missing=['ar','interest','interestIncome','capex','debtCurrent','debtNoncurrent'].filter(k=>!summary.current[k]||k==='ar'&&!summary.prior[k]);if(!missing.length)return {status:'Standard facts cover the requested supplemental inputs.'};
 try{const submissions=await secJson('https://data.sec.gov/submissions/CIK'+meta.cik+'.json');let recent=submissions.filings?.recent||{},filing;
  const locate=r=>{for(let i=0;i<(r.form||[]).length;i++)if(r.form[i]==='10-K'&&r.reportDate?.[i]===summary.periods.current)return {accession:r.accessionNumber[i],filed:r.filingDate[i],document:r.primaryDocument[i]};};
  filing=locate(recent);
  if(!filing)for(const f of (submissions.filings?.files||[]).filter(f=>Number(String(f.filingFrom).slice(0,4))<=meta.year+1&&Number(String(f.filingTo).slice(0,4))>=meta.year).slice(0,2)){recent=await secJson('https://data.sec.gov/submissions/'+f.name);filing=locate(recent);if(filing)break;}
  if(!filing)return {status:'No matching consolidated 10-K primary document found for fallback.',missing};
  const url='https://www.sec.gov/Archives/edgar/data/'+Number(meta.cik)+'/'+filing.accession.replace(/-/g,'')+'/'+filing.document;
  const html=await secText(url),records=parseFiling(html,{...meta,...filing,url});enrich(history,records);return {status:'Consolidated Inline XBRL fallback checked.',sourceUrl:url,accession:filing.accession,matchedFacts:Object.keys(records).length,missing:['ar','interest','interestIncome','capex','debtCurrent','debtNoncurrent'].filter(k=>!summary.current[k])};
 }catch(e){return {status:'Primary filing fallback unavailable: '+e.message,missing};}
}
module.exports={parseFiling,enrich,recompute,fallback};
