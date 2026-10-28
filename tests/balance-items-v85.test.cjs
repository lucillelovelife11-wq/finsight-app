const test=require('node:test'),assert=require('node:assert/strict'),F=require('../netlify/functions/filing-evidence.js'),S=require('../netlify/functions/sec-financials.js')._test,harness=require('./v8-dom.cjs');
const meta={cik:'0000027904',accession:'T',filed:'2026-02-10',url:'https://www.sec.gov/test'};
const ctx=(id,end)=>`<xbrli:context id="${id}"><xbrli:entity><xbrli:identifier>0000027904</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>${end}</xbrli:instant></xbrli:period></xbrli:context>`;
const fact=(name,c,v)=>`<ix:nonFraction name="${name}" contextRef="${c}" unitRef="usd" scale="6">${v}</ix:nonFraction>`;
const row=(label,cells)=>`<tr><td>${label}</td>${cells.map(x=>'<td>'+x+'</td>').join('')}</tr>`;
function dalHtml(){return ctx('now','2025-12-31')+ctx('old','2024-12-31')+'<xbrli:unit id="usd"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>'+
 // Delta-style label with the obsolescence allowance tagged inside the label cell.
 `<tr><td>Fuel, expendable parts and supplies inventories, net of allowance for obsolescence of $${fact('us-gaap:InventoryValuationReserves','now','124')} and $${fact('us-gaap:InventoryValuationReserves','old','120')}</td><td>${fact('us-gaap:AirlineRelatedInventoryNet','now','1,601')}</td><td>${fact('us-gaap:AirlineRelatedInventoryNet','old','1,428')}</td></tr>`+
 row('Prepaid expenses and other',[fact('dal:PrepaidAndOther','now','2,207'),fact('dal:PrepaidAndOther','old','2,123')])+
 `<tr><td>Property and equipment, net of accumulated depreciation and amortization of $${fact('us-gaap:AccumulatedDepreciation','now','23,000')} and $${fact('us-gaap:AccumulatedDepreciation','old','21,000')}</td><td>${fact('dal:PPE','now','39,740')}</td><td>${fact('dal:PPE','old','37,000')}</td></tr>`+
 row('Accrued salaries and related benefits',[fact('dal:AccruedSalaries','now','4,906'),fact('dal:AccruedSalaries','old','4,762')])+
 row('Air traffic liability',[fact('us-gaap:ContractWithCustomerLiabilityCurrent','now','7,200'),fact('us-gaap:ContractWithCustomerLiabilityCurrent','old','6,900')]);}
test('filing fallback reads inventory, prepaid, PP&E, accrued wages and deferred revenue rows, ignoring embedded allowances',()=>{const r=F.parseFiling(dalHtml(),meta),v=k=>r['2025-12-31:'+k]?.value/1e6;
 assert.equal(v('inventory'),1601);assert.equal(r['2024-12-31:inventory'].value/1e6,1428);assert.equal(v('prepaid'),2207);assert.equal(v('ppe'),39740);assert.equal(v('accruedWages'),4906);assert.equal(v('deferred'),7200);});
test('inventory with no total tag is composed from components or gross less LIFO',()=>{const f=(v,t)=>({value:v,tag:t,periodEnd:'2025-12-31'});
 const a={invFG:f(500,'FG'),invWIP:f(200,'WIP'),invRaw:f(300,'Raw')};S.composeInventory(a);assert.equal(a.inventory.value,1000);assert.equal(a.inventory.sourceMethod,'derived-components');
 const b={invGross:f(900,'G'),invLifo:f(100,'L')};S.composeInventory(b);assert.equal(b.inventory.value,800);
 const c={inventory:f(1,'InventoryNet'),invFG:f(5,'x'),invWIP:f(5,'y')};S.composeInventory(c);assert.equal(c.inventory.value,1);});
test('standard airline tag is picked from Company Facts',()=>{const facts={facts:{'us-gaap':{AirlineRelatedInventoryNet:{units:{USD:[{val:1601e6,end:'2025-12-31',fy:2025,fp:'FY',form:'10-K',filed:'2026-02-10',accn:'a'}]}},Assets:{units:{USD:[{val:81317e6,end:'2025-12-31',fy:2025,fp:'FY',form:'10-K',filed:'2026-02-10',accn:'a'}]}}}}};
 const s=S.summarize(facts,2025);assert.equal(s.current.inventory.value,1601e6);assert.equal(s.current.inventory.tag,'AirlineRelatedInventoryNet');});
test('transaction simulator balance sheet shows prepaid, PP&E, accrued wages and deferred revenue',async()=>{const current={};for(const [k,v]of Object.entries({ni:5005,cfo:8342,revenue:63364,assets:81317,equity:20853,cash:4310,ar:2850,prepaid:2207,ppe:39740,accruedWages:4906,deferred:7200,debtCurrent:1605,debtNoncurrent:12507}))current[k]={value:v*1e6,tag:'T',periodEnd:'2025-12-31'};
 const h={year:2025,periods:{current:'2025-12-31',prior:'2024-12-31'},current,prior:{},results:{},notes:[]};const p=harness({...h,company:'DELTA AIR LINES, INC.',ticker:'DAL',cik:'27904',version:'8.5',year:2025,retrievedAt:'t',history:[h]});
 assert.deepEqual(p.errors,[]);p.get('globalCompany').value='DAL';p.get('globalYear').value='2025';await p.get('workspaceLoad').click();
 const html=p.get('txBS').innerHTML;for(const n of ['2,207','39,740','4,906','7,200'])assert.match(html,new RegExp('<td>'+n+'</td>'),n);});
