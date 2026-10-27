// FinSight SEC EDGAR proxy. Netlify Functions (Node 18+).
// Configure SEC_USER_AGENT in Netlify environment: "FinSight Research contact@example.com".
const ALIASES={delta:'DAL','delta air lines':'DAL','united':'UAL','united airlines':'UAL','american airlines':'AAL','southwest':'LUV','alaska airlines':'ALK','jetblue':'JBLU','frontier':'ULCC'};
const cache=new Map();
async function secJson(url){const old=cache.get(url);if(old&&Date.now()-old.t<3600000)return old.data;
 const ua=process.env.SEC_USER_AGENT;
 if(!ua||!ua.includes('@'))throw new Error('SEC_USER_AGENT is not configured. Set an identifiable User-Agent with a contact email in Netlify environment variables.');
 const response=await fetch(url,{headers:{'User-Agent':ua,'Accept':'application/json','Accept-Encoding':'gzip, deflate'}});
 if(!response.ok)throw new Error('SEC request failed (HTTP '+response.status+'). SEC may limit cloud-hosted requests. Try again later.');
 const data=await response.json();cache.set(url,{t:Date.now(),data});return data;
}
function yearCandidate(f,year,instant){if(f.form!=='10-K'||f.fy!==year||f.fp!=='FY'||!f.end||f.val===undefined)return false;
 if(instant)return true;
 if(!f.start)return false;const days=(Date.parse(f.end)-Date.parse(f.start))/86400000;return days>=330&&days<=400;
}
function selectFact(facts,tags,year,instant=false){for(const tag of tags){const entries=facts?.facts?.['us-gaap']?.[tag]?.units?.USD||[];
 const matches=entries.filter(f=>yearCandidate(f,year,instant));
 if(!matches.length)continue;
 matches.sort((a,b)=> {const aa=(a.filed||'').localeCompare(b.filed||'');return aa||String(a.accn||'').localeCompare(String(b.accn||''));});
 const f=matches[0];return {value:f.val,tag,year,accession:f.accn,filed:f.filed,periodStart:f.start||null,periodEnd:f.end,form:f.form};}
 return null;}
const TAGS={revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet','RevenueFromContractWithCustomerIncludingAssessedTax','SalesRevenueServicesNet'],
 ni:['NetIncomeLoss','ProfitLoss'],cfo:['NetCashProvidedByUsedInOperatingActivities'],
 ar:['AccountsNotesAndOtherReceivablesNetCurrent','AccountsReceivableNetCurrent','AccountsReceivableNet'],
 assets:['Assets'],equity:['StockholdersEquity','StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
 ca:['AssetsCurrent'],cl:['LiabilitiesCurrent'],cash:['CashAndCashEquivalentsAtCarryingValue','CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
 inventory:['InventoryNet'],securities:['ShortTermInvestments','MarketableSecuritiesCurrent']};
function ratio(n,d){return n!=null&&d!=null&&d!==0?n/d:null}
function growth(cur,prev){return cur!=null&&prev!=null&&prev!==0&&prev>0?(cur/prev-1)*100:null}
function simple(v){return v?.value??null}
function summarize(data,year){const current={},prior={},prior2={};for(const [key,tags] of Object.entries(TAGS)){current[key]=selectFact(data,tags,year,['assets','equity','ca','cl','cash','ar','inventory','securities'].includes(key));prior[key]=selectFact(data,tags,year-1,['assets','equity','ca','cl','cash','ar','inventory','securities'].includes(key));prior2[key]=selectFact(data,tags,year-2,['assets','equity','ca','cl','cash','ar','inventory','securities'].includes(key));}
 const v=k=>simple(current[k]),p=k=>simple(prior[k]);
 const avgEquity=v('equity')!=null&&p('equity')!=null?(v('equity')+p('equity'))/2:null;
 const avgAssets=v('assets')!=null&&p('assets')!=null?(v('assets')+p('assets'))/2:null;
 const currentRatio=ratio(v('ca'),v('cl'));
 const quickRatio=ratio(v('cash')!=null&&v('ar')!=null?v('cash')+v('ar')+(v('securities')||0):null,v('cl'));
 const results={niGrowth:growth(v('ni'),p('ni')),cfoGrowth:growth(v('cfo'),p('cfo')),arGrowth:growth(v('ar'),p('ar')),revenueGrowth:growth(v('revenue'),p('revenue')),
 roe:ratio(v('ni'),avgEquity)!=null?100*ratio(v('ni'),avgEquity):null,
 roa:ratio(v('ni'),avgAssets)!=null?100*ratio(v('ni'),avgAssets):null,
 currentRatio,quickRatio,netIncome:v('ni'),cfo:v('cfo'),currentLiabilities:v('cl'),accruals:v('ni')!=null&&v('cfo')!=null?v('ni')-v('cfo'):null,
 margin:ratio(v('ni'),v('revenue'))!=null?100*ratio(v('ni'),v('revenue')):null};
 return {current,prior,prior2,results,notes:['Values come from standardized SEC US-GAAP company facts. Company-specific custom tags and adjustments are not covered.','Growth is withheld if prior-year base is zero or negative.','ROE and ROA use average beginning/ending balance sheet figures.','Quick ratio is calculated only if cash and receivables are available; marketable securities may be incomplete.','OpROA, net borrowing cost and net debt/equity are not inferred from standard tags without consistent operating/financing classifications.']};}
exports.handler=async event=>{try{if(event.httpMethod!=='GET')return{statusCode:405,body:'Method not allowed'};
 const q=event.queryStringParameters||{},query=String(q.company||'').trim().toLowerCase(),year=Number(q.year);
 if(!query||!Number.isInteger(year)||year<2009||year>new Date().getFullYear())return{statusCode:400,body:JSON.stringify({error:'Enter a company name/ticker and a valid fiscal year.'})};
 const tickers=await secJson('https://www.sec.gov/files/company_tickers.json');
 const ticker=ALIASES[query]||query.toUpperCase();const entries=Object.values(tickers);
 const hit=entries.find(x=>x.ticker?.toUpperCase()===ticker)||entries.find(x=>x.title?.toLowerCase()===query);
 if(!hit)return{statusCode:404,body:JSON.stringify({error:'Company not found in SEC ticker directory. Try a U.S.-listed ticker symbol.'})};
 const cik=String(hit.cik_str).padStart(10,'0');const facts=await secJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
 const summary=summarize(facts,year);
 return{statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=600'},body:JSON.stringify({company:hit.title,ticker:hit.ticker,cik,year,secUrl:`https://www.sec.gov/edgar/browse/?CIK=${cik}`,retrievedAt:new Date().toISOString(),...summary})};
 }catch(e){return{statusCode:503,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message||'SEC service unavailable'})}}};
