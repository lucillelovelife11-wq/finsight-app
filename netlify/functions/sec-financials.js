// FinSight V5.2: fiscal-period validated SEC Company Facts proxy (Netlify Node 18+).
const ALIASES={delta:'DAL','delta air lines':'DAL','united':'UAL','united airlines':'UAL','american airlines':'AAL','southwest':'LUV','alaska airlines':'ALK','jetblue':'JBLU','frontier':'ULCC'};
const cache=new Map();
async function secJson(url){const old=cache.get(url);if(old&&Date.now()-old.t<3600000)return old.data;
 const ua=process.env.SEC_USER_AGENT;if(!ua||!ua.includes('@'))throw new Error('SEC_USER_AGENT is not configured. Provide an identifiable contact email in Netlify environment variables.');
 const response=await fetch(url,{headers:{'User-Agent':ua,'Accept':'application/json','Accept-Encoding':'gzip, deflate'}});
 if(!response.ok)throw new Error('SEC request failed (HTTP '+response.status+'). SEC may limit cloud-hosted requests.');
 const data=await response.json();cache.set(url,{t:Date.now(),data});return data;}
const TAGS={revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet','RevenueFromContractWithCustomerIncludingAssessedTax','SalesRevenueServicesNet'],ni:['NetIncomeLoss','ProfitLoss'],cfo:['NetCashProvidedByUsedInOperatingActivities'],ar:['AccountsNotesAndOtherReceivablesNetCurrent','AccountsReceivableNetCurrent','AccountsReceivableNet'],assets:['Assets'],equity:['StockholdersEquity','StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],ca:['AssetsCurrent'],cl:['LiabilitiesCurrent'],cash:['CashAndCashEquivalentsAtCarryingValue','CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],inventory:['InventoryNet'],securities:['ShortTermInvestments','MarketableSecuritiesCurrent']};
const INSTANT=new Set(['ar','assets','equity','ca','cl','cash','inventory','securities']);
const dayDiff=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000;
const endYear=s=>Number(String(s||'').slice(0,4));
function annualEligible(f,year,instant){if(!['10-K','10-K/A'].includes(f.form)||f.fy!==year||f.fp!=='FY'||!f.end||!Number.isFinite(f.val))return false;
 // SEC 'fy' is the reporting context, not necessarily the fact's actual year. Reject comparative facts.
 if(endYear(f.end)!==year&&endYear(f.end)!==year+1)return false;
 if(!instant){if(!f.start)return false;const days=dayDiff(f.start,f.end);if(days<330||days>400)return false;}
 return true;}
function candidates(facts,tags,year,instant){const all=[];for(let priority=0;priority<tags.length;priority++){const tag=tags[priority];const entries=facts?.facts?.['us-gaap']?.[tag]?.units?.USD||[];
 for(const f of entries)if(annualEligible(f,year,instant))all.push({value:f.val,tag,year,accession:f.accn||null,filed:f.filed||null,periodStart:f.start||null,periodEnd:f.end,form:f.form,priority});}
 return all;}
function dominantPeriod(facts,year){ // Find the year-end used by the most standard balance-sheet/annual flow facts.
 const counts=new Map();for(const [k,tags] of Object.entries(TAGS)){const seen=new Set();for(const f of candidates(facts,tags,year,INSTANT.has(k))){if(!seen.has(f.periodEnd)){counts.set(f.periodEnd,(counts.get(f.periodEnd)||0)+1);seen.add(f.periodEnd);}}}
 const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0].localeCompare(a[0]));return ranked[0]?.[0]||null;}
function selectFact(facts,tags,year,instant,expectedEnd){if(!expectedEnd)return null;const matches=candidates(facts,tags,year,instant).filter(f=>f.periodEnd===expectedEnd);
 // Prefer primary tag, then most recent filing (including amended 10-K); never pick older comparative years.
 matches.sort((a,b)=>a.priority-b.priority||String(b.filed).localeCompare(String(a.filed))||String(b.accession).localeCompare(String(a.accession)));
 const best=matches[0];if(!best)return null;const {priority,...out}=best;return out;}
