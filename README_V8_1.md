# FinSight V8.1 historical evidence and reviewed bridges

This full package replaces V8. It has not been deployed to the live site.

## What changed in the three pages

**Operating ROA:** Interest income is now mapped to the input instead of being intentionally blank. Standard-tag matching is expanded, and missing interest/debt facts can be supplemented from the primary filing. The source review panel displays reported debt, cash and investments. A classification policy can include short-term investments as non-operating assets and optionally treat operating leases as financing. Confirming the policy populates operating liabilities, non-operating assets and debt, then calculates the supported metrics. These categories remain reviewed judgments rather than claimed reported subtotals.

**Earnings Quality:** CapEx and both receivables balances are supplemented from the primary annual filing when standard Company Facts tags do not cover them. Actual period dates, issuer identity, source tags, document links and the reported net CapEx definition are retained. The simple receivables balance change is not equated with the cash-flow statement working-capital adjustment. A missing input does not block unrelated outputs.

**Valuation:** Reviewed debt and non-operating asset classifications populate net debt. The FCFF candidate shows CFO, reported CapEx, interest expense, optional removal of non-operating interest income and a historical tax proxy. Confirmation fills the base input and the scenario copy. Expense/income proxies are not verified cash interest and cash tax adjustments; normalization and lease treatment still need review. Forecast growth, WACC and perpetual growth remain explicit assumptions. An optional 5% / 10% / 2% teaching starter is labeled illustrative, not an issuer forecast.

## Primary filing fallback

The function first uses standard annual SEC Company Facts. For missing supplemental inputs, it reads SEC submissions metadata, selects the 10-K matching the requested actual year-end, and fetches its primary Inline XBRL document. It matches a bounded set of reported line labels, verifies the context entity matches the selected CIK, excludes dimensional contexts, verifies USD units and annual durations, and retains current/prior actual dates and accession data. Conflicting duplicates are withheld. Custom tags are preserved as source provenance, not guessed from company names. Expense and CapEx signs are normalized for positive-outflow inputs while preserving the signed source value.

Fallback status is visible. HTTP errors, an absent matching filing, unsupported line labels and unknown values remain distinct from a claim that a company did not disclose a fact. The fallback is bounded to the selected latest 10-K, whose comparatives can supplement the prior year; it does not promise to reconstruct five full annual filings or all custom-tag definitions.

## UAL regression check

Regression fixtures transcribe public UAL FY2025 values to test the complete flow: interest expense 1,373, interest income 611, CapEx net of flight-equipment deposit returns 5,874, receivables 2,391 and prior receivables 2,163, all USD millions. Expected simple FCF is 2,557 and receivables change 228. The fixture tags and markup are explicitly synthetic; they are not claimed to be a downloaded live SEC document.

For the reviewed policy that treats all cash and short-term investments as non-operating and leaves operating leases in operating liabilities, the fixture produces selected debt 24,988, non-operating assets 12,240, operating liabilities 36,178 and net debt 12,748 USD millions. These are policy-specific calculations, not universally correct classifications.

Source for the transcribed regression amounts: https://www.sec.gov/Archives/edgar/data/100517/000010051726000023/ual-20251231.htm . Do not hardcode these values into production data retrieval; the production function fetches the requested issuer/period.

## Deploy and verify

Upload the complete contents at the original repository root, preserve the SEC_USER_AGENT environment variable, commit to the Netlify production branch and wait for Published. Both index.html and netlify/functions (including the new filing-evidence.js helper) must be deployed. The page is self-contained and uses sw-v81.js. The header should show V8.1 and, after loading Overview, SEC backend 8.1. An older backend is explicitly identified.

## Validation limits

Calculation, Inline XBRL parsing, mocked SEC metadata/fetch behavior and full-page simulated DOM tests are included. Parsing fixtures test mixed parent/subsidiary identifiers and dimensional exclusions. Production SEC connectivity and real-browser layout have not been verified; SEC may restrict cloud requests, and unsupported labels or context structures can still leave fields unavailable. No desktop application was controlled.

Run npm test with Node 18+; no package installation is needed. This README supersedes earlier release instructions for this package.
