const test=require('node:test');const assert=require('node:assert/strict');
const {_test:E}=require('../netlify/functions/sec-financials.js');
const flow=val=>({val,form:'10-K',fy:2025,fp:'FY',start:'2025-01-01',end:'2025-12-31',filed:'2026-02-01',accn:'test'});
const instant=val=>{const f=flow(val);delete f.start;return f;};
test('valuation extraction keeps shares distinct from dollars and retains provenance',()=>{
 const tags={Revenues:{units:{USD:[flow(100)]}},Assets:{units:{USD:[instant(500)]}},WeightedAverageNumberOfDilutedSharesOutstanding:{units:{shares:[flow(300e6)],USD:[flow(999)]}},PaymentsToAcquirePropertyPlantAndEquipment:{units:{USD:[flow(50)]}},LongTermDebtCurrent:{units:{USD:[instant(20)]}},LongTermDebtNoncurrent:{units:{USD:[instant(80)]}},InterestExpense:{units:{USD:[flow(5)]}}};
 const f={facts:{'us-gaap':tags}};
 const r=E.summarize(f,2025);assert.equal(r.current.shares.value,300e6);assert.equal(r.current.shares.unit,'shares');assert.equal(r.current.capex.value,50);assert.equal(r.current.debtCurrent.value,20);assert.equal(r.current.debtNoncurrent.value,80);assert.equal(r.current.interest.value,5);assert.equal(r.current.shares.accession,'test');
});
test('missing CapEx and wrong-unit shares remain unavailable',()=>{
 const tags={Assets:{units:{USD:[instant(500)]}},WeightedAverageNumberOfDilutedSharesOutstanding:{units:{USD:[flow(999)]}}};
 const f={facts:{'us-gaap':tags}};
 const r=E.summarize(f,2025);assert.equal(r.current.shares,null);assert.equal(r.current.capex,null);
});