const val=f=>f?.value??null;
const ratio=(n,d)=>Number.isFinite(n)&&Number.isFinite(d)&&d!==0?n/d:null;
const growth=(n,p)=>Number.isFinite(n)&&Number.isFinite(p)&&p>0?(n/p-1)*100:null;
function summarize(facts,year){const periods={current:dominantPeriod(facts,year),prior:dominantPeriod(facts,year-1),prior2:dominantPeriod(facts,year-2)};
 const current={},prior={},prior2={};for(const [key,tags] of Object.entries(TAGS)){const instant=INSTANT.has(key);current[key]=selectFact(facts,tags,year,instant,periods.current);prior[key]=selectFact(facts,tags,year-1,instant,periods.prior);prior2[key]=selectFact(facts,tags,year-2,instant,periods.prior2);}
 const v=k=>val(current[k]),p=k=>val(prior[k]);
 // Require adjacent fiscal years for growth and opening balance ratios.
 const adjacent=periods.current&&periods.prior&&dayDiff(periods.prior,periods.current)>=330&&dayDiff(periods.prior,periods.current)<=400;
 const avg=(k)=>adjacent&&v(k)!=null&&p(k)!=null?(v(k)+p(k))/2:null;
 const roe=ratio(v('ni'),avg('equity')),roa=ratio(v('ni'),avg('assets'));
 const quickAssets=v('cash')!=null&&v('ar')!=null?v('cash')+v('ar')+(v('securities')||0):null;
 const results={niGrowth:adjacent?growth(v('ni'),p('ni')):null,cfoGrowth:adjacent?growth(v('cfo'),p('cfo')):null,arGrowth:adjacent?growth(v('ar'),p('ar')):null,revenueGrowth:adjacent?growth(v('revenue'),p('revenue')):null,roe:roe==null?null:roe*100,roa:roa==null?null:roa*100,currentRatio:ratio(v('ca'),v('cl')),quickRatio:ratio(quickAssets,v('cl')),netIncome:v('ni'),cfo:v('cfo'),currentLiabilities:v('cl'),accruals:v('ni')!=null&&v('cfo')!=null?v('ni')-v('cfo'):null,margin:ratio(v('ni'),v('revenue'))==null?null:ratio(v('ni'),v('revenue'))*100};
 const warnings=[];if(!periods.current)warnings.push('No eligible FY'+year+' 10-K facts with matching fiscal period were found.');if(!adjacent)warnings.push('Prior-year fiscal periods are not comparable; growth and average-balance ratios are withheld.');
 for(const [k,f] of Object.entries(current))if(f&&f.periodEnd!==periods.current)warnings.push('Period mismatch for '+k+'; withheld.');
 return {periods,periodValidated:!!periods.current,current,prior,prior2,results,warnings,notes:['V5.2 validates each fact actual period end against the selected fiscal-year reporting period; SEC fy alone is insufficient.','Flow values require a 330–400-day annual duration; balance-sheet values are point-in-time.','Each value includes its original XBRL tag, accession, filing date, and actual fact period.','Annual 10-K/10-K/A company facts only; custom tags, operating classifications, and some company-specific facts are not covered.','Growth is withheld when the prior-year denominator is zero or negative or the reporting periods are not comparable.','ROE and ROA use average beginning/ending balance sheet values; these are not Operating ROA.','Screening flags are not evidence of manipulation.']};}
exports.handler=async event=>{try{if(event.httpMethod!=='GET')return{statusCode:405,body:'Method not allowed'};
 const q=event.queryStringParameters||{},query=String(q.company||'').trim().toLowerCase(),year=Number(q.year),years=Math.max(1,Math.min(5,Number(q.years)||1));
 if(!query||!Number.isInteger(year)||year<2009||year>new Date().getFullYear())return{statusCode:400,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Enter a company/ticker and a valid fiscal year.'})};
 const tickers=await secJson('https://www.sec.gov/files/company_tickers.json'),ticker=ALIASES[query]||query.toUpperCase(),entries=Object.values(tickers);
 const exact=entries.find(x=>x.ticker?.toUpperCase()===ticker)||entries.find(x=>x.title?.toLowerCase()===query);
 const matches=entries.filter(x=>x.title?.toLowerCase().startsWith(query)||x.title?.toLowerCase().includes(query));
 const hit=exact||(matches.length===1?matches[0]:null);
 if(!hit&&matches.length>1)return{statusCode:409,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Ambiguous company name. Choose a ticker or full company name.',matches:matches.slice(0,8).map(x=>({ticker:x.ticker,name:x.title}))})};
 if(!hit)return{statusCode:404,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Company not found. Try its U.S.-listed ticker.'})};
 const cik=String(hit.cik_str).padStart(10,'0'),facts=await secJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`),summary=summarize(facts,year);
 const history=Array.from({length:years},(_,i)=>year-years+1+i).map(y=>({year:y,...summarize(facts,y)}));
 return{statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=600'},body:JSON.stringify({version:'6.0',company:hit.title,ticker:hit.ticker,cik,year,history,secUrl:`https://www.sec.gov/edgar/browse/?CIK=${cik}`,retrievedAt:new Date().toISOString(),...summary})};
 }catch(e){return{statusCode:503,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'SEC service unavailable'})}}};
// Exposed only for local regression tests; no network calls are made by these helpers.
exports._test={annualEligible,dominantPeriod,selectFact,summarize};
